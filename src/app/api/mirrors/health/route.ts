import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { status: "degraded", reason: "Database not configured" },
      { status: 503 }
    );
  }

  // Query all active mirror types from DB
  const { data: types, error } = await supabase
    .from("mirror_types")
    .select("id, config, updated_at, current_frame_number")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json(
      { status: "error", reason: error.message },
      { status: 500 }
    );
  }

  const now = Date.now();
  const results: Record<
    string,
    { lastUpdate: string | null; frameNumber: number; overdue: boolean }
  > = {};

  for (const t of types ?? []) {
    const cfg = t.config as MirrorTypeConfig | null;
    const cadenceHours = cfg?.updateCadenceHours ?? 24;
    const lastUpdate = t.updated_at;
    const msSinceUpdate = lastUpdate
      ? now - new Date(lastUpdate).getTime()
      : Infinity;
    const overdueMs = cadenceHours * 60 * 60 * 1000 * 1.5; // 50% grace

    results[t.id] = {
      lastUpdate,
      frameNumber: t.current_frame_number ?? 0,
      overdue: lastUpdate ? msSinceUpdate > overdueMs : false,
    };
  }

  const anyOverdue = Object.values(results).some((r) => r.overdue);

  return NextResponse.json({
    status: anyOverdue ? "warning" : "healthy",
    mirrors: results,
    checkedAt: new Date().toISOString(),
  });
}
