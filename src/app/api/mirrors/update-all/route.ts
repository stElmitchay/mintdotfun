import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updateMirrorType } from "@/lib/mirrors/updater";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";

// Allow up to 120 seconds for the pipeline
export const maxDuration = 120;

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
    // Fetch all active mirror types
    const { data: types, error } = await supabase
      .from("mirror_types")
      .select("id, config, updated_at")
      .eq("is_active", true);

    if (error) throw error;
    if (!types || types.length === 0) {
      return NextResponse.json({ action: "none", reason: "No active mirrors" });
    }

    // Find the most overdue mirror
    const now = Date.now();
    let mostOverdue: { id: string; overdueMs: number } | null = null;

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
        if (!mostOverdue || overdueMs > mostOverdue.overdueMs) {
          mostOverdue = { id: t.id, overdueMs };
        }
      }
    }

    if (!mostOverdue) {
      return NextResponse.json({
        action: "none",
        reason: "No mirrors are overdue",
        checked: types.length,
      });
    }

    // Update the most overdue mirror
    console.log(
      `[update-all] Updating ${mostOverdue.id} (overdue by ${Math.round(mostOverdue.overdueMs / 60000)}min)`
    );

    const result = await updateMirrorType(mostOverdue.id);

    return NextResponse.json({
      action: "updated",
      ...result,
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
