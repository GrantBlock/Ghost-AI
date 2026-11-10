"use client";

import { useFeedMessages, useOthers } from "@liveblocks/react/suspense";
import { useReactFlow, useViewport } from "@xyflow/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const AI_USER_ID = "ghost-ai";
const AI_STATUS_FEED_ID = "ai-status";
/** Completed / failed messages fade from the canvas after this long. */
const STATUS_LINGER_MS = 8000;

/** Latest status from the design agent, visible to everyone in the room. */
export function AiStatusBanner() {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const latest = messages?.reduce((a, b) => (b.createdAt >= a.createdAt ? b : a), messages[0]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!latest) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [latest]);

  if (!latest) return null;
  const { kind, message } = latest.data;
  const finished = kind === "complete" || kind === "error";
  // A run that never finishes (e.g. crashed) should not show "working" forever.
  const age = now - latest.createdAt;
  if (age > (finished ? STATUS_LINGER_MS : 120_000)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none flex max-w-sm items-center gap-2 rounded-full border border-surface-border bg-base/95 px-3 py-1.5 text-xs text-copy-primary shadow-lg backdrop-blur-md"
    >
      {kind === "error" ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-state-error" />
      ) : kind === "complete" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-ai-text" />
      ) : (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-ai-text" />
      )}
      <span className="truncate">
        <span className="text-accent-ai-text">Ghost AI</span> · {message}
      </span>
    </div>
  );
}

/** Cursor + thinking badge for the AI participant (set from the server task). */
export function AiCursor() {
  const ai = useOthers((others) => others.find((o) => o.id === AI_USER_ID));
  const { flowToScreenPosition } = useReactFlow();
  // Subscribing to the viewport re-renders this on pan/zoom.
  useViewport();

  if (!ai) return null;
  const cursor = ai.presence.cursor;
  const color = ai.info?.color ?? "#BF7AF0";
  const point = cursor ? flowToScreenPosition(cursor) : null;

  // flowToScreenPosition returns viewport coordinates, matching the `fixed` overlay.
  return point ? (
    <div
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
        {ai.presence.isThinking ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Ghost AI
      </span>
    </div>
  ) : null;
}
