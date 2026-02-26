import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  MirrorTypeConfig,
  DataSnapshot,
  MirrorFrame,
  InterpretedScene,
} from "./types";

// ============================================================
// AI Interpretation Pipeline — Data → Scene Description
//
// Currently uses Google Gemini Flash (free tier) for development.
// In production/full mode, swap to Claude Sonnet for higher-quality
// cultural interpretation (see docs/PHASE1_CULTURAL_MIRRORS.md).
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

function buildSystemPrompt(config: MirrorTypeConfig): string {
  return `You are the creative director for a Cultural Mirror NFT — a living artwork that reflects the cultural pulse of ${config.dataFeedConfig.location.city}. Your job is to translate raw data about the city into a vivid scene description that an image generation model will render.

STYLE IDENTITY:
${config.style.basePrompt}

COLOR PALETTE:
${config.colorPaletteGuidelines}

ARCHITECTURAL ANCHORS (must always be present):
${config.architecturalAnchors.map((a) => `- ${a}`).join("\n")}

CULTURAL MOTIFS:
${config.culturalMotifs.map((m) => `- ${m}`).join("\n")}

RULES:
1. Analyze the data and identify the 2-3 most visually interesting signals.
2. Determine how these signals should manifest in the scene.
3. Write a scene description (150-250 words) that the image model will render.
4. Ensure VISUAL CONTINUITY with the previous frame:
   - The same architectural landmarks must be recognizable
   - Changes should feel like evolution, not random replacement
   - At least 60% of the visual composition should be consistent
5. The imagePrompt should be optimized for the image model, ~80-120 words, descriptive and visual.
6. Respond with ONLY valid JSON, no markdown code fences.`;
}

function formatWeather(data: DataSnapshot): string {
  if (!data.weather) return "Weather: No data available";
  const w = data.weather;
  return `Weather: ${w.temp}°C ${w.condition} (${w.description}), humidity ${w.humidity}%, wind ${w.windSpeed} m/s, visibility ${w.visibility}m`;
}

function formatNews(data: DataSnapshot): string {
  if (!data.news || data.news.headlines.length === 0)
    return "News: No notable headlines";
  return (
    "News & Trends:\n" +
    data.news.headlines
      .map((h) => `- "${h.title}" (${h.source})`)
      .join("\n")
  );
}

function formatOnChain(data: DataSnapshot): string {
  if (!data.onChain) return "On-Chain: No data available";
  const c = data.onChain;
  const direction = c.sol24hChange >= 0 ? "+" : "";
  return `On-Chain: SOL $${c.solPrice.toFixed(2)} (${direction}${c.sol24hChange.toFixed(1)}% 24h), Volume $${(c.solVolume / 1e6).toFixed(1)}M`;
}

function formatCalendar(data: DataSnapshot): string {
  const parts: string[] = [];
  if (data.calendar?.holidays?.length) {
    parts.push(
      "Holidays: " + data.calendar.holidays.map((h) => h.name).join(", ")
    );
  }
  if (data.calendar?.customEvents?.length) {
    parts.push(
      "Cultural Events:\n" +
        data.calendar.customEvents
          .map((e) => `- ${e.name}: ${e.description} (Visual: ${e.visualImpact})`)
          .join("\n")
    );
  }
  return parts.length > 0 ? parts.join("\n") : "Calendar: No special events today";
}

function buildUserPrompt(
  config: MirrorTypeConfig,
  data: DataSnapshot,
  previousFrame: MirrorFrame | null
): string {
  let prompt = "";

  if (previousFrame) {
    prompt += `PREVIOUS FRAME (maintain continuity):
Description: ${previousFrame.sceneDescription}
Key visual elements: ${previousFrame.keyElements.join(", ")}
Dominant colors: ${previousFrame.dominantColors.join(", ")}
Mood: ${previousFrame.mood}

`;
  } else {
    prompt += `This is the GENESIS FRAME — the very first frame for this mirror. Establish the core visual composition that all future frames will evolve from. Make it iconic.

`;
  }

  prompt += `CURRENT DATA:
${formatWeather(data)}
${formatNews(data)}
${formatOnChain(data)}
${formatCalendar(data)}

Respond with this exact JSON structure:
{
  "sceneDescription": "150-250 word vivid scene description",
  "imagePrompt": "80-120 word image generation prompt optimized for Flux model",
  "mood": "one or two word mood",
  "dominantColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "keyElements": ["element1", "element2", "element3", "element4", "element5"],
  "dataSignals": ["signal1", "signal2", "signal3"],
  "continuityNotes": "what was kept from previous frame and why",
  "changeNotes": "what changed and why"
}`;

  return prompt;
}

function parseInterpretedScene(text: string): InterpretedScene {
  // Try to extract JSON from the response
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  return {
    sceneDescription: parsed.sceneDescription ?? "",
    imagePrompt: parsed.imagePrompt ?? "",
    mood: parsed.mood ?? "neutral",
    dominantColors: Array.isArray(parsed.dominantColors)
      ? parsed.dominantColors
      : [],
    keyElements: Array.isArray(parsed.keyElements) ? parsed.keyElements : [],
    dataSignals: Array.isArray(parsed.dataSignals) ? parsed.dataSignals : [],
    continuityNotes: parsed.continuityNotes ?? "",
    changeNotes: parsed.changeNotes ?? "",
  };
}

/**
 * Interpret data feeds into a scene description using Gemini Flash.
 *
 * NOTE: For production/full mode, swap to Claude Sonnet for richer
 * cultural interpretation. See docs/PHASE1_CULTURAL_MIRRORS.md.
 */
export async function interpretData(
  mirrorConfig: MirrorTypeConfig,
  dataSnapshot: DataSnapshot,
  previousFrame: MirrorFrame | null
): Promise<InterpretedScene> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY env var is required for mirror interpretation.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: buildSystemPrompt(mirrorConfig),
  });

  const userPrompt = buildUserPrompt(mirrorConfig, dataSnapshot, previousFrame);

  return withRetry(async () => {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("Gemini returned no text content");
    }

    return parseInterpretedScene(text);
  }, "Gemini interpretation");
}
