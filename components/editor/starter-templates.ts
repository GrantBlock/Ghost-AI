import { MarkerType } from "@xyflow/react";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Window event the editor shell dispatches and the canvas listens for. */
export const IMPORT_TEMPLATE_EVENT = "ghostie:import-template";

type ColorName =
  | "neutral"
  | "blue"
  | "purple"
  | "orange"
  | "red"
  | "pink"
  | "green"
  | "teal";

const COLOR_INDEX: Record<ColorName, number> = {
  neutral: 0,
  blue: 1,
  purple: 2,
  orange: 3,
  red: 4,
  pink: 5,
  green: 6,
  teal: 7,
};

type Side = "top" | "right" | "bottom" | "left";

/** Node at (x, y) using the shape's default size and a palette fill color. */
function node(
  id: string,
  shape: CanvasNodeShape,
  label: string,
  x: number,
  y: number,
  color: ColorName = "neutral"
): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    ...SHAPE_DEFAULT_SIZES[shape],
    data: { label, color: NODE_COLORS[COLOR_INDEX[color]].fill, shape },
  };
}

/** Edge between two nodes; defaults to right -> left. */
function edge(
  source: string,
  target: string,
  options: { from?: Side; to?: Side; label?: string } = {}
): CanvasEdge {
  const { from = "right", to = "left", label } = options;
  return {
    id: `${source}-${target}`,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    sourceHandle: from,
    targetHandle: to,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f8fafc" },
    style: { stroke: "#f8fafc", strokeWidth: 1, strokeLinecap: "round" },
    ...(label ? { data: { label } } : {}),
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "API gateway routing client requests to services with their own databases.",
  nodes: [
    node("client", "pill", "Client", 0, 200, "blue"),
    node("gateway", "hexagon", "API Gateway", 260, 192, "purple"),
    node("auth", "rectangle", "Auth Service", 560, 20, "green"),
    node("orders", "rectangle", "Orders Service", 560, 200, "green"),
    node("payments", "rectangle", "Payments Service", 560, 380, "green"),
    node("auth-db", "cylinder", "Users DB", 840, 10, "orange"),
    node("orders-db", "cylinder", "Orders DB", 840, 190, "orange"),
    node("payments-db", "cylinder", "Payments DB", 840, 370, "orange"),
  ],
  edges: [
    edge("client", "gateway"),
    edge("gateway", "auth"),
    edge("gateway", "orders"),
    edge("gateway", "payments"),
    edge("auth", "auth-db"),
    edge("orders", "orders-db"),
    edge("payments", "payments-db"),
  ],
};

const cicd: CanvasTemplate = {
  id: "ci-cd-pipeline",
  name: "CI/CD pipeline",
  description: "Commit to production flow with build, test and approval gates.",
  nodes: [
    node("commit", "circle", "Commit", 0, 100, "blue"),
    node("build", "rectangle", "Build", 200, 110, "neutral"),
    node("test", "rectangle", "Test", 420, 110, "neutral"),
    node("gate", "diamond", "Tests pass?", 640, 90, "orange"),
    node("staging", "rectangle", "Deploy to staging", 900, 110, "teal"),
    node("prod", "pill", "Production", 1140, 118, "green"),
    node("notify", "rectangle", "Notify developer", 640, 300, "red"),
  ],
  edges: [
    edge("commit", "build"),
    edge("build", "test"),
    edge("test", "gate"),
    edge("gate", "staging", { label: "yes" }),
    edge("staging", "prod"),
    edge("gate", "notify", { from: "bottom", to: "top", label: "no" }),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-driven system",
  description: "Producers publish to an event bus consumed by independent services.",
  nodes: [
    node("web", "rectangle", "Web App", 0, 40, "blue"),
    node("api", "rectangle", "Public API", 0, 240, "blue"),
    node("bus", "hexagon", "Event Bus", 280, 132, "purple"),
    node("email", "rectangle", "Email Service", 580, 0, "green"),
    node("billing", "rectangle", "Billing Service", 580, 140, "green"),
    node("analytics", "rectangle", "Analytics Service", 580, 280, "green"),
    node("store", "cylinder", "Event Store", 860, 130, "orange"),
  ],
  edges: [
    edge("web", "bus", { label: "publish" }),
    edge("api", "bus", { label: "publish" }),
    edge("bus", "email"),
    edge("bus", "billing"),
    edge("bus", "analytics"),
    edge("billing", "store"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicd,
  eventDriven,
];
