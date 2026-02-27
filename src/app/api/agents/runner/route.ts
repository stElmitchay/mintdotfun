import { NextRequest, NextResponse } from "next/server";
import { listDueAutonomousAgents, runAgentWithLock } from "@/lib/agent/runner";

export const maxDuration = 120;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const started = Date.now();
    const batchSize = parsePositiveInt(process.env.AGENT_RUNNER_BATCH_SIZE, 10);
    const maxRuntimeMs = parsePositiveInt(
      process.env.AGENT_RUNNER_MAX_RUNTIME_MS,
      105000
    );

    const dueAgentIds = await listDueAutonomousAgents(batchSize * 2);
    if (dueAgentIds.length === 0) {
      return NextResponse.json({ action: "none", reason: "No due agents" });
    }

    const updated: Array<{ agentId: string; runId?: string; status: string }> = [];
    const failed: Array<{ agentId: string; error: string }> = [];
    let processed = 0;

    for (const agentId of dueAgentIds) {
      if (processed >= batchSize) break;
      if (Date.now() - started >= maxRuntimeMs) break;

      const idempotencyKey = `cron:${new Date().toISOString().slice(0, 13)}:${agentId}`;

      const result = await runAgentWithLock({
        agentId,
        triggerType: "cron",
        idempotencyKey,
        reason: "Scheduled autonomous run",
      });

      if (result.status === "failed") {
        failed.push({ agentId, error: result.reason });
      } else {
        updated.push({
          agentId,
          runId: result.runId,
          status: result.status,
        });
      }

      processed += 1;
    }

    return NextResponse.json({
      action: "runner-batch",
      due: dueAgentIds.length,
      processed,
      successCount: updated.length,
      failedCount: failed.length,
      updated,
      failed,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Agent runner failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}

