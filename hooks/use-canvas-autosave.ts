"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SAVE_CANVAS_EVENT,
  useReportSaveStatus,
  type SaveStatus,
} from "@/components/editor/save-status";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const SAVE_DEBOUNCE_MS = 1500;

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** Autosave stays off until the initial load has settled, so an empty canvas never overwrites a saved one. */
  enabled: boolean;
}

/** Serializes only persistent fields so selection/drag/measure churn does not trigger saves. */
const TRANSIENT_NODE_KEYS = ["selected", "dragging", "resizing", "measured"];
const TRANSIENT_EDGE_KEYS = ["selected"];

function omit<T extends object>(value: T, keys: string[]): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key))
  ) as Partial<T>;
}

function serialize(nodes: CanvasNode[], edges: CanvasEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((n) => omit(n, TRANSIENT_NODE_KEYS)),
    edges: edges.map((e) => omit(e, TRANSIENT_EDGE_KEYS)),
  });
}

/**
 * Debounced autosave of the canvas through PUT /api/projects/[projectId]/canvas.
 * Saves are serialized (never concurrent) and always send the latest state.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: UseCanvasAutosaveOptions): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const reportStatus = useReportSaveStatus();

  const latest = useRef<string | null>(null);
  const lastSaved = useRef<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    reportStatus(status);
  }, [status, reportStatus]);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      while (latest.current !== null && latest.current !== lastSaved.current) {
        const body = latest.current;
        setStatus("saving");
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!response.ok) throw new Error(`Save failed (${response.status})`);
        lastSaved.current = body;
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;
    const body = serialize(nodes, edges);
    latest.current = body;

    // First pass after enabling: treat the current state as already persisted.
    if (lastSaved.current === null) {
      lastSaved.current = body;
      return;
    }
    if (body === lastSaved.current) return;

    const timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, nodes, edges, flush]);

  // Manual "Save" button: flush right away instead of waiting for the debounce.
  useEffect(() => {
    if (!enabled) return;
    function onSaveNow() {
      if (latest.current !== null && latest.current === lastSaved.current) {
        setStatus("saved");
        return;
      }
      void flush();
    }
    window.addEventListener(SAVE_CANVAS_EVENT, onSaveNow);
    return () => window.removeEventListener(SAVE_CANVAS_EVENT, onSaveNow);
  }, [enabled, flush]);

  return status;
}
