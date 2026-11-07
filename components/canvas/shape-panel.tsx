"use client";

import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  RectangleHorizontal,
  Square,
  type LucideIcon,
} from "lucide-react";
import type { DragEvent } from "react";

import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

const SHAPE_ICONS: Record<CanvasNodeShape, LucideIcon> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: RectangleHorizontal,
  cylinder: Database,
  hexagon: Hexagon,
};

function onDragStart(event: DragEvent<HTMLButtonElement>, shape: CanvasNodeShape) {
  const payload: ShapeDragPayload = { shape, ...SHAPE_DEFAULT_SIZES[shape] };
  event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "move";
}

/** Floating pill toolbar of draggable shapes. */
export function ShapePanel() {
  return (
    <div
      role="toolbar"
      aria-label="Shapes"
      className="flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 backdrop-blur"
    >
      {NODE_SHAPES.map((shape) => {
        const Icon = SHAPE_ICONS[shape];
        return (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => onDragStart(event, shape)}
            aria-label={`Drag ${shape} onto the canvas`}
            title={shape}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
