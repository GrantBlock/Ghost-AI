import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  authorizeOwner,
  errorResponse as error,
  hasPrismaCode,
  readBody,
  readString,
} from "@/lib/project-api";
import {
  isValidEmail,
  listCollaborators,
  normalizeEmail,
} from "@/lib/project-collaborators";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

type Ctx = RouteContext<"/api/projects/[id]/collaborators">;

/** List collaborators. Owners and collaborators may read. */
export async function GET(_request: Request, ctx: Ctx) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const project = await getProjectIfAccessible(id, identity);
  if (!project) return error("Project not found", 404);

  const collaborators = await listCollaborators(id);
  return NextResponse.json({ collaborators, isOwner: project.isOwner });
}

/** Invite a collaborator by email. Owner only. */
export async function POST(request: Request, ctx: Ctx) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await readBody(request);
  const raw = readString(body?.email);
  if (!raw) return error("`email` is required", 400);
  const email = normalizeEmail(raw);
  if (!isValidEmail(email)) return error("Enter a valid email address", 400);

  const result = await authorizeOwner(id, identity.userId);
  if ("response" in result) return result.response;

  if (identity.email && normalizeEmail(identity.email) === email) {
    return error("You already own this project", 400);
  }

  const existing = await prisma.projectCollaborator.findFirst({
    where: { projectId: id, email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return error("Already a collaborator", 409);

  try {
    await prisma.projectCollaborator.create({
      data: { projectId: id, email },
    });
  } catch (err) {
    if (hasPrismaCode(err, "P2002")) return error("Already a collaborator", 409);
    throw err;
  }

  const collaborators = await listCollaborators(id);
  return NextResponse.json({ collaborators }, { status: 201 });
}

/** Remove a collaborator by email. Owner only. */
export async function DELETE(request: Request, ctx: Ctx) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await readBody(request);
  const raw = readString(body?.email);
  if (!raw) return error("`email` is required", 400);

  const result = await authorizeOwner(id, identity.userId);
  if ("response" in result) return result.response;

  await prisma.projectCollaborator.deleteMany({
    where: {
      projectId: id,
      email: { equals: normalizeEmail(raw), mode: "insensitive" },
    },
  });

  const collaborators = await listCollaborators(id);
  return NextResponse.json({ collaborators });
}
