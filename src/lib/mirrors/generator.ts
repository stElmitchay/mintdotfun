import Replicate from "replicate";
import type { InterpretedScene, MirrorStyle } from "./types";

// ============================================================
// Mirror Frame Image Generation (Replicate Flux)
// ============================================================

const MAX_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MS = 12_000;

/**
 * Generate a mirror frame image using Replicate Flux.
 *
 * If `previousFrameUrl` is provided, uses img2img for visual continuity.
 * Otherwise generates from scratch (genesis frame).
 */
export async function generateFrame(
  scene: InterpretedScene,
  mirrorStyle: MirrorStyle,
  previousFrameUrl: string | null
): Promise<{ imageUrl: string }> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN env var is required for image generation.");
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  // Combine the scene-specific prompt with the mirror's base style
  const fullPrompt = `${scene.imagePrompt}, ${mirrorStyle.basePrompt}`;

  const input: Record<string, unknown> = {
    prompt: fullPrompt,
    num_outputs: 1,
    aspect_ratio: mirrorStyle.aspectRatio,
    output_format: mirrorStyle.outputFormat,
    output_quality: mirrorStyle.outputQuality,
  };

  // Use img2img if we have a previous frame
  if (previousFrameUrl) {
    input.image = previousFrameUrl;
    input.prompt_strength = mirrorStyle.promptStrength;
  }

  let imageUrl: string | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input,
      });

      imageUrl = extractImageUrl(output);
      if (imageUrl) break;

      throw new Error("Replicate returned no image URL");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Retry on rate limit
      if (msg.includes("429") || msg.includes("throttled")) {
        console.warn(
          `[mirror-gen] Rate limited, retrying in ${RATE_LIMIT_BACKOFF_MS}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, RATE_LIMIT_BACKOFF_MS));
        continue;
      }

      // Don't retry on non-rate-limit errors unless it's the last attempt
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Mirror frame generation failed: ${msg}`);
      }

      // Brief pause before retry on other errors
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!imageUrl) {
    throw new Error("Failed to generate mirror frame after all retries");
  }

  return { imageUrl };
}

/**
 * Extract image URL from Replicate output.
 * Handles: string[], URL[], FileOutput[], and ReadableStream wrappers.
 */
function extractImageUrl(output: unknown): string | null {
  if (typeof output === "string") return output;

  if (Array.isArray(output) && output.length > 0) {
    const item = output[0];
    if (typeof item === "string") return item;
    if (item instanceof URL) return item.href;

    if (typeof item === "object" && item !== null) {
      // FileOutput objects with .href property
      if ("href" in item && typeof (item as { href: string }).href === "string") {
        return (item as { href: string }).href;
      }
      // FileOutput objects with .url() method
      if ("url" in item && typeof (item as { url: unknown }).url === "function") {
        const urlObj = (item as { url: () => { href: string } }).url();
        return urlObj?.href ?? null;
      }
      // Plain { url: string } objects
      if ("url" in item && typeof (item as { url: unknown }).url === "string") {
        return (item as { url: string }).url;
      }
    }
  }

  if (output && typeof output === "object" && "output" in output) {
    return extractImageUrl((output as { output: unknown }).output);
  }

  return null;
}
