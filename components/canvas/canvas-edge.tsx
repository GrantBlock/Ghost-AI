"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  useCallback,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

/** Custom edge: right-angle routing, hover/select highlight and inline label editing. */
export function CanvasEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const label = data?.label ?? "";
  const active = hovered || selected || editing;

  const startEditing = useCallback(() => {
    setDraft(label);
    setEditing(true);
  }, [label]);

  const save = useCallback(() => {
    setEditing(false);
    const next = draft.trim();
    if (next !== label) {
      updateEdgeData(id, { label: next || undefined });
    }
  }, [draft, label, id, updateEdgeData]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Keep typing away from canvas shortcuts (e.g. Backspace deleting the edge).
      event.stopPropagation();
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        save();
      }
    },
    [save]
  );

  const hoverProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  return (
    <>
      <g {...hoverProps} onDoubleClick={startEditing}>
        <BaseEdge
          id={id}
          path={path}
          markerEnd={markerEnd}
          interactionWidth={24}
          style={{
            stroke: "#f8fafc",
            strokeWidth: 1,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            opacity: active ? 1 : 0.55,
            transition: "opacity 150ms",
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          {...hoverProps}
          onDoubleClick={startEditing}
        >
          {editing ? (
            <div className="inline-grid rounded-full border border-brand bg-base text-xs text-copy-primary">
              {/* Hidden sizer makes the input grow with its text. */}
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 whitespace-pre px-2 py-0.5"
              >
                {draft || "Label"}
              </span>
              <input
                autoFocus
                value={draft}
                placeholder="Label"
                spellCheck={false}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraft(event.target.value)
                }
                onKeyDown={onKeyDown}
                onBlur={save}
                onFocus={(event) => event.currentTarget.select()}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                className="nodrag nopan nowheel col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent px-2 py-0.5 text-xs outline-none placeholder:text-copy-muted"
              />
            </div>
          ) : label ? (
            <span className="inline-block cursor-text whitespace-pre rounded-full border border-surface-border bg-base px-2 py-0.5 text-xs text-copy-primary">
              {label}
            </span>
          ) : active ? (
            <span className="inline-block cursor-text select-none whitespace-nowrap rounded-full px-2 py-0.5 text-xs text-copy-muted opacity-60">
              Double-click to add label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
