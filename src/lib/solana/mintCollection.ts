import type { Umi } from "@metaplex-foundation/umi";
import { generateSigner, createGenericFile } from "@metaplex-foundation/umi";
import { createCollection, createV1 } from "@metaplex-foundation/mpl-core";
import type { CollectionConfig, MintedNFT } from "@/types";
import { getCoreAssetUrl } from "@/lib/utils";

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
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

interface MintImage {
  url: string;
  prompt: string;
}

interface MintProgress {
  phase: "uploading" | "collection" | "minting";
  current: number;
  total: number;
  message: string;
}

export interface MintResult {
  collection: string;
  minted: MintedNFT[];
  /** If set, minting stopped early due to this error. `minted` still contains any NFTs that succeeded. */
  error?: string;
}

/**
 * Mints a collection of NFTs using Metaplex Core with Arweave storage.
 *
 * Flow:
 * 1. Upload each image to Arweave via Irys → permanent image URLs
 * 2. Upload metadata JSON for each NFT to Arweave → permanent metadata URIs
 * 3. Create collection on-chain with Arweave metadata
 * 4. Mint each NFT with permanent Arweave metadata URIs
 *
 * Always returns a result — even on partial failure.
 */
export async function mintNFTCollection(
  umi: Umi,
  config: CollectionConfig,
  images: MintImage[],
  onProgress?: (progress: MintProgress) => void
): Promise<MintResult> {
  // --- Upfront validation ---
  if (!config.name?.trim()) {
    throw new Error("Collection name is required");
  }
  if (!config.symbol?.trim()) {
    throw new Error("Collection symbol is required");
  }
  if (images.length === 0) {
    throw new Error("At least one image is required");
  }
  if (images.some((img) => !img.url)) {
    throw new Error("All images must have a valid URL");
  }

  const creatorAddress = umi.identity.publicKey.toString();

  // --- Upload phase: images + metadata to Arweave ---
  const arweaveImageUrls: string[] = [];
  const arweaveMetadataUris: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const nftName = `${config.name} #${i + 1}`;

    onProgress?.({
      phase: "uploading",
      current: i + 1,
      total: images.length,
      message: `Uploading ${nftName} to Arweave (${i + 1}/${images.length})...`,
    });

    // Fetch image bytes
    let imageBytes: Uint8Array;
    let contentType = "image/webp";
    try {
      const resp = await fetch(image.url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      contentType = resp.headers.get("content-type") || "image/webp";
      imageBytes = new Uint8Array(await resp.arrayBuffer());
    } catch (err) {
      throw new Error(
        `Failed to download image for ${nftName}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Upload image to Arweave (with retry for transient failures)
    let imageUri: string;
    try {
      const file = createGenericFile(imageBytes, `${config.symbol}-${i + 1}.webp`, {
        contentType,
      });
      const [uri] = await withRetry(
        () => umi.uploader.upload([file]),
        `Image upload for ${nftName}`
      );
      imageUri = uri;
    } catch (err) {
      throw new Error(
        `Failed to upload image for ${nftName} to Arweave: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    arweaveImageUrls.push(imageUri);

    // Build and upload metadata JSON to Arweave
    const nftMetadata = {
      name: nftName,
      symbol: config.symbol,
      description: config.description
        ? `${config.description}\n\nGenerated with AI`
        : "Generated with AI",
      image: imageUri,
      attributes: [
        { trait_type: "Generation", value: "AI" },
        { trait_type: "Collection", value: config.name },
        { trait_type: "Piece", value: `${i + 1}` },
      ],
      properties: {
        category: "image",
        files: [{ uri: imageUri, type: contentType }],
        creators: [{ address: creatorAddress, share: 100 }],
      },
    };

    try {
      const metadataUri = await withRetry(
        () => umi.uploader.uploadJson(nftMetadata),
        `Metadata upload for ${nftName}`
      );
      arweaveMetadataUris.push(metadataUri);
    } catch (err) {
      throw new Error(
        `Failed to upload metadata for ${nftName} to Arweave: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // --- Create collection on-chain ---
  onProgress?.({
    phase: "collection",
    current: 0,
    total: images.length,
    message: "Creating collection on-chain...",
  });

  // Upload collection metadata to Arweave
  const collectionMetadata = {
    name: config.name,
    symbol: config.symbol,
    description: config.description || "",
    image: arweaveImageUrls[0],
    external_url: "",
    properties: {
      category: "image",
      creators: [{ address: creatorAddress, share: 100 }],
    },
  };

  let collectionMetadataUri: string;
  try {
    collectionMetadataUri = await withRetry(
      () => umi.uploader.uploadJson(collectionMetadata),
      "Collection metadata upload"
    );
  } catch (err) {
    throw new Error(
      `Failed to upload collection metadata to Arweave: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const collectionSigner = generateSigner(umi);

  try {
    await createCollection(umi, {
      collection: collectionSigner,
      name: config.name,
      uri: collectionMetadataUri,
    }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  } catch (err) {
    throw new Error(
      `Failed to create collection: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const collectionAddress = collectionSigner.publicKey.toString();

  // --- Mint individual NFTs ---
  const minted: MintedNFT[] = [];

  for (let i = 0; i < images.length; i++) {
    const nftName = `${config.name} #${i + 1}`;

    onProgress?.({
      phase: "minting",
      current: i + 1,
      total: images.length,
      message: `Minting ${nftName} (${i + 1}/${images.length})...`,
    });

    const assetSigner = generateSigner(umi);

    try {
      await createV1(umi, {
        asset: assetSigner,
        collection: collectionSigner.publicKey,
        owner: umi.identity.publicKey,
        name: nftName,
        uri: arweaveMetadataUris[i],
      }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        collection: collectionAddress,
        minted,
        error: `Failed to mint ${nftName}: ${message}. ${minted.length} of ${images.length} NFTs minted successfully.`,
      };
    }

    minted.push({
      mint: assetSigner.publicKey.toString(),
      name: nftName,
      imageUrl: arweaveImageUrls[i],
      explorerUrl: getCoreAssetUrl(assetSigner.publicKey.toString()),
    });
  }

  return { collection: collectionAddress, minted };
}
