import { anthropic } from "@ai-sdk/anthropic";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "../../types/canvas";
import { AI_STATUS_FEED_ID, AI_USER_ID } from "../../types/tasks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

/** AI presence identity and feed ID come from types/tasks.ts. */
const AI_USER_INFO = { name: "Ghost AI", avatar: "", color: "#BF7AF0" };
// Presence expires on its own if the task dies before clearing it (seconds).
const PRESENCE_TTL = 60;
const PRESENCE_CLEAR_TTL = 2;
const PRESENCE_HEARTBEAT_MS = 20_000;

const MODEL_ID = "claude-sonnet-5-5";
const GRID = 20;
const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;
const MAX_ACTIONS = 80;

const FILLS = NODE_COLORS.map((c) => c.fill) as [string, ...string[]];

// Flat action schema: one shape with a `type` discriminator keeps the
// structured-output JSON schema simple for the model.
const actionSchema = z.object({
  type: z.enum([
    "add_node",
    "move_node",
    "resize_node",
    "update_node",
    "delete_node",
    "add_edge",
    "delete_edge",
  ]),
  id: z
    .string()
    .describe("Node or edge id. For add_*, a new short kebab-case id."),
  shape: z.enum(NODE_SHAPES).nullable().describe("add_node/update_node"),
  label: z.string().nullable().describe("Node or edge label"),
  color: z
    .enum(FILLS)
    .nullable()
    .describe("Node fill color, must be from the palette"),
  x: z.number().nullable().describe("Node x (move_node/add_node)"),
  y: z.number().nullable().describe("Node y (move_node/add_node)"),
  width: z.number().nullable().describe("resize_node/add_node"),
  height: z.number().nullable().describe("resize_node/add_node"),
  source: z.string().nullable().describe("add_edge: source node id"),
  target: z.string().nullable().describe("add_edge: target node id"),
});

const planSchema = z.object({
  summary: z
    .string()
    .describe("One short sentence describing what was designed or changed"),
  actions: z.array(actionSchema).max(MAX_ACTIONS),
});

type Action = z.infer<typeof actionSchema>;

const SYSTEM_PROMPT = `You are Ghost AI, a system-design agent that edits a shared architecture canvas.
Turn the user's request into a list of canvas actions. Prefer extending the existing canvas over replacing it; only delete things the user asked to remove or that must change.

Action types: add_node, move_node, resize_node, update_node, delete_node, add_edge, delete_edge.

Rules
- Shapes (only these): ${NODE_SHAPES.join(", ")}. Use rectangle for services/apps, cylinder for databases/storage, pill for queues/streams/gateways, hexagon for external/third-party systems, circle for clients/actors, diamond for decisions/routers.
- Colors: fill must be exactly one of ${FILLS.join(", ")}. ${DEFAULT_NODE_COLOR} is neutral; use color to group by role (e.g. blue for services, green for data, orange for messaging, purple for AI, teal for infra, red for security/edge).
- Default sizes: ${NODE_SHAPES.map((s) => `${s} ${SHAPE_DEFAULT_SIZES[s].width}x${SHAPE_DEFAULT_SIZES[s].height}`).join(", ")}. Omit width/height to use the default.
- Layout: flow left-to-right (or top-to-bottom) in clear layers. Positions are the node's top-left corner, multiples of ${GRID}. Keep at least ${GRID * 4}px between node edges, never overlap existing nodes, and start new content below/right of existing content.
- Labels: short (1-3 words), Title Case.
- Edges connect existing or newly added node ids; label them only when the relationship is meaningful (e.g. "HTTPS", "publishes").
- Reuse ids from the current canvas for move/resize/update/delete. New ids must be unique, short kebab-case.
- Order actions so nodes are added before edges that use them.
- Keep the design focused: usually 5-15 nodes.
- Fields that do not apply to an action must be null.`;

function createLiveblocks(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  return new Liveblocks({ secret });
}

type StatusKind = "start" | "processing" | "complete" | "error";

async function pushStatus(
  liveblocks: Liveblocks,
  roomId: string,
  runId: string,
  kind: StatusKind,
  message: string
) {
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: { kind, text: message, runId },
    });
  } catch (err) {
    // Status is best-effort; never fail the design run because of it.
    logger.warn("Failed to publish AI status", { err: String(err) });
  }
}

async function setAiPresence(
  liveblocks: Liveblocks,
  roomId: string,
  data: { cursor: { x: number; y: number } | null; thinking: boolean },
  ttl = PRESENCE_TTL
) {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data,
      userInfo: AI_USER_INFO,
      ttl,
    });
  } catch (err) {
    logger.warn("Failed to update AI presence", { err: String(err) });
  }
}

const snap = (n: number) => Math.round(n / GRID) * GRID;
const num = (n: number | null | undefined, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? n : fallback;

function pickColor(color: string | null | undefined): string {
  return color && FILLS.includes(color) ? color : DEFAULT_NODE_COLOR;
}

function pickShape(shape: string | null | undefined): CanvasNodeShape {
  return (NODE_SHAPES as readonly string[]).includes(shape ?? "")
    ? (shape as CanvasNodeShape)
    : "rectangle";
}

function sizeOf(node: CanvasNode) {
  const fallback = SHAPE_DEFAULT_SIZES[node.data.shape] ?? {
    width: 160,
    height: 80,
  };
  return {
    width: node.width ?? node.measured?.width ?? fallback.width,
    height: node.height ?? node.measured?.height ?? fallback.height,
  };
}

/** Pick handle sides so edges leave/enter facing each other. */
function handleSides(from: CanvasNode, to: CanvasNode) {
  const a = sizeOf(from);
  const b = sizeOf(to);
  const dx = to.position.x + b.width / 2 - (from.position.x + a.width / 2);
  const dy = to.position.y + b.height / 2 - (from.position.y + a.height / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}

function describeCanvas(nodes: readonly CanvasNode[], edges: readonly CanvasEdge[]) {
  if (nodes.length === 0 && edges.length === 0) return "The canvas is empty.";
  return JSON.stringify({
    nodes: nodes.map((n) => ({
      id: n.id,
      label: n.data.label,
      shape: n.data.shape,
      color: n.data.color,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      ...sizeOf(n),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.data?.label ?? null,
    })),
  });
}

/**
 * Applies one validated action through the shared Liveblocks flow. Returns the
 * canvas point the AI cursor should move to, or null when nothing changed.
 */
async function applyAction(
  liveblocks: Liveblocks,
  roomId: string,
  action: Action,
  runId: string,
  idMap: Map<string, string>
): Promise<{ x: number; y: number } | null> {
  let cursor: { x: number; y: number } | null = null;
  const resolve = (id: string | null) => (id ? (idMap.get(id) ?? id) : "");

  await mutateFlow<CanvasNode, CanvasEdge>(
    { client: liveblocks, roomId },
    (flow) => {
      switch (action.type) {
        case "add_node": {
          const shape = pickShape(action.shape);
          const defaults = SHAPE_DEFAULT_SIZES[shape];
          const baseId = action.id.replace(/[^a-z0-9-]/gi, "-") || shape;
          // Always namespace by run so AI ids never collide with user nodes.
          let id = `ai-${runId.slice(-6)}-${baseId}`;
          while (flow.getNode(id)) id += "-x";
          idMap.set(action.id, id);

          const position = { x: snap(num(action.x, 0)), y: snap(num(action.y, 0)) };
          flow.addNode({
            id,
            type: CANVAS_NODE_TYPE,
            position,
            width: Math.max(MIN_NODE_WIDTH, num(action.width, defaults.width)),
            height: Math.max(MIN_NODE_HEIGHT, num(action.height, defaults.height)),
            data: {
              label: action.label ?? "",
              color: pickColor(action.color),
              shape,
            },
          });
          cursor = position;
          break;
        }
        case "move_node": {
          const node = flow.getNode(resolve(action.id));
          if (!node) return;
          const position = {
            x: snap(num(action.x, node.position.x)),
            y: snap(num(action.y, node.position.y)),
          };
          flow.updateNode(node.id, { position });
          cursor = position;
          break;
        }
        case "resize_node": {
          const node = flow.getNode(resolve(action.id));
          if (!node) return;
          const size = sizeOf(node);
          flow.updateNode(node.id, {
            width: Math.max(MIN_NODE_WIDTH, num(action.width, size.width)),
            height: Math.max(MIN_NODE_HEIGHT, num(action.height, size.height)),
          });
          cursor = node.position;
          break;
        }
        case "update_node": {
          const node = flow.getNode(resolve(action.id));
          if (!node) return;
          flow.updateNodeData(node.id, {
            ...(action.label !== null ? { label: action.label } : {}),
            ...(action.color !== null ? { color: pickColor(action.color) } : {}),
            ...(action.shape !== null ? { shape: pickShape(action.shape) } : {}),
          });
          cursor = node.position;
          break;
        }
        case "delete_node": {
          const node = flow.getNode(resolve(action.id));
          if (!node) return;
          // Drop connected edges so none are left dangling.
          flow.removeEdges(
            flow.edges
              .filter((e) => e.source === node.id || e.target === node.id)
              .map((e) => e.id)
          );
          flow.removeNode(node.id);
          cursor = node.position;
          break;
        }
        case "add_edge": {
          const source = flow.getNode(resolve(action.source));
          const target = flow.getNode(resolve(action.target));
          if (!source || !target || source.id === target.id) return;
          if (
            flow.edges.some((e) => e.source === source.id && e.target === target.id)
          ) {
            return;
          }
          let id = `ai-${runId.slice(-6)}-${source.id}-${target.id}`;
          while (flow.getEdge(id)) id += "-x";
          flow.addEdge({
            id,
            type: CANVAS_EDGE_TYPE,
            source: source.id,
            target: target.id,
            ...handleSides(source, target),
            markerEnd: { type: "arrowclosed", color: "#f8fafc" },
            style: { stroke: "#f8fafc", strokeWidth: 1, strokeLinecap: "round" },
            ...(action.label ? { data: { label: action.label } } : {}),
          } as CanvasEdge);
          const size = sizeOf(target);
          cursor = {
            x: target.position.x + size.width / 2,
            y: target.position.y + size.height / 2,
          };
          break;
        }
        case "delete_edge": {
          const edge = flow.getEdge(action.id);
          if (!edge) return;
          flow.removeEdge(edge.id);
          break;
        }
      }
    }
  );

  return cursor;
}

/** Interprets a prompt with Claude and edits the shared canvas in real time. */
export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  // Edits are not idempotent, so a retry would duplicate nodes.
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId } = payload;
    const runId = ctx.run.id;
    const liveblocks = createLiveblocks();
    let lastCursor: { x: number; y: number } | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    try {
      await setAiPresence(liveblocks, roomId, { cursor: null, thinking: true });
      // Keep the AI visible during slow model calls (presence has a TTL).
      heartbeat = setInterval(() => {
        void setAiPresence(liveblocks, roomId, {
          cursor: lastCursor,
          thinking: true,
        });
      }, PRESENCE_HEARTBEAT_MS);
      await pushStatus(liveblocks, roomId, runId, "start", "Ghost AI started working");

      // Read the current canvas through the same flow utility used for edits.
      let current: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] } = {
        nodes: [],
        edges: [],
      };
      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        current = flow.toJSON();
      });

      await pushStatus(
        liveblocks,
        roomId,
        runId,
        "processing",
        "Thinking through the design…"
      );

      const { output: plan } = await generateText({
        model: anthropic(MODEL_ID),
        system: SYSTEM_PROMPT,
        prompt: `Current canvas:\n${describeCanvas(current.nodes, current.edges)}\n\nUser request:\n${prompt}`,
        output: Output.object({ schema: planSchema }),
      });

      const actions = plan.actions;
      logger.log("Design plan ready", { actions: actions.length });

      if (actions.length === 0) {
        await pushStatus(
          liveblocks,
          roomId,
          runId,
          "complete",
          plan.summary || "No canvas changes were needed"
        );
        return { roomId, applied: 0, summary: plan.summary };
      }

      await pushStatus(
        liveblocks,
        roomId,
        runId,
        "processing",
        `Applying ${actions.length} changes to the canvas`
      );

      const idMap = new Map<string, string>();
      let applied = 0;
      for (const action of actions) {
        // Apply one action per flush so collaborators watch the design build up.
        const cursor = await applyAction(liveblocks, roomId, action, runId, idMap);
        if (cursor) {
          applied += 1;
          lastCursor = cursor;
          await setAiPresence(liveblocks, roomId, { cursor, thinking: true });
        }
      }

      await pushStatus(
        liveblocks,
        roomId,
        runId,
        "complete",
        `${plan.summary || "Design updated"} (${applied} change${applied === 1 ? "" : "s"})`
      );
      return { roomId, applied, summary: plan.summary };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Design agent failed", { message });
      await pushStatus(
        liveblocks,
        roomId,
        runId,
        "error",
        "Something went wrong while designing. The canvas was left as is."
      );
      throw err;
    } finally {
      clearInterval(heartbeat);
      // Short TTL so the AI participant drops out of the room right away.
      await setAiPresence(
        liveblocks,
        roomId,
        { cursor: null, thinking: false },
        PRESENCE_CLEAR_TTL
      );
    }
  },
});
