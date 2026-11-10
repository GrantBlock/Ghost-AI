"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useCallback, useState } from "react";

import type { designAgentTask } from "@/src/trigger/design-agent";

interface DesignRunCallbacks {
  /** Called once when the run finishes successfully, with the agent's summary. */
  onSuccess: (summary: string | undefined) => void;
  /** Called once when the run fails, is canceled or cannot be started. */
  onError: (message: string) => void;
}

/**
 * Starts a design run via /api/ai/design and tracks it with Trigger.dev Realtime.
 * Canvas edits are not handled here: they arrive through Liveblocks.
 */
export function useDesignRun(roomId: string, { onSuccess, onError }: DesignRunCallbacks) {
  const [isStarting, setIsStarting] = useState(false);
  const [run, setRun] = useState<{ runId: string; publicToken: string } | null>(null);

  useRealtimeRun<typeof designAgentTask>(run?.runId, {
    accessToken: run?.publicToken,
    enabled: !!run,
    onComplete: (finished, err) => {
      if (err) onError("Lost connection to the design run. Please try again.");
      else if (finished.isSuccess) onSuccess(finished.output?.summary);
      else onError("The design run failed. Please try again.");
      setRun(null);
    },
  });

  const start = useCallback(
    async (prompt: string) => {
      setIsStarting(true);
      try {
        const response = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, roomId }),
        });
        const data = (await response.json().catch(() => null)) as {
          runId?: string;
          publicToken?: string;
          error?: string;
        } | null;
        if (!response.ok || !data?.runId || !data.publicToken) {
          throw new Error(data?.error ?? "Failed to start design run");
        }
        setRun({ runId: data.runId, publicToken: data.publicToken });
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to start design run");
      } finally {
        setIsStarting(false);
      }
    },
    [roomId, onError]
  );

  return { start, isRunning: isStarting || run !== null };
}
