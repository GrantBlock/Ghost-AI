import { z } from "zod";

/** Shared Liveblocks feed carrying AI activity status (design now, specs later). */
export const AI_STATUS_FEED_ID = "ai-status-feed";

/** Presence user ID of the AI participant. */
export const AI_USER_ID = "ghost-ai";

/** Payload of a message in the `ai-status-feed` feed. Kept generic on purpose. */
export const aiStatusMessageSchema = z.object({
  text: z.string().optional(),
  kind: z.enum(["start", "processing", "complete", "error"]).optional(),
  runId: z.string().optional(),
});

export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>;

/** Returns the validated payload, or null when it does not match the schema. */
export function parseAiStatusMessage(data: unknown): AiStatusMessage | null {
  const result = aiStatusMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** Shared Liveblocks feed carrying room chat messages (separate from `ai-status-feed`). */
export const AI_CHAT_FEED_ID = "ai-chat";

/** Payload of a message in the `ai-chat` feed. */
export const aiChatMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

/** Returns the validated chat payload, or null when it does not match the schema. */
export function parseAiChatMessage(data: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
