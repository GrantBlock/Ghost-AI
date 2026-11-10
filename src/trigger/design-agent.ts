import { logger, task } from "@trigger.dev/sdk";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// Minimal design task: wiring only. AI generation is added in a later feature.
export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload) => {
    logger.log("Design agent received input", {
      roomId: payload.roomId,
      prompt: payload.prompt,
    });
    return { roomId: payload.roomId, prompt: payload.prompt };
  },
});
