type ModelCooldownMap = Map<string, number>;

declare global {
  var __agentModelCooldowns: ModelCooldownMap | undefined;
}

const cooldowns: ModelCooldownMap =
  globalThis.__agentModelCooldowns ??
  (globalThis.__agentModelCooldowns = new Map());

export function parseModelCandidates(params: {
  primary?: string;
  fallbacksCsv?: string;
  defaultModel: string;
}): string[] {
  const primary = (params.primary || params.defaultModel).trim();
  const fallbacks = (params.fallbacksCsv || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("quota exceeded") ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("429")
  );
}

export function markModelCooldown(modelId: string, ms: number): void {
  cooldowns.set(modelId, Date.now() + ms);
}

export function isModelOnCooldown(modelId: string): boolean {
  const until = cooldowns.get(modelId);
  if (!until) return false;
  if (Date.now() >= until) {
    cooldowns.delete(modelId);
    return false;
  }
  return true;
}

export function pickPreferredModel(models: string[]): string {
  const available = models.find((m) => !isModelOnCooldown(m));
  return available ?? models[0];
}
