import {
  createAgentAction,
  createAgentRun,
  ensureAgentPermissions,
  finalizeAgentRun,
  getAgentById,
  getAgentInstructions,
  listAgentRuns,
} from "./db";
import { emitRunReputationEvent, computeAndSnapshotReputation } from "./reputation";
import { supabase } from "@/lib/supabase";

declare global {
  var __agentRunInFlight: Map<string, Promise<RunResult>> | undefined;
}

const inFlightRuns =
  globalThis.__agentRunInFlight ?? (globalThis.__agentRunInFlight = new Map());

export interface RunResult {
  agentId: string;
  runId?: string;
  status: "executed" | "failed" | "skipped";
  reason: string;
  ticks?: number;
  windowSeconds?: number;
}

type RunnerWindowConfig = {
  enabled: boolean;
  windowSeconds: number;
  intervalSeconds: number;
  maxActionsPerWindow: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function asBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getWindowConfig(strategyJson: Record<string, unknown> | undefined): RunnerWindowConfig {
  const enabled = asBool(process.env.AGENT_ACTIVE_WINDOW_ENABLED, false);
  const defaultWindowSeconds = parsePositiveInt(
    process.env.AGENT_ACTIVE_WINDOW_SECONDS,
    90
  );
  const defaultIntervalSeconds = parsePositiveInt(
    process.env.AGENT_ACTIVE_WINDOW_INTERVAL_SECONDS,
    20
  );
  const defaultMaxActions = parsePositiveInt(
    process.env.AGENT_ACTIVE_WINDOW_MAX_ACTIONS,
    4
  );
  const hardCapSeconds = parsePositiveInt(
    process.env.AGENT_RUN_HARD_CAP_SECONDS,
    100
  );

  const requestedWindow =
    typeof strategyJson?.activeWindowSeconds === "number"
      ? Math.floor(strategyJson.activeWindowSeconds)
      : defaultWindowSeconds;
  const requestedInterval =
    typeof strategyJson?.loopIntervalSeconds === "number"
      ? Math.floor(strategyJson.loopIntervalSeconds)
      : defaultIntervalSeconds;
  const requestedMaxActions =
    typeof strategyJson?.maxActionsPerWindow === "number"
      ? Math.floor(strategyJson.maxActionsPerWindow)
      : defaultMaxActions;

  return {
    enabled,
    windowSeconds: Math.max(10, Math.min(requestedWindow, hardCapSeconds)),
    intervalSeconds: Math.max(5, Math.min(requestedInterval, 60)),
    maxActionsPerWindow: Math.max(1, Math.min(requestedMaxActions, 20)),
  };
}

export async function runAgentWithLock(params: {
  agentId: string;
  triggerType: "cron" | "event" | "manual";
  idempotencyKey: string;
  reason?: string;
}): Promise<RunResult> {
  const existing = inFlightRuns.get(params.agentId);
  if (existing) return existing;

  const running = runAgent(params).finally(() => {
    inFlightRuns.delete(params.agentId);
  });

  inFlightRuns.set(params.agentId, running);
  return running;
}

async function runAgent(params: {
  agentId: string;
  triggerType: "cron" | "event" | "manual";
  idempotencyKey: string;
  reason?: string;
}): Promise<RunResult> {
  const agent = await getAgentById(params.agentId);
  if (!agent) {
    return {
      agentId: params.agentId,
      status: "failed",
      reason: "Agent not found",
    };
  }

  const existingRuns = await listAgentRuns(agent.id, 20);
  const duplicate = existingRuns.find((r) => r.idempotency_key === params.idempotencyKey);
  if (duplicate) {
    const status =
      duplicate.status === "planned" ? "skipped" : duplicate.status;
    return {
      agentId: agent.id,
      runId: duplicate.id,
      status,
      reason: "Duplicate idempotency key",
    };
  }

  const permissions = await ensureAgentPermissions(agent);
  const instructions = await getAgentInstructions(agent.id);

  const run = await createAgentRun({
    agentId: agent.id,
    triggerType: params.triggerType,
    status: "planned",
    reason: params.reason,
    idempotencyKey: params.idempotencyKey,
  });

  try {
    if (permissions.is_paused) {
      await finalizeAgentRun({
        runId: run.id,
        status: "skipped",
        reason: "Agent is paused",
      });
      await emitRunReputationEvent({
        agentId: agent.id,
        outcome: "skipped",
        metadata: { runId: run.id },
      });
      return {
        agentId: agent.id,
        runId: run.id,
        status: "skipped",
        reason: "Agent is paused",
      };
    }

    if (permissions.mode === "manual") {
      await finalizeAgentRun({
        runId: run.id,
        status: "skipped",
        reason: "Autonomy mode is manual",
      });
      await emitRunReputationEvent({
        agentId: agent.id,
        outcome: "skipped",
        metadata: { runId: run.id },
      });
      return {
        agentId: agent.id,
        runId: run.id,
        status: "skipped",
        reason: "Autonomy mode is manual",
      };
    }

    const strategyJson =
      (instructions?.strategy_json as Record<string, unknown> | undefined) ??
      undefined;
    const windowCfg = getWindowConfig(strategyJson);
    let ticks = 0;
    const startedAt = Date.now();
    const activeUntilMs = startedAt + windowCfg.windowSeconds * 1000;

    if (windowCfg.enabled) {
      while (Date.now() < activeUntilMs && ticks < windowCfg.maxActionsPerWindow) {
        ticks += 1;
        await createAgentAction({
          runId: run.id,
          agentId: agent.id,
          actionType:
            permissions.mode === "auto_create" ? "generate_art" : "strategy_tick",
          planPayload: {
            mode: permissions.mode,
            strategyText: instructions?.strategy_text ?? "",
            allowedActions: permissions.allowed_actions,
            tick: ticks,
            windowSeconds: windowCfg.windowSeconds,
          },
          riskCheckResult: {
            passed: true,
            checks: ["mode", "pause", "idempotency", "window_guardrails"],
          },
          executionResult: {
            status: "noop",
            note: "Window tick executed; strategy modules not connected yet",
          },
          status: "executed",
        });

        if (Date.now() + windowCfg.intervalSeconds * 1000 >= activeUntilMs) break;
        await sleep(windowCfg.intervalSeconds * 1000);
      }
    } else {
      ticks = 1;
      await createAgentAction({
        runId: run.id,
        agentId: agent.id,
        actionType:
          permissions.mode === "auto_create" ? "generate_art" : "strategy_tick",
        planPayload: {
          mode: permissions.mode,
          strategyText: instructions?.strategy_text ?? "",
          allowedActions: permissions.allowed_actions,
          tick: ticks,
          windowSeconds: 0,
        },
        riskCheckResult: {
          passed: true,
          checks: ["mode", "pause", "idempotency"],
        },
        executionResult: {
          status: "noop",
          note: "Execution scaffold active; strategy modules not connected yet",
        },
        status: "executed",
      });
    }

    await finalizeAgentRun({
      runId: run.id,
      status: "executed",
      reason: windowCfg.enabled
        ? `Runner window completed (${ticks} ticks)`
        : "Runner scaffold executed",
    });

    await emitRunReputationEvent({
      agentId: agent.id,
      outcome: "executed",
      metadata: { runId: run.id, triggerType: params.triggerType },
    });
    await computeAndSnapshotReputation(agent.id);

    return {
      agentId: agent.id,
      runId: run.id,
      status: "executed",
      reason: windowCfg.enabled
        ? `Runner window completed (${ticks} ticks)`
        : "Runner scaffold executed",
      ticks,
      windowSeconds: windowCfg.enabled ? windowCfg.windowSeconds : 0,
    };
  } catch (err) {
    await finalizeAgentRun({
      runId: run.id,
      status: "failed",
      reason: err instanceof Error ? err.message : "Run failed",
    }).catch(() => {});

    await emitRunReputationEvent({
      agentId: agent.id,
      outcome: "failed",
      metadata: { runId: run.id },
    }).catch(() => {});
    await computeAndSnapshotReputation(agent.id).catch(() => {});

    return {
      agentId: agent.id,
      runId: run.id,
      status: "failed",
      reason: err instanceof Error ? err.message : "Run failed",
    };
  }
}

export async function listDueAutonomousAgents(limit: number): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("agents")
    .select("id")
    .neq("autonomy_mode", "manual")
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list due agents: ${error.message}`);
  }

  return (data ?? []).map((row) => String(row.id));
}
