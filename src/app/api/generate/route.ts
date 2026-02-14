import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { GENERATION, STYLE_PROMPTS } from "@/lib/constants";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error(
    "REPLICATE_API_TOKEN is not set. Add it to your .env.local file."
  );
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Simple in-memory rate limiter (per-process, resets on restart)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();

    // --- Input validation ---
    const prompt = (formData.get("prompt") as string)?.trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be under 2000 characters" },
        { status: 400 }
      );
    }

    const rawCount = parseInt(formData.get("count") as string);
    const count = Number.isNaN(rawCount)
      ? 4
      : Math.min(
          Math.max(rawCount, GENERATION.MIN_COUNT),
          GENERATION.MAX_COUNT
        );

    const style = formData.get("style") as string | null;
    if (
      style &&
      style !== "none" &&
      !(GENERATION.ALLOWED_STYLES as readonly string[]).includes(style)
    ) {
      return NextResponse.json(
        { error: `Invalid style: ${style}` },
        { status: 400 }
      );
    }

    const referenceImage = formData.get("referenceImage") as File | null;
    if (referenceImage) {
      if (referenceImage.size > GENERATION.MAX_REFERENCE_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Reference image must be under 5MB" },
          { status: 400 }
        );
      }
      if (
        !(GENERATION.ALLOWED_IMAGE_TYPES as readonly string[]).includes(
          referenceImage.type
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid image type: ${referenceImage.type}. Allowed: ${GENERATION.ALLOWED_IMAGE_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // --- Build prompt ---
    let fullPrompt = prompt;
    if (style && style !== "none" && STYLE_PROMPTS[style]) {
      fullPrompt = `${prompt}, ${STYLE_PROMPTS[style]}`;
    }
    fullPrompt +=
      ", masterpiece, best quality, highly detailed, professional artwork";

    // Handle reference image
    let referenceImageUrl: string | undefined;
    if (referenceImage) {
      const bytes = await referenceImage.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      referenceImageUrl = `data:${referenceImage.type};base64,${base64}`;
    }

    // Generate images (parallel requests to Replicate)
    const imagePromises = Array.from({ length: count }, async (_, i) => {
      const variation =
        count > 1 ? `, variation ${i + 1}, unique composition` : "";

      const input: Record<string, unknown> = {
        prompt: fullPrompt + variation,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
      };

      if (referenceImageUrl) {
        input.image = referenceImageUrl;
        input.prompt_strength = 0.75;
      }

      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input,
      });

      // Replicate can return different shapes — handle all known variants
      const url = extractImageUrl(output);
      if (!url) {
        throw new Error(
          `Unexpected Replicate output format: ${JSON.stringify(output).slice(0, 200)}`
        );
      }
      return url;
    });

    const images = await Promise.all(imagePromises);

    return NextResponse.json({ images, prompt: fullPrompt });
  } catch (error) {
    console.error("Generation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate images";

    // Surface billing errors clearly
    if (message.includes("402") || message.includes("Payment Required")) {
      return NextResponse.json(
        { error: "Replicate billing issue. Please check your Replicate account balance." },
        { status: 402 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Extracts a URL string from Replicate's run() output.
 * Handles: string[], URL[], FileOutput[], and ReadableStream wrappers.
 */
function extractImageUrl(output: unknown): string | null {
  if (!Array.isArray(output) || output.length === 0) return null;

  const item = output[0];

  if (typeof item === "string") return item;
  if (item instanceof URL) return item.href;

  // FileOutput objects from replicate SDK have a url() method
  if (typeof item === "object" && item !== null) {
    if ("href" in item && typeof (item as { href: string }).href === "string") {
      return (item as { href: string }).href;
    }
    if ("url" in item && typeof (item as { url: unknown }).url === "function") {
      const urlObj = (item as { url: () => { href: string } }).url();
      return urlObj?.href ?? null;
    }
    // Some versions return { url: string } directly
    if ("url" in item && typeof (item as { url: unknown }).url === "string") {
      return (item as { url: string }).url;
    }
  }

  return null;
}
