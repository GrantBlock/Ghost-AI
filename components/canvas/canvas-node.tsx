"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import {
  useCallback,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import { NodeColorToolbar } from "@/components/canvas/node-color-toolbar";
import { NodeShape } from "@/components/canvas/node-shape";
import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;

const RESIZE_HANDLE_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  border: "1px solid var(--accent-primary)",
  backgroundColor: "var(--bg-base)",
};

const RESIZE_LINE_STYLE: CSSProperties = {
  borderColor: "var(--accent-primary)",
  borderWidth: 1,
  opacity: 0.4,
};

// Loose connection mode lets "source" handles connect to each other, so one handle per side is enough.
const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

const HANDLE_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  backgroundColor: "#ffffff",
  border: "1px solid var(--border-subtle)",
};

/** Zero-width space keeps an empty (or trailing-newline) label one line tall. */
const ZERO_WIDTH_SPACE = "​";

/** Renders a node in its shape variant with a resizable frame and inline-editable label. */
export function CanvasNodeView({ id, data, selected }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [editing, setEditing] = useState(false);

  const textColor =
    NODE_COLORS.find((c) => c.fill === data.color)?.text ?? NODE_COLORS[0].text;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { label: event.target.value });
    },
    [id, updateNodeData]
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Keep typing away from canvas shortcuts (e.g. Backspace deleting the node).
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
    }
  }, []);

  return (
    <div className="group relative h-full w-full">
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        handleStyle={RESIZE_HANDLE_STYLE}
        lineStyle={RESIZE_LINE_STYLE}
      />
      <NodeColorToolbar nodeId={id} color={data.color} isVisible={selected} />
      <NodeShape
        shape={data.shape}
        color={data.color}
        selected={selected}
        style={{ color: textColor }}
      >
        <div
          className="relative grid min-h-full w-full cursor-text place-items-stretch content-center"
          onDoubleClick={() => setEditing(true)}
        >
          <span
            className="col-start-1 row-start-1 whitespace-pre-wrap break-words"
            style={{ visibility: editing ? "hidden" : "visible" }}
          >
            {data.label}
            {ZERO_WIDTH_SPACE}
          </span>
          {editing && (
            <textarea
              autoFocus
              value={data.label}
              placeholder="Label"
              rows={1}
              spellCheck={false}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onBlur={() => setEditing(false)}
              onFocus={(event) => event.currentTarget.select()}
              className="nodrag nopan nowheel col-start-1 row-start-1 m-0 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center leading-[inherit] text-inherit outline-none placeholder:text-copy-muted"
            />
          )}
        </div>
      </NodeShape>
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          style={HANDLE_STYLE}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      ))}
    </div>
  );
}
