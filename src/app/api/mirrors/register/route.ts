import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/mirrors/register
 *
 * Registers a newly minted mirror NFT in the active_mirrors table.
 * Called by the client after the on-chain mint transaction confirms.
 *
 * Body: { mintAddress, mirrorType, ownerWallet, frameNumber, metadataUri }
 */
export async function POST(req: NextRequest) {
  // Privy auth check
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

  let body: {
    mintAddress: string;
    mirrorType: string;
    ownerWallet: string;
    frameNumber: number;
    metadataUri: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.mintAddress ||
    !body.mirrorType ||
    !body.ownerWallet ||
    !body.metadataUri
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: mintAddress, mirrorType, ownerWallet, metadataUri",
      },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase.from("active_mirrors").insert({
      mint_address: body.mintAddress,
      mirror_type: body.mirrorType,
      owner_wallet: body.ownerWallet,
      current_frame_number: body.frameNumber ?? 0,
      current_metadata_uri: body.metadataUri,
      is_active: true,
    });

    if (error) {
      // Handle duplicate mint address
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Mirror already registered" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/mirrors/register] Failed:", err);
    return NextResponse.json(
      {
        error: `Registration failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
