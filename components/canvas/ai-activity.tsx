"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Loader2 } from "lucide-react";

/** Pointers + name badges for other participants (including the AI). */
export function LiveCursors() {
  const others = useOthers();
  const { flowToScreenPosition } = useReactFlow();
  // Subscribing to the viewport re-renders this on pan/zoom.
  useViewport();

  return (
    <>
      {others.map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor) return null;
        const color = other.info?.color ?? "#BF7AF0";
        const name = other.info?.name ?? "Guest";
        const point = flowToScreenPosition(cursor);
        // flowToScreenPosition returns viewport coordinates, matching the `fixed` overlay.
        return (
          <div
            key={other.connectionId}
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-40 transition-transform duration-500 ease-out"
            style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill={color}>
              <path d="M2 1.5 16 8l-6 2-2 6z" stroke="#0a0a0a" strokeWidth="1" />
            </svg>
            <span
              className="ml-3 -mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-black"
              style={{ backgroundColor: color }}
            >
              {other.presence.thinking === true ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-label="Thinking" />
              ) : null}
              {name}
            </span>
          </div>
        );
      })}
    </>
  );
}
