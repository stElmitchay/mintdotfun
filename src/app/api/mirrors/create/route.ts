import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateMirrorConfig } from "@/lib/mirrors/configValidator";
import { verifyCreationPayment } from "@/lib/mirrors/paymentVerifier";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";
import { requireAuthorizedWallet, requirePrivyAuth } from "@/lib/auth/privy";
import { getLatestFrame } from "@/lib/mirrors/db";
import { updateMirrorTypeWithLock } from "@/lib/mirrors/updater";

const CREATION_FEE_SOL = parseFloat(
  process.env.MIRROR_CREATION_FEE_SOL ?? "0"
);
const GENERATE_FIRST_FRAME_ON_CREATE =
  process.env.MIRROR_GENERATE_FIRST_FRAME_ON_CREATE !== "false";

// Allow first-frame generation to complete in this request.
export const maxDuration = 120;

/**
 * POST /api/mirrors/create
 *
 * Publishes a new user-created mirror type.
 * Requires a valid config, creator wallet, and payment proof.
 *
 * Body: { config: MirrorTypeConfig, creatorWallet: string, paymentTxSignature: string }
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

  // Privy access tokens may not always include linked wallet addresses in claims.
  // Enforce wallet ownership only when wallet claims are present.
  if (auth.wallets.size > 0) {
    const walletAuthError = requireAuthorizedWallet(
      auth,
      body.creatorWallet,
      "creatorWallet"
    );
    if (walletAuthError) return walletAuthError;
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

    let firstFrameTriggered = false;
    let firstFrameGenerated = false;
    let firstFrameError: string | null = null;

    if (GENERATE_FIRST_FRAME_ON_CREATE) {
      firstFrameTriggered = true;
      try {
        const existingFrame = await getLatestFrame(body.config.id);
        if (!existingFrame) {
          await updateMirrorTypeWithLock(body.config.id);
          firstFrameGenerated = true;
        } else {
          firstFrameGenerated = true;
        }
      } catch (frameErr) {
        firstFrameError =
          frameErr instanceof Error ? frameErr.message : String(frameErr);
        console.error(
          `[api/mirrors/create] First-frame generation failed for ${body.config.id}:`,
          frameErr
        );
      }
    }

    return NextResponse.json({
      success: true,
      mirrorTypeId: body.config.id,
      message: `Mirror "${body.config.name}" created successfully!`,
      firstFrame: {
        triggered: firstFrameTriggered,
        generated: firstFrameGenerated,
        error: firstFrameError,
      },
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
