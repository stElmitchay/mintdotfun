import type { LanguageModel } from "ai";
import { google } from "@ai-sdk/google";

export type AgentLlmProvider = "anthropic" | "google";

export function getAgentLlmProvider(): AgentLlmProvider {
  const raw = (process.env.AGENT_LLM_PROVIDER || "anthropic").toLowerCase();
  return raw === "google" ? "google" : "anthropic";
}

export function getDefaultAgentModel(kind: "chat" | "personality" | "memory"): string {
  const provider = getAgentLlmProvider();
  if (provider === "google") {
    if (kind === "chat") return "gemini-2.5-flash";
    return "gemini-2.5-flash";
  }

  // Anthropic defaults (updated to currently available Claude 4 family aliases/IDs).
  if (kind === "chat") return "claude-sonnet-4-0";
  return "claude-3-5-haiku-latest";
}

export function getAgentModel(modelId: string): LanguageModel {
  return getAgentModelForProvider(getAgentLlmProvider(), modelId);
}

export function getAgentModelForProvider(
  provider: AgentLlmProvider,
  modelId: string
): LanguageModel {
  if (provider === "google") return google(modelId);

  // Load Anthropic provider lazily so builds still pass when dependency
  // is not installed in constrained environments.
  try {
    const dynamicRequire = eval("require") as (id: string) => unknown;
    const mod = dynamicRequire("@ai-sdk/anthropic") as {
      anthropic?: (model: string) => LanguageModel;
    };
    if (typeof mod.anthropic !== "function") {
      throw new Error("Invalid @ai-sdk/anthropic module export.");
    }
    return mod.anthropic(modelId);
  } catch (err) {
    throw new Error(
      `AGENT_LLM_PROVIDER=anthropic but @ai-sdk/anthropic is unavailable. ` +
        `Install it in your environment. Original error: ${
          err instanceof Error ? err.message : String(err)
        }`
    );
  }
}

export function isUnsupportedProviderModelError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("unsupported model version") ||
    lower.includes("only supports models that implement specification version")
  );
}

export function getGoogleFallbackModel(kind: "chat" | "personality" | "memory"): string {
  if (kind === "chat") {
    return process.env.AGENT_CHAT_GOOGLE_FALLBACK_MODEL || "gemini-2.5-flash";
  }
  if (kind === "personality") {
    return (
      process.env.AGENT_PERSONALITY_GOOGLE_FALLBACK_MODEL || "gemini-2.5-flash"
    );
  }
  return process.env.AGENT_MEMORY_GOOGLE_FALLBACK_MODEL || "gemini-2.5-flash";
}
