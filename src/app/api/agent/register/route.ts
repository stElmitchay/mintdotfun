import { NextRequest, NextResponse } from "next/server";
import { createAgentRecord, createEvolutionSnapshot } from "@/lib/agent/db";
import type { AgentPersonality } from "@/types/agent";
import { requireAuthorizedWallet, requirePrivyAuth } from "@/lib/auth/privy";

/**
 * POST /api/agent/register
 *
 * Called after the client-side Solana mint confirms. Creates the
 * agent record in Supabase and saves the genesis evolution snapshot.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  let body: {
    mintAddress: string;
    ownerWallet: string;
    personality: AgentPersonality;
    personalityHash: string;
    personalityArweaveUri: string;
    avatarUrl: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.mintAddress || !body.ownerWallet || !body.personality) {
    return NextResponse.json(
      { error: "Missing required fields: mintAddress, ownerWallet, personality" },
      { status: 400 }
    );
  }

  const walletAuthError = requireAuthorizedWallet(
    auth,
    body.ownerWallet,
    "ownerWallet"
  );
  if (walletAuthError) return walletAuthError;

  try {
    const agentId = await createAgentRecord({
      mintAddress: body.mintAddress,
      ownerWallet: body.ownerWallet,
      name: body.personality.name,
      archetype: body.personality.archetype,
      personality: body.personality,
      personalityHash: body.personalityHash,
      personalityArweaveUri: body.personalityArweaveUri,
      avatarUrl: body.avatarUrl,
    });

    await createEvolutionSnapshot({
      agentId,
      personality: body.personality,
      arweaveUri: body.personalityArweaveUri,
      trigger: "genesis",
      levelAtSnapshot: 1,
    });

    return NextResponse.json({ success: true, agentId });
  } catch (err) {
    console.error("[api/agent/register] Failed:", err);

    const message = err instanceof Error ? err.message : String(err);

    // Duplicate mint address
    if (message.includes("23505") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "Agent already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  }
}
