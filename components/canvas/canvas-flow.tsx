"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { LiveCursors } from "@/components/canvas/ai-activity";
import { CanvasControls } from "@/components/canvas/canvas-controls";
import { CanvasEdgeView } from "@/components/canvas/canvas-edge";
import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { NodeShape } from "@/components/canvas/node-shape";
import {
  IMPORT_TEMPLATE_EVENT,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { ShapePanel } from "@/components/canvas/shape-panel";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { useCanvasLoad } from "@/hooks/use-canvas-load";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  isCanvasShape,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

// Defined at module level so React Flow gets a stable reference.
const nodeTypes: NodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeView };

const edgeTypes: EdgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeView };

// New connections use the custom edge: light rounded stroke with an arrowhead.
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f8fafc" },
  style: { stroke: "#f8fafc", strokeWidth: 1, strokeLinecap: "round" },
};

function readPayload(event: DragEvent): ShapeDragPayload | null {
  const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      isCanvasShape((parsed as ShapeDragPayload).shape) &&
      typeof (parsed as ShapeDragPayload).width === "number" &&
      typeof (parsed as ShapeDragPayload).height === "number"
    ) {
      return parsed as ShapeDragPayload;
    }
  } catch {
    // ignore malformed payloads
  }
  return null;
}

interface ShapePreview extends ShapeDragPayload {
  zoom: number;
  /** Cursor position in viewport coordinates; null until the cursor is over the canvas. */
  x: number | null;
  y: number | null;
}

let transparentImage: HTMLImageElement | null = null;
function getTransparentImage() {
  if (!transparentImage) {
    transparentImage = new Image();
    transparentImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  return transparentImage;
}

function Canvas({ projectId }: { projectId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  // Persistence: load the saved canvas into an empty room, then autosave changes.
  const loadState = useCanvasLoad(
    projectId,
    nodes.length > 0 || edges.length > 0
  );
  useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: loadState === "ready",
  });
  const { screenToFlowPosition, addNodes, getZoom } = useReactFlow<
    CanvasNode,
    CanvasEdge
  >();
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const counter = useRef(0);

  // Starter templates replace the whole canvas through the shared flow state.
  useEffect(() => {
    let cancelled = false;

    async function onImport(event: Event) {
      const template = (event as CustomEvent<CanvasTemplate>).detail;
      const { deleteElements, addNodes, addEdges, getNodes, getEdges, fitView } =
        reactFlow;

      await deleteElements({ nodes: getNodes(), edges: getEdges() });
      if (cancelled) return;

      // Fresh ids so re-importing never collides with just-removed elements.
      const stamp = Date.now();
      const rename = (id: string) => `${id}-${stamp}`;
      const copy = structuredClone(template);
      addNodes(copy.nodes.map((n) => ({ ...n, id: rename(n.id) })));
      addEdges(
        copy.edges.map((e) => ({
          ...e,
          id: rename(e.id),
          source: rename(e.source),
          target: rename(e.target),
        }))
      );

      // Let React Flow measure the new nodes before fitting.
      setTimeout(() => void fitView({ duration: 300, padding: 0.2 }), 100);
    }

    window.addEventListener(IMPORT_TEMPLATE_EVENT, onImport);
    return () => {
      cancelled = true;
      window.removeEventListener(IMPORT_TEMPLATE_EVENT, onImport);
    };
  }, [reactFlow]);

  const [preview, setPreview] = useState<ShapePreview | null>(null);

  const onDragStart = useCallback(
    (event: DragEvent) => {
      const payload = readPayload(event);
      if (!payload) return;
      // Hide the browser's default drag image; the ghost preview replaces it.
      event.dataTransfer.setDragImage(getTransparentImage(), 0, 0);
      setPreview({ ...payload, zoom: getZoom(), x: null, y: null });
    },
    [getZoom]
  );

  const clearPreview = useCallback(() => setPreview(null), []);

  const onDragLeave = useCallback((event: DragEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setPreview((p) => (p ? { ...p, x: null, y: null } : p));
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const { clientX, clientY } = event;
    setPreview((p) => (p ? { ...p, x: clientX, y: clientY } : p));
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      setPreview(null);
      const payload = readPayload(event);
      if (!payload) return;
      event.preventDefault();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      counter.current += 1;

      addNodes({
        id: `${payload.shape}-${Date.now()}-${counter.current}`,
        type: CANVAS_NODE_TYPE,
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      });
    },
    [screenToFlowPosition, addNodes]
  );

  return (
    <div
      className="h-full w-full"
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={clearPreview}
    >
      {preview && preview.x !== null && preview.y !== null && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 opacity-50"
          style={{
            left: 0,
            top: 0,
            width: preview.width,
            height: preview.height,
            transform: `translate(${preview.x}px, ${preview.y}px) scale(${preview.zoom})`,
            transformOrigin: "top left",
          }}
        >
          <NodeShape shape={preview.shape} color={DEFAULT_NODE_COLOR} />
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        colorMode="dark"
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap pannable zoomable />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Panel position="bottom-left" className="z-10">
          <CanvasControls />
        </Panel>
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
        <LiveCursors />
      </ReactFlow>
    </div>
  );
}

/** React Flow bound to Liveblocks Storage (suspends until storage is ready). */
export function CanvasFlow({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <Canvas projectId={projectId} />
    </ReactFlowProvider>
  );
}
