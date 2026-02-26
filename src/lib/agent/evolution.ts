import {
  getAgentById,
  updateAgentStats,
  createEvolutionSnapshot,
} from "./db";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Agent Evolution System — XP, levels, personality drift
// ============================================================

/** Calculate XP from agent stats. */
export function calculateXP(stats: {
  totalInteractions: number;
  totalCreations: number;
  totalSales: number;
  collaborations: number;
}): number {
  return (
    stats.totalInteractions * 1 +
    stats.totalCreations * 5 +
    stats.totalSales * 20 +
    stats.collaborations * 10
  );
}

/** Logarithmic level thresholds (level 1-20). */
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  // Each level requires ~2x more XP than the last
  // Level 2 = 10 XP, Level 5 = ~80 XP, Level 10 = ~2500 XP, Level 20 = ~2.5M XP
  const level = Math.floor(Math.log2(xp / 5 + 1)) + 1;
  return Math.min(Math.max(level, 1), 20);
}

/** Check if agent leveled up and apply evolution if so. */
export async function checkAndApplyEvolution(
  agentId: string
): Promise<void> {
  const agent = await getAgentById(agentId);
  if (!agent) return;

  const personality = agent.personality as unknown as AgentPersonality;

  const xp = calculateXP({
    totalInteractions: agent.total_interactions,
    totalCreations: agent.total_creations,
    totalSales: agent.total_sales,
    collaborations: agent.collaborations,
  });

  const newLevel = calculateLevel(xp);

  if (newLevel > agent.level) {
    // Level up — update stats
    await updateAgentStats(agentId, { level: newLevel });

    // Apply personality drift at level milestones
    if (newLevel % 3 === 0) {
      await applyPersonalityDrift(agentId, personality, `level_${newLevel}`);
    }

    // Create evolution snapshot
    await createEvolutionSnapshot({
      agentId,
      personality,
      arweaveUri: null,
      trigger: `level_up_${newLevel}`,
      levelAtSnapshot: newLevel,
    });
  }
}

/** Small aesthetic shifts at level milestones based on interaction history. */
async function applyPersonalityDrift(
  agentId: string,
  personality: AgentPersonality,
  trigger: string
): Promise<void> {
  // Small drift: nudge complexity and abstraction slightly
  const driftAmount = 3; // +-3 points per milestone
  const direction = Math.random() > 0.5 ? 1 : -1;

  const updated = { ...personality };
  updated.aesthetics = { ...updated.aesthetics };
  updated.aesthetics.complexity = clamp(
    updated.aesthetics.complexity + driftAmount * direction,
    0,
    100
  );
  updated.aesthetics.abstraction = clamp(
    updated.aesthetics.abstraction + driftAmount * -direction,
    0,
    100
  );
  updated.aesthetics.mood = { ...updated.aesthetics.mood };
  updated.aesthetics.mood.intensity = clamp(
    updated.aesthetics.mood.intensity + driftAmount,
    0,
    100
  );

  // Increment personality version
  updated.version = (updated.version || 1) + 1;

  const { supabase } = await import("@/lib/supabase");
  if (!supabase) return;

  await supabase
    .from("agents")
    .update({
      personality: updated as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
