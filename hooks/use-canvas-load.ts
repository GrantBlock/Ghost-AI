"use client";

import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";

import { useReportSaveStatus } from "@/components/editor/save-status";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

type LoadState = "loading" | "ready" | "failed";

interface SavedCanvasResponse {
  canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null;
}

/**
 * One-time load of the saved canvas into an empty Liveblocks room.
 * Skipped entirely when the room already has nodes or edges, so active
 * collaboration is never overwritten. Returns "ready" once autosave is safe.
 */
export function useCanvasLoad(
  projectId: string,
  hasRoomContent: boolean
): LoadState {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const reportStatus = useReportSaveStatus();
  // Decided once, on mount: later edits must not re-trigger a load.
  const [skipLoad] = useState(hasRoomContent);
  const [state, setState] = useState<LoadState>(skipLoad ? "ready" : "loading");

  useEffect(() => {
    if (skipLoad) return;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);
        if (!response.ok) throw new Error(`Load failed (${response.status})`);
        const { canvas } = (await response.json()) as SavedCanvasResponse;
        if (cancelled) return;

        // Someone may have populated the room while we were fetching.
        const roomIsEmpty =
          reactFlow.getNodes().length === 0 && reactFlow.getEdges().length === 0;
        if (canvas && roomIsEmpty) {
          reactFlow.addNodes(
            canvas.nodes.map((n) => ({
              ...n,
              selected: false,
              dragging: false,
            }))
          );
          reactFlow.addEdges(
            canvas.edges.map((e) => ({ ...e, selected: false }))
          );
          setTimeout(() => void reactFlow.fitView({ padding: 0.2 }), 100);
        }
        setState("ready");
      } catch {
        if (cancelled) return;
        // Keep autosave off so a failed load can't be overwritten by partial edits.
        reportStatus("error");
        setState("failed");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, skipLoad, reactFlow, reportStatus]);

  return state;
}
