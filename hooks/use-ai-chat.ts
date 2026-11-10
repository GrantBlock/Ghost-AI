"use client";

import { useCreateFeedMessage, useFeedMessages } from "@liveblocks/react";
import { useCallback, useMemo } from "react";

import {
  AI_CHAT_FEED_ID,
  parseAiChatMessage,
  type AiChatMessage,
} from "@/types/tasks";

export interface ChatEntry extends AiChatMessage {
  id: string;
}

/** Room chat over the `ai-chat` feed: validated messages in order, plus a send function. */
export function useAiChat() {
  const result = useFeedMessages(AI_CHAT_FEED_ID);
  const raw = "messages" in result ? result.messages : undefined;
  const createFeedMessage = useCreateFeedMessage();

  const messages = useMemo<ChatEntry[]>(() => {
    if (!raw) return [];
    const valid: ChatEntry[] = [];
    for (const m of raw) {
      const parsed = parseAiChatMessage(m.data);
      if (parsed) valid.push({ ...parsed, id: m.id });
    }
    return valid.sort((a, b) => a.timestamp - b.timestamp);
  }, [raw]);

  const send = useCallback(
    (sender: string, content: string, role: AiChatMessage["role"] = "user") => {
      const message: AiChatMessage = {
        sender,
        role,
        content,
        timestamp: Date.now(),
      };
      return createFeedMessage(AI_CHAT_FEED_ID, message);
    },
    [createFeedMessage]
  );

  return { messages, send, isLoading: "isLoading" in result && result.isLoading };
}
