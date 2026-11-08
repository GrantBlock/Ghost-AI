"use client";

import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import type { CSSProperties, SyntheticEvent } from "react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type CanvasEdge, type CanvasNode } from "@/types/canvas";

interface NodeColorToolbarProps {
  nodeId: string;
  /** Current node fill color (identifies the active pair). */
  color: string;
  isVisible: boolean;
}

/** Keeps toolbar interactions from starting a node drag or canvas pan. */
function stopPropagation(event: SyntheticEvent) {
  event.stopPropagation();
}

/** Floating swatch row above a selected node; picks a predefined fill/text pair. */
export function NodeColorToolbar({
  nodeId,
  color,
  isVisible,
}: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();

  return (
    <NodeToolbar
      nodeId={nodeId}
      isVisible={isVisible}
      position={Position.Top}
      offset={12}
    >
      <div
        role="toolbar"
        aria-label="Node color"
        className="nodrag nopan flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg"
        onPointerDown={stopPropagation}
        onMouseDown={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        {NODE_COLORS.map((pair) => {
          const active = pair.fill === color;
          return (
            <button
              key={pair.fill}
              type="button"
              aria-label={`Color ${pair.fill}`}
              aria-pressed={active}
              onClick={() => updateNodeData(nodeId, { color: pair.fill })}
              style={
                {
                  backgroundColor: pair.fill,
                  "--swatch-text": pair.text,
                  borderColor: active ? pair.text : "var(--border-subtle)",
                } as CSSProperties
              }
              className={cn(
                "size-5 cursor-pointer rounded-full border transition-shadow",
                "hover:shadow-[0_0_4px_1px_var(--swatch-text)]",
                active &&
                  "shadow-[0_0_0_2px_var(--bg-base),0_0_0_3.5px_var(--swatch-text)]"
              )}
            />
          );
        })}
      </div>
    </NodeToolbar>
  );
}
