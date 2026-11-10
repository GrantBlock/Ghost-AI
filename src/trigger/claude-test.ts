import { logger, task } from "@trigger.dev/sdk";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Smoke test: confirms Trigger.dev can run a task that calls Claude.
// Delete once the real design agent exists.
export const claudeTestTask = task({
  id: "claude-test",
  maxDuration: 60,
  run: async (payload: { prompt?: string }) => {
    const { text } = await generateText({
      model: anthropic("claude-haiku-5-5"),
      prompt: payload.prompt ?? "Reply with the single word: pong",
    });
    logger.log("Claude replied", { text });
    return { text };
  },
});
