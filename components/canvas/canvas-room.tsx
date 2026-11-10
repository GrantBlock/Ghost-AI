"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

import { CanvasErrorBoundary } from "@/components/canvas/canvas-error-boundary";
import { CanvasFlow } from "@/components/canvas/canvas-flow";

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-base">
      <p className="text-sm text-copy-muted">Loading canvas…</p>
    </div>
  );
}

/**
 * Liveblocks provider + room (room ID = project ID). Wraps the whole editor shell
 * so the canvas and the AI sidebar share one room connection and presence.
 */
export function LiveblocksRoom({
  roomId,
  children,
}: {
  roomId: string;
  children: ReactNode;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}

/** Renders the collaborative canvas; must be inside `LiveblocksRoom`. */
export function CanvasRoom({ roomId }: { roomId: string }) {
  return (
    <CanvasErrorBoundary>
      <ClientSideSuspense fallback={<CanvasLoading />}>
        <CanvasFlow projectId={roomId} />
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  );
}
