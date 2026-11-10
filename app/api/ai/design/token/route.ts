import { auth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { errorResponse as error } from "@/lib/project-api";
import { getCurrentIdentity } from "@/lib/project-access";

/** Issue a public token scoped to one run the caller started. */
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Body must be valid JSON", 400);
  }

  const { runId } = (body ?? {}) as Record<string, unknown>;
  if (typeof runId !== "string" || !runId) {
    return error("`runId` is required", 400);
  }

  const record = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  });
  if (!record) return error("Run not found", 404);
  if (record.userId !== identity.userId) return error("Forbidden", 403);

  try {
    const token = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
      expirationTime: "1h",
    });
    return NextResponse.json({ token });
  } catch (err) {
    console.error("Failed to create run token", err);
    return error("Failed to create token", 500);
  }
}
