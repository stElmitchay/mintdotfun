import type { Umi } from "@metaplex-foundation/umi";
import {
  generateSigner,
  signAllTransactions,
  none,
} from "@metaplex-foundation/umi";
import { createV2 } from "@metaplex-foundation/mpl-core";
import type { NFTConfig } from "@/types";
import { getCoreAssetUrl } from "@/lib/utils";

interface MintProgress {
  phase: "uploading" | "minting";
  message: string;
}

export interface MintResult {
  mint: string;
  name: string;
  imageUrl: string;
  explorerUrl: string;
}

/**
 * Mints a single standalone 1-of-1 NFT using Metaplex Core.
 *
 * Flow:
 * 1. Upload image + metadata to Arweave via server API (no wallet popups)
 * 2. Build a single createV2 instruction (no collection, none() plugins)
 * 3. Sign one transaction, send, confirm — ONE wallet approval total
 */
export async function mintSingleNFT(
  umi: Umi,
  config: NFTConfig,
  imageUrl: string,
  onProgress?: (progress: MintProgress) => void
): Promise<MintResult> {
  if (!config.name?.trim()) {
    throw new Error("NFT name is required");
  }
  if (!imageUrl) {
    throw new Error("Image URL is required");
  }

  const creatorAddress = umi.identity.publicKey.toString();

  // --- Upload image + metadata to Arweave (server-side, no wallet popups) ---
  onProgress?.({
    phase: "uploading",
    message: "Uploading to Arweave...",
  });

  const uploadRes = await fetch("/api/upload-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl,
      name: config.name,
      description: config.description,
      creatorAddress,
    }),
  });

  if (!uploadRes.ok) {
    const data = await uploadRes
      .json()
      .catch(() => ({ error: `HTTP ${uploadRes.status}` }));
    throw new Error(data.error || "Failed to upload to Arweave");
  }

  const { imageUri: arweaveImageUri, metadataUri } = await uploadRes.json();

  // --- Build and send Solana transaction (single wallet approval) ---
  onProgress?.({
    phase: "minting",
    message: "Approve transaction in your wallet...",
  });

  const assetSigner = generateSigner(umi);

  // Use createV2 with explicit none() for plugins to avoid the SDK bug
  // where empty [] serializes as Some([]) causing on-chain panic.
  const builder = createV2(umi, {
    asset: assetSigner,
    owner: umi.identity.publicKey,
    name: config.name,
    uri: metadataUri,
    plugins: none(),
    externalPluginAdapters: none(),
  });

  // Use 'finalized' commitment for the blockhash so every RPC node
  // recognises it (avoids "Blockhash not found" on devnet).
  const blockhash = await umi.rpc.getLatestBlockhash({
    commitment: "finalized",
  });
  const builtTx = builder.setBlockhash(blockhash).build(umi);

  // signAllTransactions signs with ALL required signers (identity wallet +
  // generated asset keypair).
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

  onProgress?.({
    phase: "minting",
    message: "Minting on Solana...",
  });

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

  return {
    mint: assetSigner.publicKey.toString(),
    name: config.name,
    imageUrl: arweaveImageUri,
    explorerUrl: getCoreAssetUrl(assetSigner.publicKey.toString()),
  };
}
