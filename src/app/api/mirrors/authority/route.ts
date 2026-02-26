import { NextResponse } from "next/server";
import { getMirrorAuthorityPubkey } from "@/lib/mirrors/mirrorAuthority";

/**
 * GET /api/mirrors/authority
 *
 * Returns the mirror authority public key.
 * Used by the client to set updateAuthority during mirror minting.
 */
export async function GET() {
  try {
    return NextResponse.json({ authority: getMirrorAuthorityPubkey() });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Failed to get mirror authority: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
