/* eslint-disable @typescript-eslint/no-empty-object-type -- empty slots are intentionally left open for later features */
// Liveblocks types for the application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      /** Cursor position on the canvas, or null when the cursor is not on it. */
      cursor: { x: number; y: number } | null;
      /** True while the participant is waiting on / running an AI response. */
      thinking: boolean;
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

    // Messages in the shared feeds: "ai-status-feed" (aiStatusMessageSchema) and
    // "ai-chat" (aiChatMessageSchema), both validated in types/tasks.ts
    FeedMessageData: {
      text?: string;
      kind?: "start" | "processing" | "complete" | "error";
      runId?: string;
      sender?: string;
      role?: "user" | "assistant";
      content?: string;
      timestamp?: number;
    };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {};
  }
}

export {};
