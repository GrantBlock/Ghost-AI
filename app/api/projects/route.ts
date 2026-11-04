import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  authorizeOwner,
  errorResponse as error,
  MAX_NAME_LENGTH,
  readBody,
  readString,
} from "@/lib/project-api";
import { prisma } from "@/lib/prisma";
import { MAX_PROJECT_ID_LENGTH, PROJECT_ID_PATTERN } from "@/lib/projects";

const DEFAULT_PROJECT_NAME = "untitled-project";

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

  // Optional client-supplied ID keeps the project ID aligned with its Liveblocks room ID.
  const id = readString(body.id);
  if (id !== null) {
    if (id.length > MAX_PROJECT_ID_LENGTH || !PROJECT_ID_PATTERN.test(id)) {
      return error("Invalid project id", 400);
    }
    if (await prisma.project.findUnique({ where: { id } })) {
      return error("A project with this id already exists", 409);
    }
  }

  const project = await prisma.project.create({
    data: { ...(id ? { id } : {}), ownerId: userId, name },
  });
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
