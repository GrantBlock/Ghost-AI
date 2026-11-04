import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_NAME = "untitled-project";
const MAX_NAME_LENGTH = 100;

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
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
function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Loads a project and verifies the caller owns it. */
async function authorizeOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { response: error("Project not found", 404) } as const;
  if (project.ownerId !== userId) return { response: error("Forbidden", 403) } as const;
  return { project } as const;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const body = await readBody(request);
  if (!body) return error("Invalid JSON body", 400);

  const name = readString(body.name) ?? DEFAULT_PROJECT_NAME;
  if (name.length > MAX_NAME_LENGTH) return error("Name is too long", 400);

  const project = await prisma.project.create({ data: { ownerId: userId, name } });
  return NextResponse.json({ project }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const body = await readBody(request);
  const id = readString(body?.id);
  const name = readString(body?.name);
  if (!id || !name) return error("`id` and `name` are required", 400);
  if (name.length > MAX_NAME_LENGTH) return error("Name is too long", 400);

  const result = await authorizeOwner(id, userId);
  if ("response" in result) return result.response;

  const project = await prisma.project.update({ where: { id }, data: { name } });
  return NextResponse.json({ project });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const body = await readBody(request);
  const id = readString(body?.id);
  if (!id) return error("`id` is required", 400);

  const result = await authorizeOwner(id, userId);
  if ("response" in result) return result.response;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ id });
}
