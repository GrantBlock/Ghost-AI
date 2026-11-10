import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { errorResponse as error } from "@/lib/project-api";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import type { designAgentTask } from "@/src/trigger/design-agent";

/** Trigger a design generation run and record it for ownership checks. */
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return error("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Body must be valid JSON", 400);
  }

  const { prompt, roomId, projectId } = (body ?? {}) as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return error("`prompt` is required", 400);
  }
  if (typeof roomId !== "string" || !roomId) {
    return error("`roomId` is required", 400);
  }
  if (typeof projectId !== "string" || !projectId) {
    return error("`projectId` is required", 400);
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) return error("Project not found", 404);

  try {
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: prompt.trim(),
      roomId,
    });

    await prisma.taskRun.create({
      data: { runId: handle.id, projectId, userId: identity.userId },
    });

    return NextResponse.json({ runId: handle.id });
  } catch (err) {
    console.error("Failed to trigger design task", err);
    return error("Failed to start design run", 500);
  }
}
