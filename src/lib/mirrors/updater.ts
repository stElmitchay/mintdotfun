import { getMirrorConfig } from "./config";
import { fetchMirrorData } from "./dataFeeds";
import { interpretData } from "./interpreter";
import { generateFrame } from "./generator";
import { uploadMirrorFrame } from "./storage";
import { updateMirrorOnChain } from "./onChainUpdater";
import {
  getLatestFrame,
  storeFrame,
  updateMirrorTypeCurrentFrame,
  getActiveMirrors,
  updateActiveMirrorFrame,
} from "./db";

// ============================================================
// Mirror Update Orchestrator
// ============================================================

export interface UpdateResult {
  mirrorType: string;
  frameNumber: number;
  imageUri: string;
  metadataUri: string;
  dataSignals: string[];
  mood: string;
  activeMirrorsUpdated: number;
  activeMirrorsFailed: number;
  durationMs: number;
}

declare global {
  var __mirrorUpdateInFlight:
    | Map<string, Promise<UpdateResult>>
    | undefined;
}

function getInFlightUpdateMap(): Map<string, Promise<UpdateResult>> {
  if (!globalThis.__mirrorUpdateInFlight) {
    globalThis.__mirrorUpdateInFlight = new Map<string, Promise<UpdateResult>>();
  }
  return globalThis.__mirrorUpdateInFlight;
}

/**
 * Run the full update pipeline for a mirror type.
 *
 * 1. Load config
 * 2. Get previous frame from Supabase
 * 3. Fetch data feeds
 * 4. Interpret data with Claude
 * 5. Generate image with Flux
 * 6. Upload to Arweave
 * 7. Store frame in Supabase
 * 8. Update mirror_types current frame
 * 9. Update all active mirror NFTs on-chain
 */
export async function updateMirrorType(
  mirrorTypeId: string
): Promise<UpdateResult> {
  const startTime = Date.now();

  console.log(`[mirror-update] Starting update for ${mirrorTypeId}`);

  // 1. Load mirror config
  const config = await getMirrorConfig(mirrorTypeId);

  // 2. Get previous frame
  const previousFrame = await getLatestFrame(mirrorTypeId);
  const frameNumber = (previousFrame?.frameNumber ?? 0) + 1;

  console.log(
    `[mirror-update] ${mirrorTypeId} — generating frame #${frameNumber}` +
      (previousFrame ? ` (continuing from #${previousFrame.frameNumber})` : " (genesis)")
  );

  // 3. Fetch data feeds
  const dataSnapshot = await fetchMirrorData(config.dataFeedConfig);
  console.log(
    `[mirror-update] ${mirrorTypeId} — data fetched:`,
    `weather=${!!dataSnapshot.weather}`,
    `news=${dataSnapshot.news?.headlines.length ?? 0} headlines`,
    `chain=${!!dataSnapshot.onChain}`,
    `calendar=${(dataSnapshot.calendar?.holidays.length ?? 0) + (dataSnapshot.calendar?.customEvents.length ?? 0)} events`
  );

  // 4. Interpret data with Claude
  const scene = await interpretData(config, dataSnapshot, previousFrame);
  console.log(
    `[mirror-update] ${mirrorTypeId} — interpreted: mood="${scene.mood}", signals=[${scene.dataSignals.join(", ")}]`
  );

  // 5. Generate image
  const previousFrameUrl = previousFrame?.imageUri ?? null;
  const { imageUrl } = await generateFrame(scene, config.style, previousFrameUrl);
  console.log(`[mirror-update] ${mirrorTypeId} — image generated`);

  // 6. Upload to Arweave
  const { imageUri, metadataUri } = await uploadMirrorFrame(
    imageUrl,
    {
      scene,
      dataSnapshot,
      previousFrameUri: previousFrame?.metadataUri ?? null,
    },
    mirrorTypeId,
    frameNumber,
    config.name
  );
  console.log(
    `[mirror-update] ${mirrorTypeId} — uploaded to Arweave: image=${imageUri}, metadata=${metadataUri}`
  );

  // 7. Store frame in Supabase
  await storeFrame(
    mirrorTypeId,
    frameNumber,
    imageUri,
    metadataUri,
    scene,
    dataSnapshot,
    previousFrame?.id ?? null
  );

  // 8. Update mirror_types current frame
  await updateMirrorTypeCurrentFrame(
    mirrorTypeId,
    frameNumber,
    imageUri,
    metadataUri
  );

  // 9. Update all active mirror NFTs on-chain
  const activeMirrors = await getActiveMirrors(mirrorTypeId);
  let updated = 0;
  let failed = 0;

  for (const mirror of activeMirrors) {
    try {
      await updateMirrorOnChain(mirror.mint_address, metadataUri);
      await updateActiveMirrorFrame(
        mirror.mint_address,
        frameNumber,
        metadataUri
      );
      updated++;
    } catch (err) {
      failed++;
      console.error(
        `[mirror-update] Failed to update mirror ${mirror.mint_address}:`,
        err instanceof Error ? err.message : err
      );
      // Continue with other mirrors — one failure doesn't stop the batch
    }
  }

  const durationMs = Date.now() - startTime;

  console.log(
    `[mirror-update] ${mirrorTypeId} — frame #${frameNumber} complete in ${(durationMs / 1000).toFixed(1)}s. ` +
      `On-chain: ${updated} updated, ${failed} failed out of ${activeMirrors.length} active mirrors.`
  );

  return {
    mirrorType: mirrorTypeId,
    frameNumber,
    imageUri,
    metadataUri,
    dataSignals: scene.dataSignals,
    mood: scene.mood,
    activeMirrorsUpdated: updated,
    activeMirrorsFailed: failed,
    durationMs,
  };
}

/**
 * In-process lock + idempotency guard.
 *
 * If an update for the same mirror type is already running in this server
 * instance, callers await the same promise instead of starting a duplicate run.
 */
export async function updateMirrorTypeWithLock(
  mirrorTypeId: string
): Promise<{ result: UpdateResult; deduped: boolean }> {
  const inFlight = getInFlightUpdateMap();
  const existing = inFlight.get(mirrorTypeId);

  if (existing) {
    const result = await existing;
    return { result, deduped: true };
  }

  const run = updateMirrorType(mirrorTypeId).finally(() => {
    inFlight.delete(mirrorTypeId);
  });

  inFlight.set(mirrorTypeId, run);
  const result = await run;
  return { result, deduped: false };
}
