import { currentUser } from "@clerk/nextjs/server";

import { getCursorColor } from "@/lib/cursor-color";
import { getLiveblocks } from "@/lib/liveblocks";
import { errorResponse, readBody, readString } from "@/lib/project-api";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

export async function POST(request: Request) {
  try {
    return await handleAuth(request);
  } catch (error) {
    console.error("[liveblocks-auth] failed:", error);
    const message =
      error instanceof Error ? error.message : "Liveblocks auth failed";
    return errorResponse(message, 500);
  }
}

async function handleAuth(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return errorResponse("Unauthorized", 401);

  // The Liveblocks client sends { room } in the body; the room ID is the project ID.
  const body = await readBody(request);
  const roomId = readString(body?.room);
  if (!roomId) return errorResponse("Room is required", 400);

  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) return errorResponse("Forbidden", 403);

  const user = await currentUser();
  const name =
    user?.fullName?.trim() ||
    user?.username ||
    identity.email ||
    "Anonymous";
  const avatar = user?.imageUrl ?? "";

  const liveblocks = getLiveblocks();

  // Create the room only if it does not already exist.
  // Access is granted per-session, so the room itself has no default access.
  await liveblocks.getOrCreateRoom(project.id, { defaultAccesses: [] });

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name,
      avatar,
      color: getCursorColor(identity.userId),
    },
  });
  session.allow(project.id, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new Response(token, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
