import { NextRequest, NextResponse } from "next/server";
import { AgentPermissionInputSchema } from "@/lib/agent/autonomy";
import { requireAgentOwner } from "@/lib/agent/ownerAuth";
import {
  ensureAgentPermissions,
  upsertAgentPermissions,
} from "@/lib/agent/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  const permissions = await ensureAgentPermissions(owner.agent);
  return NextResponse.json({ permissions });
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

  const parsed = AgentPermissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const current = await ensureAgentPermissions(owner.agent);
  const input = parsed.data;
  const permissions = await upsertAgentPermissions({
    agentId: owner.agent.id,
    ownerWallet: owner.agent.owner_wallet,
    mode: input.mode ?? current.mode,
    allowedActions: input.allowedActions ?? current.allowed_actions,
    allowedTokens: input.allowedTokens ?? current.allowed_tokens,
    maxTradeLamports: input.maxTradeLamports ?? current.max_trade_lamports,
    dailySpendLimitLamports:
      input.dailySpendLimitLamports ?? current.daily_spend_limit_lamports,
    maxOpenPositions: input.maxOpenPositions ?? current.max_open_positions,
    maxDrawdownBps: input.maxDrawdownBps ?? current.max_drawdown_bps,
    cooldownSeconds: input.cooldownSeconds ?? current.cooldown_seconds,
    requireApprovalAboveLamports:
      input.requireApprovalAboveLamports ??
      current.require_approval_above_lamports,
    isPaused: current.is_paused,
  });

  return NextResponse.json({ success: true, permissions });
}

