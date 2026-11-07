import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { CanvasNodeShape } from "@/types/canvas";

interface NodeShapeProps {
  shape: CanvasNodeShape;
  color: string;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

const CSS_SHAPE_RADIUS: Partial<Record<CanvasNodeShape, string>> = {
  rectangle: "rounded-md",
  pill: "rounded-full",
  circle: "rounded-full",
};

/** Drawn in a 100x100 viewBox stretched to the node size. */
function renderSvgShape(shape: CanvasNodeShape, fill: string, stroke: string) {
  const common = {
    fill,
    stroke,
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
  };
  switch (shape) {
    case "diamond":
      return <polygon points="50,0.5 99.5,50 50,99.5 0.5,50" {...common} />;
    case "hexagon":
      return <polygon points="25,0.5 75,0.5 99.5,50 75,99.5 25,99.5 0.5,50" {...common} />;
    case "cylinder":
      return (
        <>
          <path
            d="M0.5,12 A49.5,11.5 0 0 1 99.5,12 V88 A49.5,11.5 0 0 1 0.5,88 Z"
            {...common}
          />
          <path d="M0.5,12 A49.5,11.5 0 0 0 99.5,12" {...common} fill="none" />
        </>
      );
    default:
      return null;
  }
}

/** Shared visual for a node shape; fills its parent. Used by nodes and the drag preview. */
export function NodeShape({
  shape,
  color,
  selected = false,
  className,
  children,
  style,
}: NodeShapeProps) {
  const radius = CSS_SHAPE_RADIUS[shape];
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  if (radius) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center border px-2 text-center text-sm transition-colors",
          radius,
          className
        )}
        style={{ backgroundColor: color, borderColor: stroke, ...style }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full text-center text-sm", className)}
      style={style}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {renderSvgShape(shape, color, stroke)}
      </svg>
      <div className="relative flex h-full w-full items-center justify-center px-[18%]">
        {children}
      </div>
    </div>
  );
}
