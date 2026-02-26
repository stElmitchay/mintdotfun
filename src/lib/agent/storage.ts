import { createGenericFile } from "@metaplex-foundation/umi";
import {
  getAgentAuthorityUmi,
  resetAgentAuthorityCache,
} from "./agentAuthority";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Agent Arweave Storage — uploads via Irys
// ============================================================

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }
  resetAgentAuthorityCache();
  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

/** Upload the full personality JSON to Arweave. Returns Arweave URI. */
export async function uploadPersonalityToArweave(
  personality: AgentPersonality
): Promise<string> {
  const umi = getAgentAuthorityUmi();
  return withRetry(
    () => umi.uploader.uploadJson(personality),
    "Personality upload"
  );
}

/** Upload an agent avatar image to Arweave. Returns Arweave URI. */
export async function uploadAgentAvatarToArweave(
  imageUrl: string,
  agentName: string
): Promise<string> {
  const umi = getAgentAuthorityUmi();

  const resp = await fetch(imageUrl);
  if (!resp.ok)
    throw new Error(`Failed to download avatar image: HTTP ${resp.status}`);
  const contentType = resp.headers.get("content-type") || "image/webp";
  const imageBytes = new Uint8Array(await resp.arrayBuffer());

  const imageFile = createGenericFile(
    imageBytes,
    `agent-${agentName}-avatar.webp`,
    { contentType }
  );

  const [imageUri] = await withRetry(async () => {
    const uris = await umi.uploader.upload([imageFile]);
    if (!uris[0]) throw new Error("Irys returned empty URI for avatar upload");
    return uris;
  }, "Agent avatar upload");

  return imageUri;
}

/** Upload full Metaplex-standard metadata JSON to Arweave. Returns Arweave URI. */
export async function uploadAgentMetadataToArweave(params: {
  personality: AgentPersonality;
  personalityUri: string;
  personalityHash: string;
  avatarImageUri: string;
  ownerAddress: string;
}): Promise<string> {
  const umi = getAgentAuthorityUmi();

  const metadata = {
    name: params.personality.name,
    description: `${params.personality.bio}\n\nLevel ${params.personality.evolution.level} ${params.personality.archetype} agent.`,
    image: params.avatarImageUri,
    external_url: `https://mintit.app/agent/MINT_ADDRESS`,
    attributes: [
      { trait_type: "Type", value: "Agent" },
      { trait_type: "Archetype", value: params.personality.archetype },
      { trait_type: "Level", value: params.personality.evolution.level },
      { trait_type: "Reputation", value: params.personality.evolution.reputationScore },
      { trait_type: "Total Creations", value: params.personality.evolution.totalCreations },
      { trait_type: "Primary Mood", value: params.personality.aesthetics.mood.primary },
      {
        trait_type: "Primary Medium",
        value: params.personality.influences.mediums[0] || "mixed",
      },
    ],
    properties: {
      category: "agent",
      files: [{ uri: params.avatarImageUri, type: "image/webp" }],
      creators: [{ address: params.ownerAddress, share: 100 }],
      agent: {
        personalityUri: params.personalityUri,
        personalityHash: params.personalityHash,
        evolutionHistory: params.personalityUri,
      },
    },
  };

  return withRetry(
    () => umi.uploader.uploadJson(metadata),
    "Agent metadata upload"
  );
}
