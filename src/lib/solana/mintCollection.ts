import type { Umi } from "@metaplex-foundation/umi";
import { generateSigner } from "@metaplex-foundation/umi";
import { createCollection, createV1 } from "@metaplex-foundation/mpl-core";
import type { CollectionConfig, MintedNFT } from "@/types";
import { getExplorerUrl } from "@/lib/utils";

interface MintImage {
  url: string;
  prompt: string;
}

interface MintProgress {
  phase: "collection" | "minting";
  current: number;
  total: number;
  message: string;
}

/**
 * Mints a collection of NFTs using Metaplex Core.
 * Uses the Umi identity (user's Privy wallet) as the payer and authority.
 *
 * Flow:
 * 1. createCollection — creates an on-chain collection account
 * 2. createV1 — mints each NFT into the collection
 *
 * We use `createV1` instead of the high-level `create` wrapper because
 * `create` always delegates to the on-chain `CreateV2` instruction.
 * In mpl-core v1.7.0, `create` serializes empty plugin arrays as
 * `Some([])` instead of `None`, which causes the on-chain program to
 * panic when processing non-existent external plugin adapter accounts.
 * `createV1` sends the `CreateV1` instruction (discriminator 0) which
 * has no external plugin adapter field and handles this correctly.
 */
export async function mintNFTCollection(
  umi: Umi,
  config: CollectionConfig,
  images: MintImage[],
  onProgress?: (progress: MintProgress) => void
): Promise<{ collection: string; minted: MintedNFT[] }> {
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

  // Build collection metadata (data URI for devnet MVP)
  const collectionMetadata = {
    name: config.name,
    symbol: config.symbol,
    description: config.description || "",
    image: images[0].url,
    external_url: "",
    properties: {
      category: "image",
      creators: [{ address: creatorAddress, share: 100 }],
    },
  };

  const collectionMetadataUri = toDataUri(collectionMetadata);

  // --- Create collection on-chain ---
  onProgress?.({
    phase: "collection",
    current: 0,
    total: images.length,
    message: "Creating collection on-chain...",
  });

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

  // --- Mint individual NFTs ---
  const minted: MintedNFT[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const nftName = `${config.name} #${i + 1}`;

    onProgress?.({
      phase: "minting",
      current: i + 1,
      total: images.length,
      message: `Minting ${nftName} (${i + 1}/${images.length})...`,
    });

    const nftMetadata = {
      name: nftName,
      symbol: config.symbol,
      description: config.description
        ? `${config.description}\n\nGenerated with AI`
        : "Generated with AI",
      image: image.url,
      attributes: [
        { trait_type: "Generation", value: "AI" },
        { trait_type: "Collection", value: config.name },
        { trait_type: "Piece", value: `${i + 1}` },
      ],
      properties: {
        category: "image",
        files: [{ uri: image.url, type: "image/webp" }],
        creators: [{ address: creatorAddress, share: 100 }],
      },
    };

    const nftMetadataUri = toDataUri(nftMetadata);
    const assetSigner = generateSigner(umi);

    try {
      // Use createV1 directly — takes collection as PublicKey, sends
      // CreateV1 instruction (discriminator 0), no external plugin fields.
      await createV1(umi, {
        asset: assetSigner,
        collection: collectionSigner.publicKey,
        name: nftName,
        uri: nftMetadataUri,
      }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
    } catch (err) {
      throw new Error(
        `Failed to mint ${nftName}: ${err instanceof Error ? err.message : String(err)}. ` +
          `${minted.length} of ${images.length} NFTs were minted before this error.`
      );
    }

    minted.push({
      mint: assetSigner.publicKey.toString(),
      name: nftName,
      imageUrl: image.url,
      explorerUrl: getExplorerUrl(assetSigner.publicKey.toString()),
    });
  }

  return {
    collection: collectionSigner.publicKey.toString(),
    minted,
  };
}

function toDataUri(metadata: object): string {
  return `data:application/json;base64,${btoa(
    unescape(encodeURIComponent(JSON.stringify(metadata)))
  )}`;
}
