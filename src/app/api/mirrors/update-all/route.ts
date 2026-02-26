import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updateMirrorTypeWithLock } from "@/lib/mirrors/updater";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";

// Allow up to 120 seconds for the pipeline
export const maxDuration = 120;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * POST /api/mirrors/update-all
 *
 * Dynamic cron dispatcher. Finds the single most overdue mirror
 * and runs its update pipeline. Designed to be called hourly.
 *
 * Auth: CRON_SECRET bearer token.
 */
export async function POST(req: NextRequest) {
  // Authenticate with CRON_SECRET
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

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const requestStartedAt = Date.now();
    const batchSize = parsePositiveInt(
      process.env.MIRROR_UPDATE_ALL_BATCH_SIZE,
      8
    );
    const maxRuntimeMs = parsePositiveInt(
      process.env.MIRROR_UPDATE_ALL_MAX_RUNTIME_MS,
      105000
    );

    // Fetch all active mirror types
    const { data: types, error } = await supabase
      .from("mirror_types")
      .select("id, config, updated_at")
      .eq("is_active", true);

    if (error) throw error;
    if (!types || types.length === 0) {
      return NextResponse.json({ action: "none", reason: "No active mirrors" });
    }

    // Rank mirrors by how overdue they are.
    const now = Date.now();
    const overdueMirrors: { id: string; overdueMs: number }[] = [];

    for (const t of types) {
      const cfg = t.config as MirrorTypeConfig | null;
      const cadenceMs = (cfg?.updateCadenceHours ?? 24) * 60 * 60 * 1000;

      let msSinceUpdate: number;
      if (t.updated_at) {
        msSinceUpdate = now - new Date(t.updated_at).getTime();
      } else {
        // Never updated — treat as infinitely overdue
        msSinceUpdate = Infinity;
      }

      const overdueMs = msSinceUpdate - cadenceMs;

      if (overdueMs > 0) {
        overdueMirrors.push({ id: t.id, overdueMs });
      }
    }

    if (overdueMirrors.length === 0) {
      return NextResponse.json({
        action: "none",
        reason: "No mirrors are overdue",
        checked: types.length,
      });
    }

    overdueMirrors.sort((a, b) => b.overdueMs - a.overdueMs);
    const selected = overdueMirrors.slice(0, batchSize);

    const updated: Array<{
      mirrorType: string;
      frameNumber: number;
      deduped: boolean;
      durationMs: number;
      overdueMinutes: number;
    }> = [];
    const failed: Array<{ mirrorType: string; error: string }> = [];
    let stoppedEarly = false;

    for (const mirror of selected) {
      const elapsedMs = Date.now() - requestStartedAt;
      if (elapsedMs >= maxRuntimeMs) {
        stoppedEarly = true;
        break;
      }

      console.log(
        `[update-all] Updating ${mirror.id} (overdue by ${Math.round(mirror.overdueMs / 60000)}min)`
      );

      try {
        const { result, deduped } = await updateMirrorTypeWithLock(mirror.id);
        updated.push({
          mirrorType: result.mirrorType,
          frameNumber: result.frameNumber,
          deduped,
          durationMs: result.durationMs,
          overdueMinutes: Math.round(mirror.overdueMs / 60000),
        });
      } catch (e) {
        failed.push({
          mirrorType: mirror.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (updated.length === 0 && failed.length === 0) {
      return NextResponse.json({
        action: "none",
        reason: "Runtime budget exhausted before starting updates",
        checked: types.length,
        overdue: overdueMirrors.length,
        selected: selected.length,
      });
    }

    return NextResponse.json({
      action: "updated-batch",
      checked: types.length,
      overdue: overdueMirrors.length,
      selected: selected.length,
      updatedCount: updated.length,
      failedCount: failed.length,
      stoppedEarly,
      updated,
      failed,
    });
  } catch (err) {
    console.error("[api/mirrors/update-all] Failed:", err);
    return NextResponse.json(
      {
        error: `Update-all failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
