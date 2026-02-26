import type { MirrorTypeConfig } from "./types";

/**
 * Validate a MirrorTypeConfig — used before publishing user-created mirrors.
 */
export function validateMirrorConfig(
  config: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Config must be an object"] };
  }

  const c = config as Record<string, unknown>;

  // Required string fields
  for (const field of ["id", "name", "tagline", "description"] as const) {
    if (!c[field] || typeof c[field] !== "string") {
      errors.push(`Missing or invalid: ${field}`);
    }
  }

  // ID must be a valid slug
  if (typeof c.id === "string") {
    if (!/^[a-z0-9-]+$/.test(c.id)) {
      errors.push("id must be lowercase alphanumeric with hyphens only");
    }
    if (c.id.length < 2 || c.id.length > 30) {
      errors.push("id must be 2-30 characters");
    }
  }

  // dataFeedConfig
  const dfc = c.dataFeedConfig as Record<string, unknown> | undefined;
  if (!dfc || typeof dfc !== "object") {
    errors.push("Missing: dataFeedConfig");
  } else {
    const loc = dfc.location as Record<string, unknown> | undefined;
    if (!loc || typeof loc !== "object") {
      errors.push("Missing: dataFeedConfig.location");
    } else {
      if (typeof loc.lat !== "number" || loc.lat < -90 || loc.lat > 90) {
        errors.push("dataFeedConfig.location.lat must be between -90 and 90");
      }
      if (typeof loc.lon !== "number" || loc.lon < -180 || loc.lon > 180) {
        errors.push("dataFeedConfig.location.lon must be between -180 and 180");
      }
      if (!loc.city || typeof loc.city !== "string") {
        errors.push("Missing: dataFeedConfig.location.city");
      }
      if (!loc.country || typeof loc.country !== "string") {
        errors.push("Missing: dataFeedConfig.location.country");
      }
    }

    // Data weights
    const weights = dfc.dataWeights as Record<string, number> | undefined;
    if (weights && typeof weights === "object") {
      const sum = Object.values(weights).reduce(
        (a: number, b) => a + (typeof b === "number" ? b : 0),
        0
      );
      if (Math.abs(sum - 1.0) > 0.05) {
        errors.push(
          `dataWeights must sum to ~1.0 (currently ${sum.toFixed(2)})`
        );
      }
    }
  }

  // Style
  const style = c.style as Record<string, unknown> | undefined;
  if (!style || typeof style !== "object") {
    errors.push("Missing: style");
  } else {
    if (!style.basePrompt || typeof style.basePrompt !== "string") {
      errors.push("Missing: style.basePrompt");
    }
  }

  // Architectural anchors
  const anchors = c.architecturalAnchors;
  if (!Array.isArray(anchors) || anchors.length < 2) {
    errors.push("architecturalAnchors must have at least 2 entries");
  }

  // Cultural motifs
  const motifs = c.culturalMotifs;
  if (!Array.isArray(motifs) || motifs.length < 2) {
    errors.push("culturalMotifs must have at least 2 entries");
  }

  // Economics
  if (typeof c.mintPriceSol !== "number" || c.mintPriceSol <= 0) {
    errors.push("mintPriceSol must be > 0");
  }

  if (
    typeof c.updateCadenceHours !== "number" ||
    c.updateCadenceHours < 12
  ) {
    errors.push("updateCadenceHours must be >= 12");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type-safe cast after validation.
 */
export function asMirrorConfig(config: unknown): MirrorTypeConfig {
  return config as MirrorTypeConfig;
}
