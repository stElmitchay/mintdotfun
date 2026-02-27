import { NextRequest, NextResponse } from "next/server";
import { requireAgentOwner } from "@/lib/agent/ownerAuth";
import { ensureAgentPermissions, upsertAgentPermissions } from "@/lib/agent/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const owner = await requireAgentOwner(req, agentId);
  if (!owner.ok) return owner.response;

  const current = await ensureAgentPermissions(owner.agent);
  const permissions = await upsertAgentPermissions({
    agentId: owner.agent.id,
    ownerWallet: owner.agent.owner_wallet,
    mode: current.mode,
    allowedActions: current.allowed_actions,
    allowedTokens: current.allowed_tokens,
    maxTradeLamports: current.max_trade_lamports,
    dailySpendLimitLamports: current.daily_spend_limit_lamports,
    maxOpenPositions: current.max_open_positions,
    maxDrawdownBps: current.max_drawdown_bps,
    cooldownSeconds: current.cooldown_seconds,
    requireApprovalAboveLamports: current.require_approval_above_lamports,
    isPaused: true,
  });

  return NextResponse.json({ success: true, permissions });
}

