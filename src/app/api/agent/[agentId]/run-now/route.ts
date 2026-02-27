import { NextRequest, NextResponse } from "next/server";
import { requireAgentOwner } from "@/lib/agent/ownerAuth";
import { runAgentWithLock } from "@/lib/agent/runner";

export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  const idempotencyKey =
    req.headers.get("x-idempotency-key") ??
    `manual:${owner.agent.id}:${Date.now()}:${crypto.randomUUID()}`;

  const result = await runAgentWithLock({
    agentId: owner.agent.id,
    triggerType: "manual",
    idempotencyKey,
    reason: "Manual owner trigger",
  });

  return NextResponse.json({ success: true, result });
}
