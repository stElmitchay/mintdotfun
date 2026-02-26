import { NextRequest, NextResponse } from "next/server";
import { getAgentById, getAgentByMintAddress } from "@/lib/agent/db";

// ============================================================
// GET /api/agent/[agentId] — Fetch agent details
// ============================================================

/** Detect if a string is a UUID (vs a Solana mint address). */
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const agent = isUuid(agentId)
    ? await getAgentById(agentId)
    : await getAgentByMintAddress(agentId);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(agent);
}
