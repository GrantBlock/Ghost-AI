/* eslint-disable @typescript-eslint/no-empty-object-type -- empty slots are intentionally left open for later features */
// Liveblocks types for the application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      /** Cursor position on the canvas, or null when the cursor is not on it. */
      cursor: { x: number; y: number } | null;
      /** True while the user is waiting on / triggering an AI response. */
      isThinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {};

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};

    // Messages in the shared AI status feed ("ai-status"), written by the design agent
    FeedMessageData: {
      kind: "start" | "processing" | "complete" | "error";
      message: string;
      runId: string;
      author: string;
    };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {};
  }
}

export {};
