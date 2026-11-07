"use client";

import type { NodeProps } from "@xyflow/react";

import { NodeShape } from "@/components/canvas/node-shape";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

/** Renders a node in its shape variant with a centered label. */
export function CanvasNodeView({ data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((c) => c.fill === data.color)?.text ?? NODE_COLORS[0].text;

  return (
    <NodeShape
      shape={data.shape}
      color={data.color}
      selected={selected}
      style={{ color: textColor }}
    >
      {data.label}
    </NodeShape>
  );
}
