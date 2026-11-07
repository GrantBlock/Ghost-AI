import type { Edge, Node } from "@xyflow/react";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

/** Node fill / text color pairs (data values, see ui-context.md). */
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" }, // neutral dark (default)
  { fill: "#10233D", text: "#52A8FF" }, // blue
  { fill: "#2E1938", text: "#BF7AF0" }, // purple
  { fill: "#331B00", text: "#FF990A" }, // orange
  { fill: "#3C1618", text: "#FF6166" }, // red
  { fill: "#3A1726", text: "#F75F8F" }, // pink
  { fill: "#0F2E18", text: "#62C073" }, // green
  { fill: "#062822", text: "#0AC7B4" }, // teal
] as const;

export const DEFAULT_NODE_COLOR: string = NODE_COLORS[0].fill;

/** Default size per shape: rectangles wider than tall, circles square, diamonds larger. */
export const SHAPE_DEFAULT_SIZES: Record<
  CanvasNodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 180, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 160, height: 96 },
};

/** MIME type of the shape drag payload. */
export const SHAPE_DRAG_MIME = "application/x-ghostie-shape";

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: CanvasNodeShape;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;

export function isCanvasShape(value: unknown): value is CanvasNodeShape {
  return (NODE_SHAPES as readonly unknown[]).includes(value);
}
