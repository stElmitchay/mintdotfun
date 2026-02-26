import { NextResponse } from "next/server";
import { getAgentAuthorityPubkey } from "@/lib/agent/agentAuthority";

/**
 * GET /api/agent/authority
 *
 * Returns the agent authority public key. Used by the client to
 * set updateAuthority on agent NFTs during minting.
 */
export async function GET() {
  try {
    const authority = getAgentAuthorityPubkey();
    return NextResponse.json({ authority });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Agent system not configured: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 503 }
    );
  }
}
