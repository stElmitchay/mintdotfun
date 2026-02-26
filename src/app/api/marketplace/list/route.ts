import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuthorizedWallet, requirePrivyAuth } from "@/lib/auth/privy";

/**
 * POST /api/marketplace/list
 *
 * Registers a new listing after the seller has already submitted the
 * on-chain tx (addPlugin for FreezeDelegate + TransferDelegate).
 *
 * Body: { mintAddress, sellerWallet, priceLamports, txSignature, nftName, nftImageUrl, nftDescription }
 */
export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let body: {
    mintAddress: string;
    sellerWallet: string;
    priceLamports: number;
    txSignature: string;
    nftName: string;
    nftImageUrl: string;
    nftDescription: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mintAddress, sellerWallet, priceLamports, txSignature, nftName, nftImageUrl, nftDescription } = body;

  if (!mintAddress || !sellerWallet || !priceLamports || !nftName || !nftImageUrl) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const walletAuthError = requireAuthorizedWallet(
    auth,
    sellerWallet,
    "sellerWallet"
  );
  if (walletAuthError) return walletAuthError;

  if (priceLamports <= 0) {
    return NextResponse.json(
      { error: "Price must be greater than 0" },
      { status: 400 }
    );
  }

  // Check for existing active listing on this mint
  const { data: existing } = await supabase
    .from("listings")
    .select("id")
    .eq("nft_mint_address", mintAddress)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This NFT already has an active listing" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      nft_mint_address: mintAddress,
      seller_wallet: sellerWallet,
      price_lamports: priceLamports,
      list_tx: txSignature,
      nft_name: nftName,
      nft_image_url: nftImageUrl,
      nft_description: nftDescription || "",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }

  return NextResponse.json({ listing: data });
}
