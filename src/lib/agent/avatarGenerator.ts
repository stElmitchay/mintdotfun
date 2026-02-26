import Replicate from "replicate";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Agent Avatar Generation via Replicate Flux
// ============================================================

function buildAvatarPrompt(personality: AgentPersonality): string {
  const { archetype } = personality;
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
    `Abstract artistic portrait representing a ${archetype} AI creative agent. ` +
    `Mood: ${mood}. Style: ${mediums}, ${movements}. ` +
    `Color palette: ${colors}. ${atmo}. ${abs}. ` +
    `No text, no letters, no words. Square composition. Masterpiece quality, highly detailed.`
  );
}

/** Extract image URL from Replicate output (handles multiple formats). */
function extractImageUrl(output: unknown): string | null {
  if (typeof output === "string") return output;

  if (Array.isArray(output) && output.length > 0) {
    const item = output[0];
    if (typeof item === "string") return item;
    if (item instanceof URL) return item.href;
    if (typeof item === "object" && item !== null) {
      if (
        "href" in item &&
        typeof (item as { href: string }).href === "string"
      ) {
        return (item as { href: string }).href;
      }
      if (
        "url" in item &&
        typeof (item as { url: unknown }).url === "function"
      ) {
        const urlObj = (item as { url: () => { href: string } }).url();
        return urlObj?.href ?? null;
      }
      if (
        "url" in item &&
        typeof (item as { url: unknown }).url === "string"
      ) {
        return (item as { url: string }).url;
      }
    }
  }

  return null;
}

/** Generate an avatar image for a new agent via Replicate Flux Schnell. */
export async function generateAgentAvatar(
  personality: AgentPersonality
): Promise<string> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is required for avatar generation.");
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const prompt = buildAvatarPrompt(personality);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 90,
        },
      });

      const url = extractImageUrl(output);
      if (url) return url;
      throw new Error("Replicate returned no image URL");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("throttled")) {
        await new Promise((r) => setTimeout(r, 12_000));
        continue;
      }
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error("Avatar generation failed after retries");
}
