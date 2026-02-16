import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/marketplace/confirm-purchase
 *
 * Called after the buyer has sent and confirmed the purchase tx on-chain.
 * Updates the listing status to 'sold'.
 *
 * Body: { listingId, buyerWallet, txSignature }
 */
export async function POST(req: NextRequest) {
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let body: { listingId: string; buyerWallet: string; txSignature: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listingId, buyerWallet, txSignature } = body;
  if (!listingId || !buyerWallet || !txSignature) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "sold",
      buyer_wallet: buyerWallet,
      sale_tx: txSignature,
      sold_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "active")
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to confirm purchase:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }

  return NextResponse.json({ listing: data });
}
