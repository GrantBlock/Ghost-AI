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

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">
) {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await readBody(request);
  const name = readString(body?.name);
  if (!name) return error("`name` is required", 400);
  if (name.length > MAX_NAME_LENGTH) return error("Name is too long", 400);

  const result = await authorizeOwner(id, userId);
  if ("response" in result) return result.response;

  const project = await prisma.project.update({ where: { id }, data: { name } });
  return NextResponse.json({ project });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]">
) {
  const { userId } = await auth();
  if (!userId) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const result = await authorizeOwner(id, userId);
  if ("response" in result) return result.response;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ id });
}
