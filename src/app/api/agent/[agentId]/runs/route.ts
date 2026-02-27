import { NextRequest, NextResponse } from "next/server";
import { requireAgentOwner } from "@/lib/agent/ownerAuth";
import { listAgentRuns } from "@/lib/agent/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);
  const runs = await listAgentRuns(owner.agent.id, Math.min(Math.max(limit, 1), 100));
  return NextResponse.json({ runs });
}

