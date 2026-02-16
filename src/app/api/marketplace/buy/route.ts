import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getMarketplaceUmi,
  getMarketplaceSigner,
} from "@/lib/solana/marketplace";
import {
  publicKey as toPublicKey,
  createNoopSigner,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  fetchAsset,
  transfer,
  updatePlugin,
} from "@metaplex-foundation/mpl-core";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { sol } from "@metaplex-foundation/umi";

/**
 * POST /api/marketplace/buy
 *
 * Builds a partially-signed transaction for purchasing a listed NFT.
 * The marketplace authority signs (thaw + transfer delegate), but the
 * buyer's SOL transfer signature slot is left empty for client-side signing.
 *
 * Body: { listingId, buyerWallet }
 * Response: { transaction: base64, blockhash }
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

  let body: { listingId: string; buyerWallet: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listingId, buyerWallet } = body;
  if (!listingId || !buyerWallet) {
    return NextResponse.json(
      { error: "Missing listingId or buyerWallet" },
      { status: 400 }
    );
  }

  // 1. Fetch listing
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

  if (listing.seller_wallet === buyerWallet) {
    return NextResponse.json(
      { error: "Cannot buy your own listing" },
      { status: 400 }
    );
  }

  try {
    const umi = getMarketplaceUmi();
    const marketplaceSigner = getMarketplaceSigner();
    const mintPubkey = toPublicKey(listing.nft_mint_address);
    const sellerPubkey = toPublicKey(listing.seller_wallet);
    const buyerPubkey = toPublicKey(buyerWallet);

    // 2. Fetch asset on-chain and verify state
    const asset = await fetchAsset(umi, mintPubkey);

    if (asset.owner.toString() !== listing.seller_wallet) {
      return NextResponse.json(
        { error: "NFT owner mismatch — listing may be stale" },
        { status: 409 }
      );
    }

    // 3. Build atomic transaction: thaw + SOL transfer + NFT transfer
    const buyerNoopSigner = createNoopSigner(buyerPubkey);
    const priceSol = Number(listing.price_lamports) / 1e9;

    const builder = transactionBuilder()
      .add(
        updatePlugin(umi, {
          asset: mintPubkey,
          plugin: {
            type: "FreezeDelegate",
            frozen: false,
          },
          authority: marketplaceSigner,
        })
      )
      .add(
        transferSol(umi, {
          source: buyerNoopSigner,
          destination: sellerPubkey,
          amount: sol(priceSol),
        })
      )
      .add(
        transfer(umi, {
          asset: mintPubkey,
          newOwner: buyerPubkey,
          authority: marketplaceSigner,
        })
      );

    // 4. Build with finalized blockhash
    const blockhash = await umi.rpc.getLatestBlockhash({
      commitment: "finalized",
    });

    const builtTx = builder.setBlockhash(blockhash).build(umi);

    // 5. Sign with marketplace keypair only
    const signedTx = await marketplaceSigner.signTransaction(builtTx);

    // 6. Serialize and return as base64
    const serializedBytes = umi.transactions.serialize(signedTx);

    return NextResponse.json({
      transaction: Buffer.from(serializedBytes).toString("base64"),
      blockhash,
    });
  } catch (err) {
    console.error("Failed to build buy transaction:", err);
    return NextResponse.json(
      {
        error: `Failed to build transaction: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
