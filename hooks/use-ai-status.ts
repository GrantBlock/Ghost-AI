"use client";

import { useFeedMessages, useOthers } from "@liveblocks/react";
import { useEffect, useState } from "react";

import {
  AI_STATUS_FEED_ID,
  AI_USER_ID,
  parseAiStatusMessage,
  type AiStatusMessage,
} from "@/types/tasks";

/** Finished statuses disappear after this long; running ones after STALE_MS. */
const FINISHED_LINGER_MS = 8000;
const STALE_MS = 120_000;

export interface AiStatus {
  /** True while the AI participant has `thinking: true` in presence. */
  isGenerating: boolean;
  /** Most recent valid feed message, or null. */
  latest: AiStatusMessage | null;
}

/** Shared AI activity for everyone in the room (feed + presence, no parallel state). */
export function useAiStatus(): AiStatus {
  const result = useFeedMessages(AI_STATUS_FEED_ID);
  const messages = "messages" in result ? result.messages : undefined;
  const isGenerating = useOthers((others) =>
    others.some((o) => o.id === AI_USER_ID && o.presence.thinking === true)
  );
  const [now, setNow] = useState(() => Date.now());

  // Only the most recent message is shown; validate before using it.
  const newest = messages?.reduce(
    (a, b) => (b.createdAt >= a.createdAt ? b : a),
    messages[0]
  );
  const parsed = newest ? parseAiStatusMessage(newest.data) : null;
  const createdAt = newest?.createdAt ?? 0;

  useEffect(() => {
    if (!parsed) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [parsed]);

  if (!parsed?.text) return { isGenerating, latest: null };
  const finished = parsed.kind === "complete" || parsed.kind === "error";
  const age = now - createdAt;
  const visible = isGenerating || age <= (finished ? FINISHED_LINGER_MS : STALE_MS);
  return { isGenerating, latest: visible ? parsed : null };
}
