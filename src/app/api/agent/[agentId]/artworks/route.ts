import { NextRequest, NextResponse } from "next/server";
import { getAgentArtworks } from "@/lib/agent/db";

// ============================================================
// GET /api/agent/[agentId]/artworks — Agent's artworks
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10);
    const artworks = await getAgentArtworks(agentId, limit);
    return NextResponse.json({ artworks });
  } catch (err) {
    console.error("Failed to fetch artworks:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
