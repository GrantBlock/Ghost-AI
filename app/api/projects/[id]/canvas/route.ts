import { NextResponse } from "next/server";

import {
  MAX_CANVAS_BYTES,
  loadCanvasSnapshot,
  parseCanvasSnapshot,
  saveCanvasSnapshot,
} from "@/lib/canvas-storage";
import { prisma } from "@/lib/prisma";
import { errorResponse as error } from "@/lib/project-api";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

type Ctx = RouteContext<"/api/projects/[id]/canvas">;

/** Load the saved canvas. Owners and collaborators may read. */
export async function GET(_request: Request, ctx: Ctx) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const project = await getProjectIfAccessible(id, identity);
  if (!project) return error("Project not found", 404);

  const record = await prisma.project.findUnique({
    where: { id },
    select: { canvasJsonPath: true },
  });
  if (!record?.canvasJsonPath) return NextResponse.json({ canvas: null });

  try {
    const canvas = await loadCanvasSnapshot(record.canvasJsonPath);
    return NextResponse.json({ canvas });
  } catch (err) {
    console.error("Failed to load canvas blob", err);
    return error("Failed to load canvas", 500);
  }
}

/** Save the latest canvas JSON to Blob and store its URL on the project. */
export async function PUT(request: Request, ctx: Ctx) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const project = await getProjectIfAccessible(id, identity);
  if (!project) return error("Project not found", 404);

  const text = await request.text();
  if (text.length > MAX_CANVAS_BYTES) return error("Canvas is too large", 413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return error("Body must be valid JSON", 400);
  }
  const snapshot = parseCanvasSnapshot(parsed);
  if (!snapshot) return error("`nodes` and `edges` arrays are required", 400);

  try {
    const url = await saveCanvasSnapshot(id, snapshot);
    await prisma.project.update({
      where: { id },
      data: { canvasJsonPath: url },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save canvas", err);
    return error("Failed to save canvas", 500);
  }
}
