import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/collections?wallet=<address>
 * Returns all collections + their NFTs for the given wallet.
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

  const { data: collections, error: colError } = await supabase
    .from("collections")
    .select("*")
    .eq("wallet_address", wallet)
    .order("minted_at", { ascending: false });

  if (colError) {
    console.error("Failed to fetch collections:", colError);
    return NextResponse.json(
      { error: "Failed to load collections" },
      { status: 500 }
    );
  }

  if (!collections || collections.length === 0) {
    return NextResponse.json({ collections: [] });
  }

  // Fetch NFTs for all collections in one query
  const collectionIds = collections.map((c) => c.id);
  const { data: nfts, error: nftError } = await supabase
    .from("nfts")
    .select("*")
    .in("collection_id", collectionIds)
    .order("minted_at", { ascending: true });

  if (nftError) {
    console.error("Failed to fetch NFTs:", nftError);
    return NextResponse.json(
      { error: "Failed to load NFTs" },
      { status: 500 }
    );
  }

  // Group NFTs by collection
  const nftsByCollection = new Map<string, typeof nfts>();
  for (const nft of nfts ?? []) {
    const list = nftsByCollection.get(nft.collection_id) ?? [];
    list.push(nft);
    nftsByCollection.set(nft.collection_id, list);
  }

  const result = collections.map((col) => ({
    id: col.id,
    config: {
      name: col.name,
      symbol: col.symbol,
      description: col.description,
      sellerFeeBasisPoints: col.royalty_bps,
    },
    collectionAddress: col.collection_address,
    walletAddress: col.wallet_address,
    mintedAt: col.minted_at,
    nfts: (nftsByCollection.get(col.id) ?? []).map((n) => ({
      mint: n.mint_address,
      name: n.name,
      imageUrl: n.image_url,
      explorerUrl: n.explorer_url,
    })),
  }));

  return NextResponse.json({ collections: result });
}

/**
 * POST /api/collections
 * Persists a newly minted collection and its NFTs.
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
    collectionAddress: string;
    config: {
      name: string;
      symbol: string;
      description?: string;
      sellerFeeBasisPoints?: number;
    };
    nfts: {
      mint: string;
      name: string;
      imageUrl: string;
      explorerUrl: string;
    }[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.walletAddress || !body.collectionAddress || !body.config?.name || !body.config?.symbol) {
    return NextResponse.json(
      { error: "Missing required fields: walletAddress, collectionAddress, config.name, config.symbol" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.nfts) || body.nfts.length === 0) {
    return NextResponse.json(
      { error: "At least one NFT is required" },
      { status: 400 }
    );
  }

  // Insert collection
  const { data: collection, error: colError } = await supabase
    .from("collections")
    .insert({
      wallet_address: body.walletAddress,
      collection_address: body.collectionAddress,
      name: body.config.name,
      symbol: body.config.symbol,
      description: body.config.description || "",
      royalty_bps: body.config.sellerFeeBasisPoints || 500,
    })
    .select("id")
    .single();

  if (colError) {
    // Duplicate collection address — already saved
    if (colError.code === "23505") {
      return NextResponse.json({ error: "Collection already saved" }, { status: 409 });
    }
    console.error("Failed to insert collection:", colError);
    return NextResponse.json(
      { error: "Failed to save collection" },
      { status: 500 }
    );
  }

  // Insert NFTs
  const nftRows = body.nfts.map((nft) => ({
    collection_id: collection.id,
    mint_address: nft.mint,
    name: nft.name,
    image_url: nft.imageUrl,
    explorer_url: nft.explorerUrl,
  }));

  const { error: nftError } = await supabase.from("nfts").insert(nftRows);

  if (nftError) {
    console.error("Failed to insert NFTs:", nftError);
    // Collection was created but NFTs failed — not ideal but recoverable
    return NextResponse.json(
      { error: "Collection saved but some NFTs failed to persist" },
      { status: 207 }
    );
  }

  return NextResponse.json({ id: collection.id }, { status: 201 });
}
