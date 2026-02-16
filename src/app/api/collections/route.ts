import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/collections?wallet=<address>
 * Returns all standalone minted NFTs for the given wallet.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet query param required" },
      { status: 400 }
    );
  }

  const { data: nfts, error: nftError } = await supabase
    .from("nfts")
    .select("*")
    .eq("wallet_address", wallet)
    .order("minted_at", { ascending: false });

  if (nftError) {
    console.error("Failed to fetch NFTs:", nftError);
    return NextResponse.json(
      { error: "Failed to load NFTs" },
      { status: 500 }
    );
  }

  const result = (nfts ?? []).map((n) => ({
    mint: n.mint_address,
    name: n.name,
    description: n.description || "",
    imageUrl: n.image_url,
    explorerUrl: n.explorer_url,
    mintedAt: n.minted_at,
    walletAddress: n.wallet_address,
  }));

  return NextResponse.json({ nfts: result });
}

/**
 * POST /api/collections
 * Persists a newly minted standalone NFT.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  // Auth check
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: {
    walletAddress: string;
    mint: string;
    name: string;
    description?: string;
    imageUrl: string;
    explorerUrl: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.walletAddress || !body.mint || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: walletAddress, mint, name" },
      { status: 400 }
    );
  }

  const { error: nftError } = await supabase.from("nfts").insert({
    wallet_address: body.walletAddress,
    mint_address: body.mint,
    name: body.name,
    description: body.description || "",
    image_url: body.imageUrl,
    explorer_url: body.explorerUrl,
  });

  if (nftError) {
    if (nftError.code === "23505") {
      return NextResponse.json({ error: "NFT already saved" }, { status: 409 });
    }
    console.error("Failed to insert NFT:", nftError);
    return NextResponse.json(
      { error: "Failed to save NFT" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
