import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/marketplace/listings
 *
 * Returns marketplace listings. Supports filters:
 * - ?status=active (default) | sold | cancelled
 * - ?seller=<wallet>
 * - ?mint=<mint_address>
 * - ?search=<query>
 * - ?sort=newest (default) | price_asc | price_desc
 * - ?limit=<n>&offset=<n>
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const params = req.nextUrl.searchParams;
  const status = params.get("status") || "active";
  const seller = params.get("seller");
  const mint = params.get("mint");
  const search = params.get("search");
  const sort = params.get("sort") || "newest";
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");

  let query = supabase.from("listings").select("*").eq("status", status);

  if (seller) {
    query = query.eq("seller_wallet", seller);
  }

  if (mint) {
    query = query.eq("nft_mint_address", mint);
  }

  if (search) {
    query = query.or(
      `nft_name.ilike.%${search}%,nft_description.ilike.%${search}%`
    );
  }

  switch (sort) {
    case "price_asc":
      query = query.order("price_lamports", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_lamports", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("listed_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }

  // Transform to client Listing type
  const listings = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    mintAddress: row.nft_mint_address,
    sellerWallet: row.seller_wallet,
    priceLamports: Number(row.price_lamports),
    priceSol: Number(row.price_lamports) / 1e9,
    status: row.status,
    buyerWallet: row.buyer_wallet || undefined,
    listedAt: row.listed_at,
    soldAt: row.sold_at || undefined,
    nftName: row.nft_name,
    nftImageUrl: row.nft_image_url,
    nftDescription: row.nft_description,
  }));

  return NextResponse.json({ listings });
}
