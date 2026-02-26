import { createGenericFile } from "@metaplex-foundation/umi";
import {
  getMirrorAuthorityUmi,
  resetMirrorAuthorityCache,
} from "./mirrorAuthority";
import type { InterpretedScene, DataSnapshot } from "./types";

// ============================================================
// Mirror Frame Storage — Arweave uploads via Irys
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
  // Reset cache on final failure so next request re-initializes
  resetMirrorAuthorityCache();
  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

interface MirrorFrameMetadata {
  scene: InterpretedScene;
  dataSnapshot: DataSnapshot;
  previousFrameUri: string | null;
}

/**
 * Upload a mirror frame image + metadata to Arweave.
 *
 * Returns permanent Arweave URIs for both the image and metadata JSON.
 */
export async function uploadMirrorFrame(
  imageUrl: string,
  metadata: MirrorFrameMetadata,
  mirrorType: string,
  frameNumber: number,
  mirrorName: string,
  ownerWallet?: string
): Promise<{ imageUri: string; metadataUri: string }> {
  const umi = getMirrorAuthorityUmi();

  // Download image from Replicate CDN
  const resp = await fetch(imageUrl);
  if (!resp.ok)
    throw new Error(`Failed to download mirror frame image: HTTP ${resp.status}`);
  const contentType = resp.headers.get("content-type") || "image/webp";
  const imageBytes = new Uint8Array(await resp.arrayBuffer());

  // Upload image to Arweave
  const imageFile = createGenericFile(
    imageBytes,
    `${mirrorType}-frame-${frameNumber}.webp`,
    { contentType }
  );
  const [imageUri] = await withRetry(async () => {
    const uris = await umi.uploader.upload([imageFile]);
    if (!uris[0]) throw new Error("Irys returned empty URI for image upload");
    return uris;
  }, "Mirror image upload");

  // Build Metaplex-standard metadata JSON with mirror extensions
  const now = new Date().toISOString();
  const fullMetadata = {
    name: `${mirrorName} — Frame #${frameNumber}`,
    description: buildDescription(mirrorType, frameNumber, metadata, now),
    image: imageUri,
    attributes: [
      { trait_type: "Mirror Type", value: mirrorType },
      { trait_type: "Frame Number", value: String(frameNumber) },
      { trait_type: "Generation", value: "AI" },
      { trait_type: "Mood", value: metadata.scene.mood },
      {
        trait_type: "Data Signals",
        value: metadata.scene.dataSignals.join(", "),
      },
      { trait_type: "Update Cadence", value: "Daily" },
    ],
    properties: {
      category: "image",
      files: [{ uri: imageUri, type: contentType }],
      creators: ownerWallet
        ? [{ address: ownerWallet, share: 100 }]
        : [],
      mirror: {
        type: mirrorType,
        frameNumber,
        generatedAt: now,
        sceneDescription: metadata.scene.sceneDescription,
        mood: metadata.scene.mood,
        dominantColors: metadata.scene.dominantColors,
        keyElements: metadata.scene.keyElements,
        dataSignals: metadata.scene.dataSignals,
        continuityNotes: metadata.scene.continuityNotes,
        changeNotes: metadata.scene.changeNotes,
        dataSnapshot: metadata.dataSnapshot,
        previousFrameUri: metadata.previousFrameUri,
      },
    },
  };

  // Upload metadata to Arweave
  const metadataUri = await withRetry(
    () => umi.uploader.uploadJson(fullMetadata),
    "Mirror metadata upload"
  );

  return { imageUri, metadataUri };
}

function buildDescription(
  mirrorType: string,
  frameNumber: number,
  metadata: MirrorFrameMetadata,
  generatedAt: string
): string {
  const date = new Date(generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts = [`Cultural Mirror: ${mirrorType}. Frame #${frameNumber}, generated ${date}.`];

  if (metadata.dataSnapshot.weather) {
    parts.push(
      `Weather: ${metadata.dataSnapshot.weather.temp}°C ${metadata.dataSnapshot.weather.condition}.`
    );
  }

  if (metadata.scene.dataSignals.length > 0) {
    parts.push(`Signals: ${metadata.scene.dataSignals.join(", ")}.`);
  }

  if (metadata.dataSnapshot.onChain) {
    const change =
      metadata.dataSnapshot.onChain.sol24hChange >= 0 ? "+" : "";
    parts.push(
      `SOL: $${metadata.dataSnapshot.onChain.solPrice.toFixed(0)} (${change}${metadata.dataSnapshot.onChain.sol24hChange.toFixed(1)}%).`
    );
  }

  return parts.join(" ");
}
