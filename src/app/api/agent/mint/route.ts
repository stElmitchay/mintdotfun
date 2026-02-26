import { NextRequest, NextResponse } from "next/server";
import { CreateAgentRequestSchema } from "@/types/agent";
import { buildPersonality, hashPersonality } from "@/lib/agent/personality";
import { getAgentAuthorityPubkey } from "@/lib/agent/agentAuthority";
import { isAgentNameTaken } from "@/lib/agent/db";
import {
  uploadPersonalityToArweave,
  uploadAgentAvatarToArweave,
  uploadAgentMetadataToArweave,
} from "@/lib/agent/storage";
import { generateAgentAvatar } from "@/lib/agent/avatarGenerator";

/**
 * POST /api/agent/mint
 *
 * Server-side preparation for agent minting. Generates personality,
 * creates avatar, uploads everything to Arweave, and returns URIs
 * for the client-side Solana transaction.
 */
export async function POST(req: NextRequest) {
  // Auth
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateAgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const request = parsed.data;

  try {
    // Name uniqueness
    if (await isAgentNameTaken(request.name)) {
      return NextResponse.json(
        { error: `Agent name "${request.name}" is already taken` },
        { status: 409 }
      );
    }

    // Build personality
    const personality = await buildPersonality(request);
    const personalityHash = hashPersonality(personality);

    // Generate avatar
    const avatarImageUrl = await generateAgentAvatar(personality);

    // Upload to Arweave
    const personalityUri = await uploadPersonalityToArweave(personality);
    const avatarImageUri = await uploadAgentAvatarToArweave(
      avatarImageUrl,
      personality.name
    );
    const metadataUri = await uploadAgentMetadataToArweave({
      personality,
      personalityUri,
      personalityHash,
      avatarImageUri,
      ownerAddress: request.ownerAddress,
    });

    return NextResponse.json({
      metadataUri,
      avatarImageUri,
      personalityUri,
      personalityHash,
      agentAuthorityPubkey: getAgentAuthorityPubkey(),
      personality,
    });
  } catch (err) {
    console.error("[api/agent/mint] Failed:", err);
    return NextResponse.json(
      {
        error: `Agent mint preparation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
