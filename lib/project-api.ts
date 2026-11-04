import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const MAX_NAME_LENGTH = 100;

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Returns a trimmed string, or null when the value is not a non-empty string. */
export function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Loads a project and verifies the caller owns it. */
export async function authorizeOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { response: errorResponse("Project not found", 404) } as const;
  if (project.ownerId !== userId) {
    return { response: errorResponse("Forbidden", 403) } as const;
  }
  return { project } as const;
}
