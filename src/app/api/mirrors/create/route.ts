import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateMirrorConfig } from "@/lib/mirrors/configValidator";
import { verifyCreationPayment } from "@/lib/mirrors/paymentVerifier";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";

const CREATION_FEE_SOL = parseFloat(
  process.env.MIRROR_CREATION_FEE_SOL ?? "0"
);

/**
 * POST /api/mirrors/create
 *
 * Publishes a new user-created mirror type.
 * Requires a valid config, creator wallet, and payment proof.
 *
 * Body: { config: MirrorTypeConfig, creatorWallet: string, paymentTxSignature: string }
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
    config: MirrorTypeConfig;
    creatorWallet: string;
    paymentTxSignature: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.config || !body.creatorWallet) {
    return NextResponse.json(
      { error: "Missing required fields: config, creatorWallet" },
      { status: 400 }
    );
  }

  // Validate config
  const validation = validateMirrorConfig(body.config);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Invalid config", details: validation.errors },
      { status: 400 }
    );
  }

  // Check ID uniqueness
  const { data: existing } = await supabase
    .from("mirror_types")
    .select("id")
    .eq("id", body.config.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: `Mirror type "${body.config.id}" already exists. Choose a different ID.` },
      { status: 409 }
    );
  }

  // Verify payment
  if (CREATION_FEE_SOL > 0) {
    if (!body.paymentTxSignature) {
      return NextResponse.json(
        { error: `Payment required: ${CREATION_FEE_SOL} SOL` },
        { status: 402 }
      );
    }

    const paymentResult = await verifyCreationPayment(
      body.paymentTxSignature,
      body.creatorWallet,
      CREATION_FEE_SOL
    );

    if (!paymentResult.valid) {
      return NextResponse.json(
        { error: `Payment verification failed: ${paymentResult.error}` },
        { status: 402 }
      );
    }
  }

  // Insert into mirror_types
  try {
    const { error } = await supabase.from("mirror_types").insert({
      id: body.config.id,
      name: body.config.name,
      tagline: body.config.tagline,
      description: body.config.description,
      config: body.config as unknown as Record<string, unknown>,
      creator_wallet: body.creatorWallet,
      creator_share_pct: 50,
      is_active: true,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      mirrorTypeId: body.config.id,
      message: `Mirror "${body.config.name}" created successfully!`,
    });
  } catch (err) {
    console.error("[api/mirrors/create] Failed:", err);
    return NextResponse.json(
      {
        error: `Failed to create mirror: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
