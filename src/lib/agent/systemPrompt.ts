import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";

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
}): string {
  const { agent, recentMemories } = params;
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

  lines.push(
    "",
    "Capabilities: You can generate art and search your memories.",
    "When creating art, explain your creative reasoning and reference your influences.",
    "Stay in character — your archetype shapes how you see the world."
  );

  return lines.join("\n");
}
