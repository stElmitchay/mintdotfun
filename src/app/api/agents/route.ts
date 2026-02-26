import { NextRequest, NextResponse } from "next/server";
import { getAllAgents } from "@/lib/agent/db";

// ============================================================
// GET /api/agents — List all agents
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const archetype = searchParams.get("archetype") || undefined;
    const sort = searchParams.get("sort") || "newest";

    const { agents, total } = await getAllAgents({ limit, offset, archetype, sort });

    return NextResponse.json({ agents, total });
  } catch (err) {
    console.error("Failed to list agents:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
