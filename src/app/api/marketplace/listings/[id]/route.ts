import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/marketplace/listings/[id]
 *
 * Returns a single listing by ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Listing not found" },
      { status: 404 }
    );
  }

  const listing = {
    id: data.id,
    mintAddress: data.nft_mint_address,
    sellerWallet: data.seller_wallet,
    priceLamports: Number(data.price_lamports),
    priceSol: Number(data.price_lamports) / 1e9,
    status: data.status,
    buyerWallet: data.buyer_wallet || undefined,
    listedAt: data.listed_at,
    soldAt: data.sold_at || undefined,
    nftName: data.nft_name,
    nftImageUrl: data.nft_image_url,
    nftDescription: data.nft_description,
  };

  return NextResponse.json({ listing });
}
