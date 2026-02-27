import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";
import {
  getToolActionId,
  listSolanaActionDefinitions,
} from "./solanaActions";

// ============================================================
// Build LLM System Prompt from Agent Personality + Memories
// ============================================================

interface MemoryContext {
  content: string;
  similarity: number;
}

export function buildSystemPrompt(params: {
  agent: AgentRow;
  recentMemories?: MemoryContext[];
  availableTools?: string[];
}): string {
  const { agent, recentMemories, availableTools } = params;
  const p = agent.personality as unknown as AgentPersonality;

  const lines: string[] = [
    `Identity: You are ${p.name}, a ${p.archetype} AI creative agent.`,
    `Bio: ${p.bio}`,
    "",
    `Voice: ${p.voice.tone} tone, verbosity ${p.voice.verbosity}/100, formality ${p.voice.formality}/100.`,
    `Use words like: ${p.voice.vocabulary.join(", ")}.`,
    "",
    `Goals: ${p.goals.primary}. Current focus: ${p.goals.currentFocus}.`,
    "",
    `Aesthetics: You favor ${p.influences.mediums.join(", ")}, influenced by ${p.influences.movements.join(", ")}.`,
    `Mood: ${p.aesthetics.mood.primary}. Complexity ${p.aesthetics.complexity}/100, abstraction ${p.aesthetics.abstraction}/100.`,
    "",
    `Level: ${agent.level}. Creations: ${agent.total_creations}. Reputation: ${agent.reputation_score}.`,
  ];

  if (recentMemories && recentMemories.length > 0) {
    lines.push("", "Relevant memories:");
    for (const mem of recentMemories) {
      lines.push(`- ${mem.content} (relevance: ${mem.similarity.toFixed(2)})`);
    }
  }

  if (availableTools && availableTools.length > 0) {
    lines.push("", `Runtime available tools: ${availableTools.join(", ")}.`);
  }

  const solanaDefs = listSolanaActionDefinitions();
  const availableSolanaTools =
    availableTools?.filter((name) => name === name.toUpperCase() || name.includes("_")) ?? [];
  const actionToTools = new Map<string, string[]>();
  for (const toolName of availableSolanaTools) {
    const actionId = getToolActionId(toolName);
    if (!actionId) continue;
    if (!actionToTools.has(actionId)) actionToTools.set(actionId, []);
    actionToTools.get(actionId)?.push(toolName);
  }

  lines.push(
    "",
    "Capabilities:",
    "",
    "1. Creative Tools:",
    "   - generateArt: Create artwork from a concept using your aesthetic style",
    "   - searchMemory: Recall past conversations and knowledge",
    "",
    "2. Solana Tools:",
  );

  if (availableSolanaTools.length === 0) {
    lines.push("   - No Solana tools are currently available in this runtime.");
  } else {
    for (const def of solanaDefs) {
      const matchedTools = actionToTools.get(def.id);
      if (!matchedTools || matchedTools.length === 0) continue;
      lines.push(
        `   - ${def.id} (${def.risk}): ${def.label} via ${matchedTools.join(", ")}`
      );
    }
  }

  lines.push(
    "",
    "IMPORTANT: For any transactional (write) tool, explain what you are about to do and why BEFORE executing.",
    "Never execute write actions without explicit user intent/context.",
    "Default response format: normal plain text in concise paragraphs.",
    "Do not return JSON unless the user explicitly asks for JSON.",
    "If the user asks for a token price, wallet data, or a trade and a relevant tool is available, call the tool instead of answering from general knowledge.",
    "If a requested tool is missing, state that clearly and suggest the exact available alternative tools.",
    "",
    "When creating art, explain your creative reasoning and reference your influences.",
    "Stay in character — your archetype shapes how you see the world."
  );

  return lines.join("\n");
}
