import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getMarketplaceUmi,
  getMarketplaceSigner,
} from "@/lib/solana/marketplace";
import { publicKey as toPublicKey } from "@metaplex-foundation/umi";
import {
  fetchAsset,
  updatePlugin,
  revokePluginAuthority,
} from "@metaplex-foundation/mpl-core";

/**
 * POST /api/marketplace/delist
 *
 * Delists an NFT: thaws it, revokes FreezeDelegate and TransferDelegate,
 * then updates the listing to 'cancelled'.
 *
 * Since the marketplace authority IS the delegate, it can revoke itself
 * without the seller signing — 0 wallet popups for the seller.
 *
 * Body: { listingId, sellerWallet }
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

  let body: { listingId: string; sellerWallet: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listingId, sellerWallet } = body;
  if (!listingId || !sellerWallet) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Fetch listing and verify ownership
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json(
      { error: "Listing not found" },
      { status: 404 }
    );
  }

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "Listing is no longer active" },
      { status: 410 }
    );
  }

  if (listing.seller_wallet !== sellerWallet) {
    return NextResponse.json(
      { error: "Only the seller can delist" },
      { status: 403 }
    );
  }

  try {
    const umi = getMarketplaceUmi();
    const marketplaceSigner = getMarketplaceSigner();
    const mintPubkey = toPublicKey(listing.nft_mint_address);

    // Verify asset state
    const asset = await fetchAsset(umi, mintPubkey);
    if (asset.owner.toString() !== listing.seller_wallet) {
      // Owner changed — mark listing as cancelled without on-chain ops
      await supabase
        .from("listings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", listingId);
      return NextResponse.json({ success: true });
    }

    // Build: thaw → revoke FreezeDelegate → revoke TransferDelegate
    const builder = updatePlugin(umi, {
      asset: mintPubkey,
      plugin: {
        type: "FreezeDelegate",
        frozen: false,
      },
      authority: marketplaceSigner,
    })
      .add(
        revokePluginAuthority(umi, {
          asset: mintPubkey,
          plugin: { type: "FreezeDelegate" },
          authority: marketplaceSigner,
        })
      )
      .add(
        revokePluginAuthority(umi, {
          asset: mintPubkey,
          plugin: { type: "TransferDelegate" },
          authority: marketplaceSigner,
        })
      );

    const blockhash = await umi.rpc.getLatestBlockhash({
      commitment: "finalized",
    });

    const builtTx = builder.setBlockhash(blockhash).build(umi);
    const signedTx = await marketplaceSigner.signTransaction(builtTx);

    const sig = await umi.rpc.sendTransaction(signedTx);
    await umi.rpc.confirmTransaction(sig, {
      commitment: "confirmed",
      strategy: { type: "blockhash", ...blockhash },
    });

    // Update listing status
    await supabase
      .from("listings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delist:", err);
    return NextResponse.json(
      {
        error: `Delist failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
