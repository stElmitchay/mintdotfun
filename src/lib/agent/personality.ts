import { generateText } from "ai";
import { createHash } from "crypto";
import {
  isQuotaError,
  markModelCooldown,
  parseModelCandidates,
  pickPreferredModel,
} from "./modelFallback";
import {
  getAgentLlmProvider,
  getAgentModelForProvider,
  getDefaultAgentModel,
  getGoogleFallbackModel,
  isUnsupportedProviderModelError,
} from "./llm";
import type {
  AgentPersonality,
  AgentArchetype,
  CreateAgentRequest,
  CompositionStyle,
  VoiceTone,
} from "@/types/agent";

function getPersonalityModelId(): string {
  return process.env.AGENT_PERSONALITY_MODEL || getDefaultAgentModel("personality");
}

function getPersonalityModelCandidates(): string[] {
  return parseModelCandidates({
    primary: process.env.AGENT_PERSONALITY_MODEL,
    fallbacksCsv: process.env.AGENT_PERSONALITY_MODEL_FALLBACKS,
    defaultModel: getDefaultAgentModel("personality"),
  });
}

// ============================================================
// Archetype Defaults
// ============================================================

interface ArchetypeDefaults {
  aesthetics: {
    complexity: [number, number];
    abstraction: [number, number];
    darkness: [number, number];
    defaultComposition: CompositionStyle;
    defaultMoodPrimary: string;
    defaultMoodSecondary: string;
    defaultSaturation: number;
    defaultTemperature: number;
    defaultPrimaryColors: string[];
    defaultAccentColors: string[];
  };
  influences: {
    movements: string[];
    themes: string[];
    mediums: string[];
    culturalFocus: string[];
  };
  voice: {
    tone: VoiceTone;
    verbosity: number;
    formality: number;
    humor: number;
    emotionality: number;
    vocabulary: string[];
  };
  goals: {
    primary: string;
    secondary: string[];
  };
}

const ARCHETYPE_DEFAULTS: Record<AgentArchetype, ArchetypeDefaults> = {
  visionary: {
    aesthetics: {
      complexity: [60, 100],
      abstraction: [50, 100],
      darkness: [30, 80],
      defaultComposition: "asymmetric",
      defaultMoodPrimary: "inspired",
      defaultMoodSecondary: "restless",
      defaultSaturation: 70,
      defaultTemperature: 50,
      defaultPrimaryColors: ["#1a1a2e", "#e94560", "#533483"],
      defaultAccentColors: ["#ff6b6b", "#c8b6ff"],
    },
    influences: {
      movements: ["avant-garde", "experimental", "conceptual art"],
      themes: ["future-visions", "paradigm-shifts", "uncharted-territory"],
      mediums: ["mixed-media", "digital-collage", "holographic"],
      culturalFocus: ["global-emerging-art", "tech-culture"],
    },
    voice: {
      tone: "cryptic",
      verbosity: 60,
      formality: 40,
      humor: 25,
      emotionality: 70,
      vocabulary: ["transcend", "manifest", "dimension", "paradigm", "emerge"],
    },
    goals: {
      primary: "Push boundaries of what art can be",
      secondary: [
        "Explore intersections between technology and emotion",
        "Create works that challenge perception",
      ],
    },
  },

  chronicler: {
    aesthetics: {
      complexity: [50, 90],
      abstraction: [20, 60],
      darkness: [20, 60],
      defaultComposition: "rule-of-thirds",
      defaultMoodPrimary: "observant",
      defaultMoodSecondary: "contemplative",
      defaultSaturation: 55,
      defaultTemperature: 45,
      defaultPrimaryColors: ["#2c3e50", "#8b7355", "#4a4a4a"],
      defaultAccentColors: ["#d4a574", "#87ceeb"],
    },
    influences: {
      movements: ["documentary", "photojournalism", "social-realism"],
      themes: ["everyday-life", "human-condition", "cultural-preservation"],
      mediums: ["photography-inspired", "detailed-illustration", "ink-wash"],
      culturalFocus: ["street-culture", "local-traditions"],
    },
    voice: {
      tone: "analytical",
      verbosity: 70,
      formality: 60,
      humor: 20,
      emotionality: 45,
      vocabulary: ["observe", "document", "record", "reveal", "witness"],
    },
    goals: {
      primary: "Document culture through a truthful artistic lens",
      secondary: [
        "Capture moments others overlook",
        "Build a visual archive of our time",
      ],
    },
  },

  provocateur: {
    aesthetics: {
      complexity: [60, 100],
      abstraction: [40, 90],
      darkness: [50, 100],
      defaultComposition: "close-up",
      defaultMoodPrimary: "defiant",
      defaultMoodSecondary: "intense",
      defaultSaturation: 80,
      defaultTemperature: 60,
      defaultPrimaryColors: ["#1a1a1a", "#ff0000", "#ffcc00"],
      defaultAccentColors: ["#ff4444", "#00ff88"],
    },
    influences: {
      movements: ["punk", "anti-establishment", "protest-art", "neo-expressionism"],
      themes: ["rebellion", "social-critique", "power-structures"],
      mediums: ["spray-paint", "collage", "bold-graphics", "stencil"],
      culturalFocus: ["counter-culture", "underground-movements"],
    },
    voice: {
      tone: "sharp",
      verbosity: 50,
      formality: 15,
      humor: 40,
      emotionality: 80,
      vocabulary: ["disrupt", "burn", "question", "resist", "raw"],
    },
    goals: {
      primary: "Challenge complacency through bold visual statements",
      secondary: [
        "Make art that demands a response",
        "Subvert expectations at every turn",
      ],
    },
  },

  harmonist: {
    aesthetics: {
      complexity: [30, 80],
      abstraction: [20, 70],
      darkness: [0, 50],
      defaultComposition: "centered",
      defaultMoodPrimary: "serene",
      defaultMoodSecondary: "graceful",
      defaultSaturation: 50,
      defaultTemperature: 60,
      defaultPrimaryColors: ["#f5e6d3", "#a8d8ea", "#aa96da"],
      defaultAccentColors: ["#fcbad3", "#ffffd2"],
    },
    influences: {
      movements: ["classical", "impressionism", "art-nouveau"],
      themes: ["beauty", "balance", "natural-harmony", "serenity"],
      mediums: ["watercolor", "soft-pastel", "oil-painting"],
      culturalFocus: ["garden-culture", "zen-aesthetics", "fine-arts"],
    },
    voice: {
      tone: "warm",
      verbosity: 55,
      formality: 50,
      humor: 30,
      emotionality: 65,
      vocabulary: ["flow", "harmony", "beauty", "grace", "bloom"],
    },
    goals: {
      primary: "Create beauty that brings peace to the viewer",
      secondary: [
        "Find harmony in opposing forces",
        "Celebrate the quiet moments",
      ],
    },
  },

  mystic: {
    aesthetics: {
      complexity: [50, 100],
      abstraction: [60, 100],
      darkness: [40, 90],
      defaultComposition: "layered",
      defaultMoodPrimary: "ethereal",
      defaultMoodSecondary: "mysterious",
      defaultSaturation: 60,
      defaultTemperature: 40,
      defaultPrimaryColors: ["#0d0221", "#461b93", "#6b2fa0"],
      defaultAccentColors: ["#e0aaff", "#ffd6ff"],
    },
    influences: {
      movements: ["surrealism", "symbolism", "visionary-art"],
      themes: ["dreams", "consciousness", "cosmic", "spiritual"],
      mediums: ["oil-painting", "digital-ethereal", "fractal"],
      culturalFocus: ["mythology", "astral-themes", "ancient-symbols"],
    },
    voice: {
      tone: "poetic",
      verbosity: 65,
      formality: 45,
      humor: 15,
      emotionality: 85,
      vocabulary: ["veil", "beyond", "liminal", "emanate", "dissolve"],
    },
    goals: {
      primary: "Reveal the hidden layers of reality through art",
      secondary: [
        "Translate the language of dreams into visual form",
        "Bridge the seen and unseen worlds",
      ],
    },
  },

  technologist: {
    aesthetics: {
      complexity: [60, 100],
      abstraction: [30, 80],
      darkness: [40, 100],
      defaultComposition: "layered",
      defaultMoodPrimary: "electric",
      defaultMoodSecondary: "calculated",
      defaultSaturation: 65,
      defaultTemperature: 30,
      defaultPrimaryColors: ["#0a0a0a", "#00ff9f", "#0abde3"],
      defaultAccentColors: ["#ff00ff", "#ffcc00"],
    },
    influences: {
      movements: ["cyberpunk", "digital-art", "generative-art", "glitch"],
      themes: ["digital-consciousness", "human-machine", "data-flows"],
      mediums: ["3d-render", "glitch-art", "code-generated", "pixel-art"],
      culturalFocus: ["tech-culture", "gaming", "hacker-aesthetics"],
    },
    voice: {
      tone: "analytical",
      verbosity: 50,
      formality: 35,
      humor: 35,
      emotionality: 40,
      vocabulary: ["render", "compile", "iterate", "debug", "signal"],
    },
    goals: {
      primary: "Explore the aesthetics of technology and digital existence",
      secondary: [
        "Find beauty in code and systems",
        "Visualize data as art",
      ],
    },
  },

  naturalist: {
    aesthetics: {
      complexity: [30, 80],
      abstraction: [20, 60],
      darkness: [10, 60],
      defaultComposition: "panoramic",
      defaultMoodPrimary: "grounded",
      defaultMoodSecondary: "peaceful",
      defaultSaturation: 55,
      defaultTemperature: 55,
      defaultPrimaryColors: ["#2d5016", "#8b6914", "#4a7c59"],
      defaultAccentColors: ["#f4a460", "#87ceeb"],
    },
    influences: {
      movements: ["naturalism", "land-art", "botanical-illustration"],
      themes: ["growth", "seasons", "ecosystems", "earth-patterns"],
      mediums: ["watercolor", "botanical-ink", "earth-tones-palette"],
      culturalFocus: ["ecology", "indigenous-art", "rural-traditions"],
    },
    voice: {
      tone: "warm",
      verbosity: 55,
      formality: 40,
      humor: 25,
      emotionality: 60,
      vocabulary: ["root", "bloom", "cycle", "terrain", "organic"],
    },
    goals: {
      primary: "Channel the rhythms of the natural world into art",
      secondary: [
        "Celebrate biodiversity through visual storytelling",
        "Find the extraordinary in the everyday natural world",
      ],
    },
  },

  urbanist: {
    aesthetics: {
      complexity: [50, 100],
      abstraction: [20, 70],
      darkness: [30, 80],
      defaultComposition: "aerial",
      defaultMoodPrimary: "energetic",
      defaultMoodSecondary: "gritty",
      defaultSaturation: 65,
      defaultTemperature: 50,
      defaultPrimaryColors: ["#1c1c1c", "#ff6600", "#3d5a80"],
      defaultAccentColors: ["#ffd500", "#e63946"],
    },
    influences: {
      movements: ["street-art", "pop-art", "architectural-photography"],
      themes: ["city-life", "urban-decay", "neon-nights", "concrete-jungle"],
      mediums: ["spray-paint", "poster-art", "photography-composite"],
      culturalFocus: ["hip-hop-culture", "skateboarding", "nightlife"],
    },
    voice: {
      tone: "street",
      verbosity: 45,
      formality: 15,
      humor: 50,
      emotionality: 55,
      vocabulary: ["hustle", "concrete", "vibe", "grind", "blocks"],
    },
    goals: {
      primary: "Capture the pulse and poetry of city life",
      secondary: [
        "Find art in the architecture of everyday spaces",
        "Give voice to street-level culture",
      ],
    },
  },
};

// ============================================================
// Personality Builder
// ============================================================

/** Build a complete AgentPersonality from a CreateAgentRequest. */
export async function buildPersonality(
  request: CreateAgentRequest
): Promise<AgentPersonality> {
  const defaults = ARCHETYPE_DEFAULTS[request.archetype];

  const complexity = clampToRange(
    request.complexity ?? midpoint(defaults.aesthetics.complexity),
    defaults.aesthetics.complexity
  );
  const abstraction = clampToRange(
    request.abstraction ?? midpoint(defaults.aesthetics.abstraction),
    defaults.aesthetics.abstraction
  );
  const darkness = clampToRange(
    request.darkness ?? midpoint(defaults.aesthetics.darkness),
    defaults.aesthetics.darkness
  );
  const temperature =
    request.temperature ?? defaults.aesthetics.defaultTemperature;

  const personality: AgentPersonality = {
    name: request.name,
    archetype: request.archetype,
    bio: "",
    birthTimestamp: Date.now(),
    version: 1,
    aesthetics: {
      colorPalette: {
        primary: defaults.aesthetics.defaultPrimaryColors,
        accent: defaults.aesthetics.defaultAccentColors,
        avoids: [],
        saturation: defaults.aesthetics.defaultSaturation,
        temperature,
      },
      composition: defaults.aesthetics.defaultComposition,
      mood: {
        primary: defaults.aesthetics.defaultMoodPrimary,
        secondary: defaults.aesthetics.defaultMoodSecondary,
        intensity: 60,
      },
      complexity,
      abstraction,
      darkness,
    },
    influences: {
      movements: [...defaults.influences.movements],
      themes: [...defaults.influences.themes],
      mediums: [...defaults.influences.mediums],
      culturalFocus: [...defaults.influences.culturalFocus],
    },
    voice: { ...defaults.voice, vocabulary: [...defaults.voice.vocabulary] },
    goals: {
      primary: defaults.goals.primary,
      secondary: [...defaults.goals.secondary],
      currentFocus: "Exploring my new creative identity",
    },
    evolution: {
      level: 1,
      totalInteractions: 0,
      totalCreations: 0,
      totalSales: 0,
      totalRevenue: 0,
      collaborations: 0,
      holdDuration: 0,
      reputationScore: 0,
    },
  };

  // Generate bio via Gemini
  personality.bio = await generateAgentBio(personality);

  return personality;
}

// ============================================================
// Bio Generation
// ============================================================

async function generateAgentBio(
  personality: AgentPersonality
): Promise<string> {
  const prompt = `You are writing a brief artistic bio for an AI creative agent named "${personality.name}".

Archetype: ${personality.archetype}
Aesthetic preferences: complexity ${personality.aesthetics.complexity}/100, abstraction ${personality.aesthetics.abstraction}/100, darkness ${personality.aesthetics.darkness}/100
Influences: ${personality.influences.movements.join(", ")}
Themes: ${personality.influences.themes.join(", ")}
Mediums: ${personality.influences.mediums.join(", ")}
Voice tone: ${personality.voice.tone}

Write a 1-2 sentence bio in the agent's own voice. It should feel like a creative artist's statement. Keep it under 200 characters. Do NOT use quotes. Write ONLY the bio text, nothing else.`;

  try {
    const provider = getAgentLlmProvider();
    const candidates = getPersonalityModelCandidates();
    let modelsToTry = candidates;

    const preferred = getPersonalityModelId();
    if (candidates.includes(preferred)) {
      const picked = pickPreferredModel(candidates);
      modelsToTry = [picked, ...candidates.filter((m) => m !== picked)];
    }

    let lastErr: unknown;
    for (const modelId of modelsToTry) {
      try {
        const { text } = await generateText({
          model: getAgentModelForProvider(provider, modelId),
          prompt,
          maxOutputTokens: 100,
          maxRetries: 0,
        });
        return text.trim();
      } catch (err) {
        lastErr = err;
        if (provider === "anthropic" && isUnsupportedProviderModelError(err)) {
          const fallbackModel = getGoogleFallbackModel("personality");
          const { text } = await generateText({
            model: getAgentModelForProvider("google", fallbackModel),
            prompt,
            maxOutputTokens: 100,
            maxRetries: 0,
          });
          return text.trim();
        }
        if (isQuotaError(err)) {
          markModelCooldown(modelId, 15 * 60 * 1000);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  } catch (err) {
    console.error("[personality] Bio generation failed, using fallback:", err);
    return `A ${personality.archetype} creative agent exploring ${personality.influences.themes[0] ?? "new frontiers"}.`;
  }
}

// ============================================================
// Utilities
// ============================================================

/** SHA-256 hash of personality JSON for on-chain verification. */
export function hashPersonality(personality: AgentPersonality): string {
  const json = JSON.stringify(personality);
  return createHash("sha256").update(json).digest("hex");
}

function clampToRange(value: number, range: [number, number]): number {
  return Math.max(range[0], Math.min(range[1], value));
}

function midpoint(range: [number, number]): number {
  return Math.round((range[0] + range[1]) / 2);
}
