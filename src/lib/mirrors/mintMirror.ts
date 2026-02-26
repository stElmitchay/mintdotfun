import type { Umi } from "@metaplex-foundation/umi";
import {
  generateSigner,
  signAllTransactions,
  none,
  publicKey as toPublicKey,
} from "@metaplex-foundation/umi";
import { createV2 } from "@metaplex-foundation/mpl-core";
import { getCoreAssetUrl } from "@/lib/utils";
import type { MirrorMintStatus } from "./types";

// ============================================================
// Client-side Mirror Minting
// ============================================================

interface MirrorMintProgress {
  phase: MirrorMintStatus;
  message: string;
}

export interface MirrorMintResult {
  mint: string;
  name: string;
  imageUrl: string;
  explorerUrl: string;
  mirrorType: string;
  frameNumber: number;
}

/**
 * Mints a Cultural Mirror NFT.
 *
 * Key difference from regular mintSingleNFT:
 * - updateAuthority is set to the mirror authority keypair (not the user's wallet)
 * - This allows the server to update metadata on cron without user involvement
 * - User still OWNS the NFT, they just don't control the metadata
 *
 * Flow:
 * 1. Call /api/mirrors/mint for server-side Arweave upload + authority pubkey
 * 2. Build createV2 with updateAuthority = mirrorAuthorityPubkey
 * 3. Sign one transaction (single wallet popup)
 * 4. Call /api/mirrors/register to add to active_mirrors table
 */
export async function mintMirrorNFT(
  umi: Umi,
  mirrorType: string,
  onProgress?: (progress: MirrorMintProgress) => void
): Promise<MirrorMintResult> {
  const ownerAddress = umi.identity.publicKey.toString();

  // 1. Server-side preparation (Arweave upload + get authority pubkey)
  onProgress?.({ phase: "preparing", message: "Preparing your mirror..." });

  const mintRes = await fetch("/api/mirrors/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mirrorType, ownerAddress }),
  });

  if (!mintRes.ok) {
    const data = await mintRes
      .json()
      .catch(() => ({ error: `HTTP ${mintRes.status}` }));
    throw new Error(data.error || "Failed to prepare mirror mint");
  }

  const { metadataUri, imageUri, mirrorAuthorityPubkey, name, frameNumber } =
    await mintRes.json();

  // 2. Build the on-chain transaction
  onProgress?.({
    phase: "minting",
    message: "Approve transaction in your wallet...",
  });

  const assetSigner = generateSigner(umi);

  // createV2 with updateAuthority set to mirror authority (the critical difference)
  const builder = createV2(umi, {
    asset: assetSigner,
    owner: umi.identity.publicKey,
    updateAuthority: toPublicKey(mirrorAuthorityPubkey),
    name,
    uri: metadataUri,
    plugins: none(),
    externalPluginAdapters: none(),
  });

  // 3. Sign with finalized blockhash (same proven pattern as mintSingleNFT)
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

  onProgress?.({ phase: "minting", message: "Minting on Solana..." });

  try {
    const sig = await umi.rpc.sendTransaction(signedTx);
    await umi.rpc.confirmTransaction(sig, {
      commitment: "confirmed",
      strategy: { type: "blockhash", ...blockhash },
    });
  } catch (err) {
    throw new Error(
      `Minting failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 4. Register the mint in Supabase
  onProgress?.({
    phase: "registering",
    message: "Registering your mirror...",
  });

  await fetch("/api/mirrors/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mintAddress: assetSigner.publicKey.toString(),
      mirrorType,
      ownerWallet: ownerAddress,
      frameNumber,
      metadataUri,
    }),
  });

  onProgress?.({ phase: "complete", message: "Mirror minted!" });

  return {
    mint: assetSigner.publicKey.toString(),
    name,
    imageUrl: imageUri,
    explorerUrl: getCoreAssetUrl(assetSigner.publicKey.toString()),
    mirrorType,
    frameNumber,
  };
}
