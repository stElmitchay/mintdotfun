import { NextResponse } from "next/server";
import { getMarketplaceAuthorityPubkey } from "@/lib/solana/marketplace";

export async function GET() {
  try {
    const authority = getMarketplaceAuthorityPubkey();
    return NextResponse.json({ authority });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Marketplace not configured: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 503 }
    );
  }
}
