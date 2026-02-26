import { NextRequest, NextResponse } from "next/server";
import { getMirrorConfig } from "@/lib/mirrors/config";
import { getMirrorAuthorityPubkey } from "@/lib/mirrors/mirrorAuthority";
import { getLatestFrame, getMirrorHoldersCount } from "@/lib/mirrors/db";
import { uploadMirrorFrame } from "@/lib/mirrors/storage";

/**
 * POST /api/mirrors/mint
 *
 * Server-side preparation for minting a mirror NFT.
 * Uploads the genesis frame metadata to Arweave and returns
 * the metadata URI + mirror authority pubkey for the client transaction.
 *
 * Body: { mirrorType, ownerAddress }
 * Response: { metadataUri, imageUri, mirrorAuthorityPubkey, name, frameNumber }
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

  let body: { mirrorType: string; ownerAddress: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.mirrorType || !body.ownerAddress) {
    return NextResponse.json(
      { error: "Missing required fields: mirrorType, ownerAddress" },
      { status: 400 }
    );
  }

  // Validate mirror type
  let config;
  try {
    config = await getMirrorConfig(body.mirrorType);
  } catch {
    return NextResponse.json(
      { error: `Unknown mirror type: ${body.mirrorType}` },
      { status: 400 }
    );
  }

  try {
    // Check supply limits
    const currentCount = await getMirrorHoldersCount(body.mirrorType);
    if (config.maxSupply && currentCount >= config.maxSupply) {
      return NextResponse.json(
        { error: `${config.name} is sold out (${config.maxSupply}/${config.maxSupply})` },
        { status: 409 }
      );
    }

    // Get the current frame (the mint will reference this frame)
    const currentFrame = await getLatestFrame(body.mirrorType);

    if (!currentFrame) {
      return NextResponse.json(
        {
          error:
            "This mirror type has no frames yet. An initial update must run before minting is available.",
        },
        { status: 503 }
      );
    }

    // Mint number for naming
    const mintNumber = currentCount + 1;
    const name = `${config.name} #${mintNumber}`;

    // Upload mint-specific metadata to Arweave
    // (Each individual NFT gets its own metadata pointing to the shared frame image)
    const { imageUri, metadataUri } = await uploadMirrorFrame(
      currentFrame.imageUri,
      {
        scene: {
          sceneDescription: currentFrame.sceneDescription,
          imagePrompt: "",
          mood: currentFrame.mood,
          dominantColors: currentFrame.dominantColors,
          keyElements: currentFrame.keyElements,
          dataSignals: currentFrame.dataSignals,
          continuityNotes: "",
          changeNotes: "",
        },
        dataSnapshot: currentFrame.dataSnapshot,
        previousFrameUri: null,
      },
      body.mirrorType,
      currentFrame.frameNumber,
      config.name,
      body.ownerAddress
    );

    return NextResponse.json({
      metadataUri,
      imageUri,
      mirrorAuthorityPubkey: getMirrorAuthorityPubkey(),
      name,
      frameNumber: currentFrame.frameNumber,
      mintNumber,
      priceSol: config.mintPriceSol,
    });
  } catch (err) {
    console.error("[api/mirrors/mint] Failed:", err);
    return NextResponse.json(
      {
        error: `Mint preparation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
