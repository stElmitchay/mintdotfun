import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MirrorTypeConfig } from "./types";
import { MIRROR_CONFIGS } from "./config";

// ============================================================
// AI Config Generator — City Name → Full MirrorTypeConfig
//
// Uses Gemini to generate a complete mirror configuration from
// just a city name. Includes few-shot examples from existing mirrors.
// ============================================================

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }
  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

function buildSystemPrompt(): string {
  // Use Dubai config as the few-shot example
  const example = MIRROR_CONFIGS["dubai"];
  const exampleJson = JSON.stringify(example, null, 2);

  return `You are an expert cultural researcher and creative director. Your job is to generate a complete configuration for a Cultural Mirror NFT — a living artwork that evolves daily based on real-world data feeds about a specific city.

Given a city name (and optionally a country and art style theme), generate a full MirrorTypeConfig JSON object.

HERE IS AN EXAMPLE of a complete config for Dubai:

${exampleJson}

REQUIREMENTS for the config you generate:
1. "id": lowercase slug of the city (e.g. "seoul", "buenos-aires", "cape-town")
2. "name": A creative name (e.g. "Seoul Signal", "Buenos Aires Beat")
3. "tagline": Short evocative tagline (under 60 chars)
4. "description": 1-2 sentence description of what the mirror captures
5. "dataFeedConfig":
   - "mirrorType": same as "id"
   - "location": accurate lat/lon for the city center, with city name and ISO country code
   - "weatherEnabled": true for real cities, false for abstract concepts
   - "newsKeywords": 5-6 keywords for the city's news (city name, cultural events, landmarks)
   - "newsRegion": ISO 2-letter country code
   - "onChainEnabled": true
   - "calendarCountry": ISO 2-letter country code
   - "customEvents": 3-5 major cultural events with SPECIFIC dates, descriptions, and vivid visual impact descriptions (how the event should look in the art)
   - "dataWeights": must sum to 1.0
6. "style":
   - "basePrompt": 30-50 word art style description that's unique to the city's character
   - "negativePrompt": standard quality exclusions
   - "aspectRatio": "1:1"
   - "outputFormat": "webp"
   - "outputQuality": 90
   - "promptStrength": 0.65
7. "updateCadenceHours": 24 (standard) or 12 (for data-heavy mirrors)
8. "updateTimeUtc": time in HH:MM format that makes sense for the city's morning
9. "architecturalAnchors": 4 specific landmarks/visual elements that MUST appear in every frame
10. "culturalMotifs": 4 cultural patterns/elements that give the mirror its unique character
11. "colorPaletteGuidelines": Detailed color palette with specific hex codes, explaining when each color appears
12. "mintPriceSol": 0.25-1.0 (suggest based on expected demand)
13. "maxSupply": 50-500 (suggest based on city size/interest)

IMPORTANT:
- Use REAL, accurate geographic coordinates
- Use REAL cultural events with approximate correct dates
- The visual impact descriptions should be specific and painterly, not generic
- The art style should feel unique to that city's culture, not generic
- Respond with ONLY valid JSON, no markdown code fences`;
}

function buildUserPrompt(
  cityName: string,
  country?: string,
  theme?: string
): string {
  let prompt = `Generate a complete MirrorTypeConfig for: ${cityName}`;
  if (country) prompt += `, ${country}`;
  if (theme) prompt += `\n\nPreferred art style/theme: ${theme}`;
  prompt += "\n\nRespond with ONLY valid JSON.";
  return prompt;
}

function parseConfig(text: string): MirrorTypeConfig {
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  return JSON.parse(jsonStr) as MirrorTypeConfig;
}

/**
 * Generate a complete MirrorTypeConfig for a city using Gemini.
 */
export async function generateMirrorConfig(
  cityName: string,
  country?: string,
  theme?: string
): Promise<MirrorTypeConfig> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY env var is required for config generation."
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(),
  });

  const userPrompt = buildUserPrompt(cityName, country, theme);

  return withRetry(async () => {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("Gemini returned no text content");
    }

    return parseConfig(text);
  }, "Config generation");
}
