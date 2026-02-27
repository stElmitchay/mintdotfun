import { NextRequest, NextResponse } from "next/server";
import {
  getAgentById,
  getAgentByMintAddress,
  getLatestReputationSnapshot,
  listReputationEvents,
} from "@/lib/agent/db";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
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

  const snapshot = await getLatestReputationSnapshot(agent.id);
  const recentEvents = await listReputationEvents(agent.id, 25);

  return NextResponse.json({
    reputation: snapshot ?? {
      xp_total: 0,
      reputation_score: agent.reputation_score ?? 0,
      score_breakdown: {},
      window_7d: {},
      window_30d: {},
      window_90d: {},
      created_at: null,
    },
    recentEvents,
  });
}

