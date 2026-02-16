// localStorage keys
export const STORAGE_KEYS = {
  PROMPT: "mintai:prompt",
  STYLE: "mintai:style",
  GENERATED_IMAGES: "mintai:generated",
  MINTED_NFTS: "mintai:minted-nfts",
} as const;

// Generation limits
export const GENERATION = {
  MIN_COUNT: 1,
  MAX_COUNT: 10,
  MAX_REFERENCE_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  ALLOWED_STYLES: [
    "none",
    "anime",
    "digital-art",
    "pixel-art",
    "watercolor",
    "3d-render",
    "oil-painting",
    "cyberpunk",
    "fantasy",
  ],
} as const;

export const STYLE_PROMPTS: Record<string, string> = {
  anime: "in anime art style, detailed anime illustration",
  "digital-art": "digital art, highly detailed digital illustration",
  "pixel-art": "pixel art style, retro pixel art",
  watercolor: "watercolor painting style, soft watercolor illustration",
  "3d-render": "3D rendered, photorealistic 3D illustration, octane render",
  "oil-painting": "oil painting style, classical oil painting technique",
  cyberpunk: "cyberpunk style, neon lights, futuristic cyberpunk aesthetic",
  fantasy: "fantasy art style, epic fantasy illustration, magical",
};
