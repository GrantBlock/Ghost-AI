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
