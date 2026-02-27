import {
  createReputationEvent,
  listReputationEvents,
  upsertReputationSnapshot,
} from "./db";

export interface ReputationComputation {
  xpTotal: number;
  reputationScore: number;
  scoreBreakdown: Record<string, unknown>;
}

export async function emitRunReputationEvent(params: {
  agentId: string;
  outcome: "executed" | "failed" | "skipped";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (params.outcome === "executed") {
    await createReputationEvent({
      agentId: params.agentId,
      source: "run_result",
      xpDelta: 5,
      repDelta: 2,
      metadata: { outcome: params.outcome, ...(params.metadata ?? {}) },
    });
    return;
  }

  if (params.outcome === "failed") {
    await createReputationEvent({
      agentId: params.agentId,
      source: "run_result",
      xpDelta: -2,
      repDelta: -4,
      metadata: { outcome: params.outcome, ...(params.metadata ?? {}) },
    });
  }
}

export async function computeAndSnapshotReputation(
  agentId: string
): Promise<ReputationComputation> {
  const events = await listReputationEvents(agentId, 500);

  const xpTotal = Math.max(
    0,
    events.reduce((sum, e) => sum + Number(e.xp_delta || 0), 0)
  );
  const reputationScore = Math.max(
    0,
    events.reduce((sum, e) => sum + Number(e.rep_delta || 0), 0)
  );

  const scoreBreakdown = {
    runs: events.filter((e) => e.source === "run_result").length,
    positiveEvents: events.filter((e) => (e.rep_delta ?? 0) > 0).length,
    negativeEvents: events.filter((e) => (e.rep_delta ?? 0) < 0).length,
  };

  await upsertReputationSnapshot({
    agentId,
    xpTotal,
    reputationScore,
    scoreBreakdown,
    window7d: {},
    window30d: {},
    window90d: {},
  });

  return { xpTotal, reputationScore, scoreBreakdown };
}
