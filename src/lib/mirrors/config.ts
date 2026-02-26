import type { MirrorTypeConfig } from "./types";
import { getMirrorConfigFromDB, getAllActiveMirrorTypes } from "./db";

// ============================================================
// Mirror Type Configurations
// ============================================================

const DUBAI_MIRROR: MirrorTypeConfig = {
  id: "dubai",
  name: "Dubai Mirror",
  tagline: "The pulse of the desert metropolis",
  description:
    "A living artwork reflecting Dubai's cultural pulse — from scorching desert days to glittering art weeks, from Ramadan evenings to crypto market rallies. Every frame captures the city through real-time data, rendered in an art deco futurism style.",
  dataFeedConfig: {
    mirrorType: "dubai",
    location: { lat: 25.2048, lon: 55.2708, city: "Dubai", country: "AE" },
    weatherEnabled: true,
    newsKeywords: ["Dubai", "UAE", "Emirates", "DIFC", "Expo City"],
    newsRegion: "ae",
    onChainEnabled: true,
    calendarCountry: "AE",
    customEvents: [
      {
        name: "Ramadan",
        startMonth: 2,
        startDay: 28,
        endMonth: 3,
        endDay: 30,
        description: "Islamic holy month of fasting and reflection",
        visualImpact:
          "Crescent lanterns, warm amber tones, twilight sky, mosque silhouettes glowing softly",
      },
      {
        name: "Art Dubai",
        startMonth: 4,
        startDay: 14,
        endMonth: 4,
        endDay: 18,
        description: "International art fair at Madinat Jumeirah",
        visualImpact:
          "Gallery facades along waterfront, chrome geometric sculptures, art installations in foreground",
      },
      {
        name: "Dubai Design Week",
        startMonth: 11,
        startDay: 5,
        endMonth: 11,
        endDay: 10,
        description: "Annual design festival at Dubai Design District",
        visualImpact:
          "Experimental structures, neon design installations, d3 district architecture",
      },
      {
        name: "Dubai Shopping Festival",
        startMonth: 12,
        startDay: 15,
        endMonth: 1,
        endDay: 28,
        description: "Major retail and entertainment festival",
        visualImpact:
          "Fireworks over skyline, illuminated malls, festive golden lights, shopping bag motifs",
      },
      {
        name: "F1 Abu Dhabi Grand Prix",
        startMonth: 12,
        startDay: 5,
        endMonth: 12,
        endDay: 8,
        description: "Season-ending Formula 1 race at Yas Marina",
        visualImpact:
          "Racing stripes of light, speed blur effects, checkered patterns in the sky",
      },
    ],
    dataWeights: {
      weather: 0.3,
      news: 0.2,
      onChain: 0.15,
      social: 0.1,
      calendar: 0.25,
    },
  },
  style: {
    basePrompt:
      "art deco illustration style, geometric patterns, metallic gold and copper tones, strong vertical lines reflecting skyline architecture, warm desert palette, luxurious futurism",
    negativePrompt:
      "photographic, realistic, 3D render, cartoon, low quality, blurry, text, watermark",
    aspectRatio: "1:1",
    outputFormat: "webp",
    outputQuality: 90,
    promptStrength: 0.65,
  },
  updateCadenceHours: 24,
  updateTimeUtc: "06:00",
  architecturalAnchors: [
    "Burj Khalifa silhouette as central vertical anchor",
    "Museum of the Future (toroid ring shape) in mid-ground",
    "Dubai Frame structure visible on one side",
    "Water/marina foreground with reflections",
  ],
  culturalMotifs: [
    "Islamic geometric patterns as decorative borders",
    "Desert sand gradients at the horizon line",
    "Gold and copper metallic accents throughout",
    "Construction cranes as symbols of perpetual growth",
  ],
  colorPaletteGuidelines:
    "Base palette: warm golds (#C8963E, #D4A574), deep navy (#1E3A5F), sky blue (#87CEEB), copper (#B87333). Accent with royal purple (#4A0E8F) during crypto rallies. Shift to warm ambers (#F5A623) during cultural events. Desaturate to sandy neutrals during calm periods.",
  mintPriceSol: 0.5,
  maxSupply: 100,
};

const LAGOS_MIRROR: MirrorTypeConfig = {
  id: "lagos",
  name: "Lagos Pulse",
  tagline: "The heartbeat of Africa's creative capital",
  description:
    "A living artwork channeling Lagos's explosive creative energy — Afrobeats rhythms, Nollywood drama, tech innovation, and vibrant street culture. Rendered in maximalist Afrofuturist style with bold textile patterns.",
  dataFeedConfig: {
    mirrorType: "lagos",
    location: { lat: 6.5244, lon: 3.3792, city: "Lagos", country: "NG" },
    weatherEnabled: true,
    newsKeywords: [
      "Lagos",
      "Nigeria",
      "Afrobeats",
      "Nollywood",
      "Nigerian tech",
    ],
    newsRegion: "ng",
    onChainEnabled: true,
    calendarCountry: "NG",
    customEvents: [
      {
        name: "Lagos Fashion Week",
        startMonth: 10,
        startDay: 23,
        endMonth: 10,
        endDay: 27,
        description: "Premier fashion event showcasing African designers",
        visualImpact:
          "Ankara/Adire fabric textures woven into architecture, runway light beams, fashion silhouettes",
      },
      {
        name: "Felabration",
        startMonth: 10,
        startDay: 14,
        endMonth: 10,
        endDay: 20,
        description: "Week-long celebration of Fela Kuti's music and legacy",
        visualImpact:
          "Musical notes floating in air, saxophone silhouettes, Afrobeat album art patterns, warm stage lighting",
      },
      {
        name: "Lagos Biennial",
        startMonth: 11,
        startDay: 1,
        endMonth: 12,
        endDay: 15,
        description: "Contemporary art exhibition across Lagos",
        visualImpact:
          "Gallery installations scattered across cityscape, abstract art elements, cultural exhibition energy",
      },
    ],
    dataWeights: {
      weather: 0.2,
      news: 0.25,
      onChain: 0.15,
      social: 0.15,
      calendar: 0.25,
    },
  },
  style: {
    basePrompt:
      "vibrant maximalist Afrofuturist illustration, bold Ankara and Adire textile patterns woven into architectural forms, energetic yellows greens and reds, bustling urban energy, Third Mainland Bridge perspective",
    negativePrompt:
      "photographic, realistic, 3D render, cartoon, low quality, blurry, text, watermark, dull colors",
    aspectRatio: "1:1",
    outputFormat: "webp",
    outputQuality: 90,
    promptStrength: 0.65,
  },
  updateCadenceHours: 24,
  updateTimeUtc: "07:00",
  architecturalAnchors: [
    "Third Mainland Bridge spanning the composition",
    "Lagos Island skyline with modern towers",
    "Lekki Toll Gate as a recognizable landmark",
    "Bustling market/street scene in foreground",
  ],
  culturalMotifs: [
    "Ankara and Adire textile patterns as borders and fills",
    "Afrofuturist technology elements",
    "Musical instruments and sound waves",
    "Yellow danfo bus as an iconic element",
  ],
  colorPaletteGuidelines:
    "Base palette: bold yellow (#F5A623), deep green (#1B5E20), vibrant red (#D32F2F), rich purple (#6A1B9A). Accent with electric blue (#00BCD4) for tech moments. Warm orange (#FF6D00) for cultural events. Earth tones (#8D6E63) for grounding.",
  mintPriceSol: 0.5,
  maxSupply: 100,
};

const TOKYO_MIRROR: MirrorTypeConfig = {
  id: "tokyo",
  name: "Tokyo Neon",
  tagline: "Where tradition dissolves into electric light",
  description:
    "A living artwork fusing Tokyo's ancient traditions with its neon-drenched modernity — cherry blossoms and circuit boards, temple bells and arcade sounds. Rendered in a cyberpunk ukiyo-e fusion style.",
  dataFeedConfig: {
    mirrorType: "tokyo",
    location: { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "JP" },
    weatherEnabled: true,
    newsKeywords: [
      "Tokyo",
      "Japan",
      "anime",
      "Japanese tech",
      "Nintendo",
      "Sony",
    ],
    newsRegion: "jp",
    onChainEnabled: true,
    calendarCountry: "JP",
    customEvents: [
      {
        name: "Cherry Blossom Season",
        startMonth: 3,
        startDay: 20,
        endMonth: 4,
        endDay: 15,
        description: "Sakura blooming across Tokyo",
        visualImpact:
          "Pink cherry blossom petals drifting across the neon cityscape, soft pink glow, hanami lanterns",
      },
      {
        name: "Tokyo Game Show",
        startMonth: 9,
        startDay: 26,
        endMonth: 9,
        endDay: 29,
        description: "Major video game expo at Makuhari Messe",
        visualImpact:
          "Pixel art overlay, game controller motifs, holographic game characters in the skyline",
      },
      {
        name: "Comiket",
        startMonth: 8,
        startDay: 11,
        endMonth: 8,
        endDay: 13,
        description: "World's largest doujinshi fair",
        visualImpact:
          "Manga panel borders in the sky, character silhouettes, speed lines, otaku energy",
      },
    ],
    dataWeights: {
      weather: 0.25,
      news: 0.2,
      onChain: 0.15,
      social: 0.15,
      calendar: 0.25,
    },
  },
  style: {
    basePrompt:
      "cyberpunk ukiyo-e fusion illustration, neon-drenched Shibuya cityscape with woodblock-print texture and flat color planes, rain as a frequent motif, kanji signage, dense urban layering",
    negativePrompt:
      "photographic, realistic, 3D render, cartoon, low quality, blurry, text, watermark",
    aspectRatio: "1:1",
    outputFormat: "webp",
    outputQuality: 90,
    promptStrength: 0.65,
  },
  updateCadenceHours: 24,
  updateTimeUtc: "00:00",
  architecturalAnchors: [
    "Shibuya Crossing viewed from above or street level",
    "Tokyo Tower or Skytree in the background skyline",
    "Dense neon signage in kanji and katakana",
    "Train tracks / Yamanote Line cutting through the scene",
  ],
  culturalMotifs: [
    "Cherry blossom petals (when in season)",
    "Ukiyo-e wave patterns as decorative elements",
    "Torii gate silhouettes blending into neon",
    "Rain droplets and wet reflections",
  ],
  colorPaletteGuidelines:
    "Base palette: electric pink (#FF1493), deep indigo (#1A237E), neon cyan (#00E5FF), warm amber (#FFB300). Accent with sakura pink (#FFB7C5) during cherry blossom season. Cool blue-grey (#78909C) for rainy days. Hot red (#FF1744) for festivals.",
  mintPriceSol: 0.5,
  maxSupply: 100,
};

const SOLANA_MIRROR: MirrorTypeConfig = {
  id: "solana",
  name: "Solana Pulse",
  tagline: "The on-chain heartbeat, visualized",
  description:
    "A living artwork that breathes with the Solana blockchain — expanding in bull runs, contracting in downturns, pulsing with every transaction. Pure data art driven by on-chain metrics.",
  dataFeedConfig: {
    mirrorType: "solana",
    location: { lat: 0, lon: 0, city: "Solana", country: "CHAIN" },
    weatherEnabled: false,
    newsKeywords: ["Solana", "SOL", "DeFi", "Solana NFT", "Metaplex"],
    newsRegion: "us",
    onChainEnabled: true,
    calendarCountry: "US",
    customEvents: [
      {
        name: "Solana Breakpoint",
        startMonth: 9,
        startDay: 19,
        endMonth: 9,
        endDay: 21,
        description: "Annual Solana ecosystem conference",
        visualImpact:
          "Conference stage lighting, connected nodes forming constellation patterns, community energy",
      },
    ],
    dataWeights: {
      weather: 0,
      news: 0.2,
      onChain: 0.6,
      social: 0.1,
      calendar: 0.1,
    },
  },
  style: {
    basePrompt:
      "abstract data visualization art, flowing particle systems, network graphs, energy fields, Solana purple and green as base palette, generative art aesthetic, clean geometric forms",
    negativePrompt:
      "photographic, realistic, faces, text, watermark, low quality, blurry, cluttered",
    aspectRatio: "1:1",
    outputFormat: "webp",
    outputQuality: 90,
    promptStrength: 0.65,
  },
  updateCadenceHours: 12,
  updateTimeUtc: "00:00,12:00",
  architecturalAnchors: [
    "Central node/orb representing the Solana network",
    "Radiating connection lines forming a network graph",
    "Particle flows representing transaction volume",
    "Subtle price chart woven into the landscape as terrain",
  ],
  culturalMotifs: [
    "Solana logo shape as a recurring geometric element",
    "Flowing data streams in purple and green",
    "Validator nodes as glowing spheres",
    "Transaction signatures as tiny light particles",
  ],
  colorPaletteGuidelines:
    "Base palette: Solana purple (#9945FF), Solana green (#14F195), deep space black (#0D1117), electric blue (#00D4FF). Brighten and expand during rallies. Darken and contract during downturns. Gold (#FFD700) for ATH moments.",
  mintPriceSol: 0.25,
  maxSupply: 200,
};

const NEWYORK_MIRROR: MirrorTypeConfig = {
  id: "newyork",
  name: "New York Rhythm",
  tagline: "The city that never sleeps, and neither does its mirror",
  description:
    "A living artwork channeling NYC's relentless energy — Wall Street's highs, Broadway's lights, Brooklyn's grit, and Manhattan's ambition. Rendered in a noir-meets-street-art style.",
  dataFeedConfig: {
    mirrorType: "newyork",
    location: {
      lat: 40.7128,
      lon: -74.006,
      city: "New York",
      country: "US",
    },
    weatherEnabled: true,
    newsKeywords: [
      "New York",
      "NYC",
      "Manhattan",
      "Brooklyn",
      "Wall Street",
      "Broadway",
    ],
    newsRegion: "us",
    onChainEnabled: true,
    calendarCountry: "US",
    customEvents: [
      {
        name: "Met Gala",
        startMonth: 5,
        startDay: 5,
        endMonth: 5,
        endDay: 5,
        description: "Annual fundraising gala for the Metropolitan Museum",
        visualImpact:
          "Red carpet glow, haute couture silhouettes on museum steps, flashbulb lighting",
      },
      {
        name: "New York Fashion Week",
        startMonth: 9,
        startDay: 6,
        endMonth: 9,
        endDay: 14,
        description: "Biannual fashion showcase",
        visualImpact:
          "Runway lights cutting through the skyline, fashion silhouettes, fabric textures in architecture",
      },
      {
        name: "Tribeca Film Festival",
        startMonth: 6,
        startDay: 4,
        endMonth: 6,
        endDay: 15,
        description: "Annual film festival in Lower Manhattan",
        visualImpact:
          "Film reel motifs, cinema marquee lights, projected images on building facades",
      },
      {
        name: "New Year's Eve",
        startMonth: 12,
        startDay: 31,
        endMonth: 12,
        endDay: 31,
        description: "Times Square ball drop celebration",
        visualImpact:
          "Cascading confetti, crystal ball, countdown numbers, fireworks over skyline, champagne gold",
      },
    ],
    dataWeights: {
      weather: 0.25,
      news: 0.25,
      onChain: 0.1,
      social: 0.15,
      calendar: 0.25,
    },
  },
  style: {
    basePrompt:
      "noir illustration meets street art, high-contrast black and white base with selective color pops, yellow taxi accents, red neon, gritty editorial cinematic style, steam rising from manholes, wet pavement reflections",
    negativePrompt:
      "photographic, realistic, 3D render, cartoon, low quality, blurry, text, watermark, bright pastel",
    aspectRatio: "1:1",
    outputFormat: "webp",
    outputQuality: 90,
    promptStrength: 0.65,
  },
  updateCadenceHours: 24,
  updateTimeUtc: "12:00",
  architecturalAnchors: [
    "Empire State Building or One World Trade in the skyline",
    "Yellow taxi in the foreground street",
    "Steam/smoke atmospheric elements rising from street",
    "Brooklyn Bridge cables or structure visible",
  ],
  culturalMotifs: [
    "Graffiti and street art tags on building walls",
    "Broadway marquee neon signs",
    "Subway entrance and transit elements",
    "Steam rising from manholes creating atmosphere",
  ],
  colorPaletteGuidelines:
    "Base palette: high-contrast black (#0A0A0A) and white (#F5F5F5) with selective color pops. Taxi yellow (#F5C518) for street energy. Neon red (#FF1744) for nightlife. Cool blue (#42A5F5) for clear skies. Warm amber (#FFB300) for golden hour.",
  mintPriceSol: 0.5,
  maxSupply: 100,
};

// ============================================================
// Exports
// ============================================================

export const MIRROR_CONFIGS: Record<string, MirrorTypeConfig> = {
  dubai: DUBAI_MIRROR,
  lagos: LAGOS_MIRROR,
  tokyo: TOKYO_MIRROR,
  solana: SOLANA_MIRROR,
  newyork: NEWYORK_MIRROR,
};

function hasFullMirrorConfigShape(
  config: Partial<MirrorTypeConfig> | null | undefined
): config is MirrorTypeConfig {
  if (!config) return false;
  return (
    typeof config.id === "string" &&
    !!config.dataFeedConfig &&
    !!config.style &&
    Array.isArray(config.architecturalAnchors) &&
    Array.isArray(config.culturalMotifs) &&
    typeof config.updateTimeUtc === "string" &&
    typeof config.colorPaletteGuidelines === "string"
  );
}

function mergeWithHardcodedDefaults(
  type: string,
  dbConfig: Partial<MirrorTypeConfig>
): MirrorTypeConfig {
  const hardcoded = MIRROR_CONFIGS[type];
  if (!hardcoded) {
    throw new Error(
      `Mirror "${type}" has an incomplete config in DB and no hardcoded fallback.`
    );
  }

  return {
    ...hardcoded,
    ...dbConfig,
    id: dbConfig.id ?? hardcoded.id ?? type,
    dataFeedConfig: dbConfig.dataFeedConfig ?? hardcoded.dataFeedConfig,
    style: dbConfig.style ?? hardcoded.style,
    architecturalAnchors:
      dbConfig.architecturalAnchors ?? hardcoded.architecturalAnchors,
    culturalMotifs: dbConfig.culturalMotifs ?? hardcoded.culturalMotifs,
    colorPaletteGuidelines:
      dbConfig.colorPaletteGuidelines ?? hardcoded.colorPaletteGuidelines,
    updateTimeUtc: dbConfig.updateTimeUtc ?? hardcoded.updateTimeUtc,
  };
}

/**
 * Get mirror config — DB first, hardcoded fallback.
 * Supports both the original 5 mirrors and user-created mirrors stored in DB.
 */
export async function getMirrorConfig(type: string): Promise<MirrorTypeConfig> {
  // Try DB first (works for user-created mirrors AND original 5 if seeded)
  try {
    const dbConfig = (await getMirrorConfigFromDB(type)) as
      | Partial<MirrorTypeConfig>
      | null;
    if (dbConfig) {
      if (hasFullMirrorConfigShape(dbConfig)) {
        return dbConfig;
      }
      // Backward compatibility for legacy rows that stored only summary fields.
      return mergeWithHardcodedDefaults(type, dbConfig);
    }
  } catch {
    // DB unavailable — fall through to hardcoded
  }

  // Fallback to hardcoded (safety net for original 5)
  const hardcoded = MIRROR_CONFIGS[type];
  if (hardcoded) return hardcoded;

  throw new Error(`Unknown mirror type: ${type}`);
}

/**
 * Get all active mirror type IDs — union of DB + hardcoded.
 */
export async function getAllMirrorTypeIds(): Promise<string[]> {
  const hardcodedIds = Object.keys(MIRROR_CONFIGS);

  try {
    const dbTypes = await getAllActiveMirrorTypes();
    const dbIds = dbTypes.map((t) => t.id);
    return [...new Set([...dbIds, ...hardcodedIds])];
  } catch {
    return hardcodedIds;
  }
}
