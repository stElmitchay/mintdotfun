import { tool } from "ai";
import { z } from "zod";
import Replicate from "replicate";
import { saveArtwork, incrementCreations } from "../db";
import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Art Generation Tool — called by agent during chat
// ============================================================

function buildArtPrompt(
  personality: AgentPersonality,
  concept: string
): string {
  const mood = personality.aesthetics.mood.primary;
  const mediums = personality.influences.mediums.slice(0, 2).join(", ");
  const movements = personality.influences.movements.slice(0, 2).join(", ");
  const colors = personality.aesthetics.colorPalette.primary.join(", ");
  const atmo =
    personality.aesthetics.darkness > 60
      ? "Dark moody atmosphere"
      : "Bright luminous atmosphere";
  const abs =
    personality.aesthetics.abstraction > 60
      ? "Highly abstract"
      : "Semi-abstract";

  return (
    `${concept}. ` +
    `Mood: ${mood}. Style: ${mediums}, ${movements}. ` +
    `Color palette: ${colors}. ${atmo}. ${abs}. ` +
    `No text, no letters, no words. Masterpiece quality, highly detailed.`
  );
}

function extractImageUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const item = output[0];
    if (typeof item === "string") return item;
    if (item instanceof URL) return item.href;
    if (typeof item === "object" && item !== null) {
      if ("href" in item && typeof (item as Record<string, unknown>).href === "string")
        return (item as { href: string }).href;
      if ("url" in item && typeof (item as Record<string, unknown>).url === "string")
        return (item as { url: string }).url;
    }
  }
  return null;
}

const generateArtSchema = z.object({
  concept: z
    .string()
    .describe("The creative concept, theme, or description for the artwork"),
  commentary: z
    .string()
    .optional()
    .describe("Your artistic commentary explaining the creative choices"),
  selfScore: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe(
      "Self-assessment score 1-100 of how well this aligns with your vision"
    ),
});

export function createGenerateArtTool(agent: AgentRow) {
  const personality = agent.personality as unknown as AgentPersonality;

  return tool({
    description:
      "Generate artwork based on a concept or theme. Uses the agent's aesthetic preferences and influences to create unique art.",
    inputSchema: generateArtSchema,
    execute: async (input) => {
      if (!process.env.REPLICATE_API_TOKEN) {
        return { error: "Art generation is not configured" };
      }

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
      const prompt = buildArtPrompt(personality, input.concept);

      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 90,
        },
      });

      const imageUrl = extractImageUrl(output);
      if (!imageUrl) {
        return { error: "Failed to generate image" };
      }

      const artworkId = await saveArtwork({
        agentId: agent.id,
        imageUrl,
        prompt,
        agentCommentary: input.commentary,
        selfScore: input.selfScore,
        influencesUsed: [
          ...personality.influences.movements.slice(0, 2),
          ...personality.influences.mediums.slice(0, 2),
        ],
      });

      await incrementCreations(agent.id);

      return { imageUrl, prompt, artworkId };
    },
  });
}
