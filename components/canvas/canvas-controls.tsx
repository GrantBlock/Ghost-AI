"use client";

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import { useReactFlow } from "@xyflow/react";
import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useKeyboardShortcuts, ZOOM_DURATION } from "@/hooks/useKeyboardShortcuts";

function ControlButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Floating pill with zoom and undo/redo controls. */
export function CanvasControls() {
  const reactFlow = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ reactFlow, undo, redo });

  return (
    <div
      role="toolbar"
      aria-label="Canvas controls"
      className="flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1 backdrop-blur"
    >
      <ControlButton
        label="Zoom out"
        icon={ZoomOut}
        onClick={() => reactFlow.zoomOut({ duration: ZOOM_DURATION })}
      />
      <ControlButton
        label="Fit view"
        icon={Maximize}
        onClick={() => reactFlow.fitView({ duration: ZOOM_DURATION })}
      />
      <ControlButton
        label="Zoom in"
        icon={ZoomIn}
        onClick={() => reactFlow.zoomIn({ duration: ZOOM_DURATION })}
      />
      <div aria-hidden className="mx-1 h-5 w-px bg-surface-border" />
      <ControlButton
        label="Undo"
        icon={Undo2}
        onClick={undo}
        disabled={!canUndo}
      />
      <ControlButton
        label="Redo"
        icon={Redo2}
        onClick={redo}
        disabled={!canRedo}
      />
    </div>
  );
}
