"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

import { CanvasErrorBoundary } from "@/components/canvas/canvas-error-boundary";
import { CanvasFlow } from "@/components/canvas/canvas-flow";

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-base">
      <p className="text-sm text-copy-muted">Loading canvas…</p>
    </div>
  );
}

/** Sets up the Liveblocks room (room ID = project ID) and renders the canvas. */
export function CanvasRoom({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow projectId={roomId} />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
