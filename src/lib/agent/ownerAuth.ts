import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/privy";
import { getAgentById, getAgentByMintAddress } from "./db";
import type { AgentRow } from "@/lib/supabase";

type OwnerAuthSuccess = {
  ok: true;
  agent: AgentRow;
  auth: Awaited<ReturnType<typeof requirePrivyAuth>> & { ok: true };
};

type OwnerAuthFailure = {
  ok: false;
  response: NextResponse;
};

type OwnerAuthResult = OwnerAuthSuccess | OwnerAuthFailure;

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function requireAgentOwner(
  req: NextRequest,
  agentRef: string
): Promise<OwnerAuthResult> {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth;

  const agent = isUuid(agentRef)
    ? await getAgentById(agentRef)
    : await getAgentByMintAddress(agentRef);
  if (!agent) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Agent not found" }, { status: 404 }),
    };
  }

  if (auth.wallets.size === 0) {
    console.warn(
      "[auth] No wallet addresses found in Privy claims during owner check; allowing owner mutation path."
    );
    return { ok: true, agent, auth };
  }

  if (!auth.wallets.has(agent.owner_wallet.toLowerCase())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only the owner can modify this agent" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, agent, auth };
}
