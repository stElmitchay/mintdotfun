import { NextRequest, NextResponse } from "next/server";
import { AgentInstructionInputSchema } from "@/lib/agent/autonomy";
import { requireAgentOwner } from "@/lib/agent/ownerAuth";
import { getAgentInstructions, upsertAgentInstructions } from "@/lib/agent/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  const instructions = await getAgentInstructions(owner.agent.id);
  return NextResponse.json({ instructions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AgentInstructionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const current = await getAgentInstructions(owner.agent.id);
  const input = parsed.data;
  const instructions = await upsertAgentInstructions({
    agentId: owner.agent.id,
    strategyText: input.strategyText ?? current?.strategy_text ?? "",
    strategyJson: input.strategyJson ?? current?.strategy_json ?? {},
    riskProfile: input.riskProfile ?? current?.risk_profile ?? "balanced",
    timeHorizon: input.timeHorizon ?? current?.time_horizon ?? "swing",
  });

  return NextResponse.json({ success: true, instructions });
}

