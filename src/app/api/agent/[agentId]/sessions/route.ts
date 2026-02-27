import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/privy";
import {
  getAgentById,
  getAgentByMintAddress,
  listAgentSessions,
} from "@/lib/agent/db";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { agentId } = await params;
  const agent = isUuid(agentId)
    ? await getAgentById(agentId)
    : await getAgentByMintAddress(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const isOwner =
    auth.wallets.size === 0 ||
    auth.wallets.has(agent.owner_wallet.toLowerCase());
  if (!isOwner) {
    return NextResponse.json(
      { error: "Only the owner can view chat history" },
      { status: 403 }
    );
  }

  const sessions = await listAgentSessions(agent.id, 30);
  return NextResponse.json({ sessions });
}

