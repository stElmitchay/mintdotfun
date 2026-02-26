import type { Umi } from "@metaplex-foundation/umi";
import {
  generateSigner,
  signAllTransactions,
  some,
  none,
  publicKey as toPublicKey,
} from "@metaplex-foundation/umi";
import { createV2, pluginAuthorityPairV2 } from "@metaplex-foundation/mpl-core";
import type { AgentArchetype, AgentMintResult } from "@/types/agent";

// ============================================================
// Client-side Agent NFT Minting
// ============================================================

export interface AgentMintProgress {
  phase:
    | "preparing"
    | "generating"
    | "uploading"
    | "minting"
    | "registering"
    | "complete";
  message: string;
}

/**
 * Mints an Agent NFT.
 *
 * Key differences from regular mintSingleNFT and mintMirrorNFT:
 * - Uses Attribute plugin with agent-specific on-chain data
 * - updateAuthority set to the agent authority keypair (for server state updates)
 * - After on-chain mint, registers agent in Supabase with full personality
 *
 * Flow:
 * 1. Call /api/agent/mint for server-side personality gen + Arweave uploads
 * 2. Build createV2 with Attribute plugin + updateAuthority
 * 3. Sign one transaction (single wallet popup)
 * 4. Call /api/agent/register to create Supabase record
 */
export async function mintAgentNFT(
  umi: Umi,
  name: string,
  archetype: AgentArchetype,
  customization: {
    complexity?: number;
    abstraction?: number;
    darkness?: number;
    temperature?: number;
  },
  onProgress?: (progress: AgentMintProgress) => void
): Promise<AgentMintResult> {
  const ownerAddress = umi.identity.publicKey.toString();

  // 1. Server-side preparation
  onProgress?.({
    phase: "preparing",
    message: "Creating agent personality...",
  });

  const mintRes = await fetch("/api/agent/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      archetype,
      ...customization,
      ownerAddress,
    }),
  });

  if (!mintRes.ok) {
    const data = await mintRes
      .json()
      .catch(() => ({ error: `HTTP ${mintRes.status}` }));
    throw new Error(data.error || "Failed to prepare agent mint");
  }

  const {
    metadataUri,
    avatarImageUri,
    personalityUri,
    personalityHash,
    agentAuthorityPubkey,
    personality,
  } = await mintRes.json();

  // 2. Build on-chain transaction with Attribute plugin
  onProgress?.({
    phase: "minting",
    message: "Approve transaction in your wallet...",
  });

  const assetSigner = generateSigner(umi);

  // some([{ type: "Attribute", ... }]) is safe — the serialization bug
  // only affects empty arrays. Non-empty Attribute plugin arrays work correctly.
  const builder = createV2(umi, {
    asset: assetSigner,
    owner: umi.identity.publicKey,
    updateAuthority: toPublicKey(agentAuthorityPubkey),
    name: personality.name,
    uri: metadataUri,
    plugins: some([
      pluginAuthorityPairV2({
        type: "Attributes",
        attributeList: [
          { key: "agent_version", value: "2.0" },
          { key: "archetype", value: personality.archetype },
          { key: "level", value: "1" },
          { key: "reputation", value: "0" },
          { key: "total_creations", value: "0" },
          { key: "personality_hash", value: personalityHash },
          { key: "is_agent", value: "true" },
        ],
      }),
    ]),
    externalPluginAdapters: none(),
  });

  // 3. Sign with finalized blockhash
  const blockhash = await umi.rpc.getLatestBlockhash({
    commitment: "finalized",
  });
  const builtTx = builder.setBlockhash(blockhash).build(umi);

  let signedTxs;
  try {
    signedTxs = await signAllTransactions([
      {
        transaction: builtTx,
        signers: builder.getSigners(umi),
      },
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("User rejected") || message.includes("denied")) {
      throw new Error(
        "Transaction was rejected. Please approve the transaction in your wallet."
      );
    }
    throw new Error(`Transaction signing failed: ${message}`);
  }
  const signedTx = signedTxs[0];

  onProgress?.({ phase: "minting", message: "Minting agent on Solana..." });

  try {
    const sig = await umi.rpc.sendTransaction(signedTx);
    await umi.rpc.confirmTransaction(sig, {
      commitment: "confirmed",
      strategy: { type: "blockhash", ...blockhash },
    });
  } catch (err) {
    throw new Error(
      `Agent minting failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 4. Register in Supabase
  onProgress?.({
    phase: "registering",
    message: "Registering your agent...",
  });

  await fetch("/api/agent/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mintAddress: assetSigner.publicKey.toString(),
      ownerWallet: ownerAddress,
      personality,
      personalityHash,
      personalityArweaveUri: personalityUri,
      avatarUrl: avatarImageUri,
    }),
  });

  onProgress?.({ phase: "complete", message: "Agent born!" });

  return {
    mintAddress: assetSigner.publicKey.toString(),
    name: personality.name,
    archetype: personality.archetype,
    avatarUrl: avatarImageUri,
    personalityUri,
    metadataUri,
    agentAuthorityPubkey,
  };
}
