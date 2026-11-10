import "server-only";

import { get, put } from "@vercel/blob";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Upper bound for a serialized canvas snapshot. */
export const MAX_CANVAS_BYTES = 4 * 1024 * 1024;

/** Narrow check on untrusted input: an object holding `nodes` and `edges` arrays. */
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const { nodes, edges } = value as Record<string, unknown>;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
  return { nodes, edges } as CanvasSnapshot;
}

/**
 * Uploads the canvas JSON to Vercel Blob at a stable per-project pathname
 * (overwritten on every save) and returns the blob URL.
 */
export async function saveCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
): Promise<string> {
  const blob = await put(
    `projects/${projectId}/canvas.json`,
    JSON.stringify(snapshot),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    }
  );
  return blob.url;
}

/** Reads a saved canvas back from its blob URL; null when missing or malformed. */
export async function loadCanvasSnapshot(
  blobUrl: string
): Promise<CanvasSnapshot | null> {
  const result = await get(blobUrl, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  try {
    return parseCanvasSnapshot(await new Response(result.stream).json());
  } catch {
    return null;
  }
}
