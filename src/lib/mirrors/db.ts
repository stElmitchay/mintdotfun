import { supabase } from "@/lib/supabase";
import type { MirrorTypeConfig, MirrorFrame, DataSnapshot, InterpretedScene } from "./types";

// ============================================================
// Supabase helper queries for the Cultural Mirrors system
// ============================================================

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabase;
}

/**
 * Get a mirror config from the database.
 */
export async function getMirrorConfigFromDB(
  mirrorTypeId: string
): Promise<MirrorTypeConfig | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("mirror_types")
    .select("id, config")
    .eq("id", mirrorTypeId)
    .single();

  if (error || !data?.config) return null;
  return data.config as MirrorTypeConfig;
}

/**
 * Get all active mirror types from the database.
 */
export async function getAllActiveMirrorTypes(): Promise<
  { id: string; config: MirrorTypeConfig; updatedAt: string | null }[]
> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("mirror_types")
    .select("id, config, updated_at")
    .eq("is_active", true);

  if (error || !data) return [];

  return data
    .filter((row) => row.config)
    .map((row) => ({
      id: row.id,
      config: row.config as MirrorTypeConfig,
      updatedAt: row.updated_at,
    }));
}

/**
 * Get the latest frame for a mirror type.
 */
export async function getLatestFrame(
  mirrorType: string
): Promise<MirrorFrame | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("mirror_frames")
    .select("*")
    .eq("mirror_type", mirrorType)
    .order("frame_number", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    mirrorType: data.mirror_type,
    frameNumber: data.frame_number,
    imageUri: data.image_uri,
    metadataUri: data.metadata_uri,
    sceneDescription: data.scene_description ?? "",
    mood: data.mood ?? "",
    dominantColors: data.dominant_colors ?? [],
    keyElements: data.key_elements ?? [],
    dataSignals: data.data_signals ?? [],
    dataSnapshot: (data.data_snapshot as DataSnapshot) ?? {
      weather: null,
      news: null,
      onChain: null,
      social: null,
      calendar: null,
      fetchedAt: "",
    },
    generatedAt: data.generated_at,
    previousFrameId: data.previous_frame_id,
  };
}

/**
 * Store a new frame in the mirror_frames table.
 */
export async function storeFrame(
  mirrorType: string,
  frameNumber: number,
  imageUri: string,
  metadataUri: string,
  scene: InterpretedScene,
  dataSnapshot: DataSnapshot,
  previousFrameId: string | null
): Promise<string> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("mirror_frames")
    .insert({
      mirror_type: mirrorType,
      frame_number: frameNumber,
      image_uri: imageUri,
      metadata_uri: metadataUri,
      scene_description: scene.sceneDescription,
      mood: scene.mood,
      dominant_colors: scene.dominantColors,
      key_elements: scene.keyElements,
      data_signals: scene.dataSignals,
      data_snapshot: dataSnapshot as unknown as Record<string, unknown>,
      generated_at: new Date().toISOString(),
      previous_frame_id: previousFrameId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to store frame: ${error.message}`);
  return data.id;
}

/**
 * Update the mirror_types table with the latest frame info.
 */
export async function updateMirrorTypeCurrentFrame(
  mirrorType: string,
  frameNumber: number,
  imageUri: string,
  metadataUri: string
): Promise<void> {
  const db = requireSupabase();

  const { error } = await db
    .from("mirror_types")
    .update({
      current_frame_number: frameNumber,
      current_frame_image_uri: imageUri,
      current_frame_metadata_uri: metadataUri,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mirrorType);

  if (error)
    throw new Error(
      `Failed to update mirror type current frame: ${error.message}`
    );
}

/**
 * Get all active mirrors of a given type (for on-chain updates).
 */
export async function getActiveMirrors(
  mirrorType: string
): Promise<{ mint_address: string; id: string }[]> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("active_mirrors")
    .select("id, mint_address")
    .eq("mirror_type", mirrorType)
    .eq("is_active", true);

  if (error)
    throw new Error(`Failed to fetch active mirrors: ${error.message}`);
  return data ?? [];
}

/**
 * Update an individual active mirror's frame number after on-chain update.
 */
export async function updateActiveMirrorFrame(
  mintAddress: string,
  frameNumber: number,
  metadataUri: string
): Promise<void> {
  const db = requireSupabase();

  const { error } = await db
    .from("active_mirrors")
    .update({
      current_frame_number: frameNumber,
      current_metadata_uri: metadataUri,
      last_updated_at: new Date().toISOString(),
    })
    .eq("mint_address", mintAddress);

  if (error)
    throw new Error(
      `Failed to update active mirror ${mintAddress}: ${error.message}`
    );
}

/**
 * Get the count of active holders for a mirror type.
 */
export async function getMirrorHoldersCount(
  mirrorType: string
): Promise<number> {
  const db = requireSupabase();

  const { count, error } = await db
    .from("active_mirrors")
    .select("*", { count: "exact", head: true })
    .eq("mirror_type", mirrorType)
    .eq("is_active", true);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Cache a data feed response for fallback.
 */
export async function cacheDataFeed(
  mirrorType: string,
  feedName: string,
  data: unknown
): Promise<void> {
  const db = requireSupabase();

  await db.from("data_feed_cache").upsert(
    {
      mirror_type: mirrorType,
      feed_name: feedName,
      data: data as Record<string, unknown>,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "mirror_type,feed_name" }
  );
}

/**
 * Get a cached data feed response (returns null if stale or missing).
 * Cache TTL: 24 hours.
 */
export async function getCachedDataFeed(
  mirrorType: string,
  feedName: string
): Promise<unknown | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("data_feed_cache")
    .select("data, cached_at")
    .eq("mirror_type", mirrorType)
    .eq("feed_name", feedName)
    .single();

  if (error || !data) return null;

  // Check if cache is older than 24 hours
  const cachedAt = new Date(data.cached_at).getTime();
  const now = Date.now();
  const TTL_MS = 24 * 60 * 60 * 1000;

  if (now - cachedAt > TTL_MS) return null;

  return data.data;
}

/**
 * Get frames for the timeline view (paginated, newest first).
 */
export async function getFrames(
  mirrorType: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ frames: MirrorFrame[]; total: number }> {
  const db = requireSupabase();

  const { data, error, count } = await db
    .from("mirror_frames")
    .select("*", { count: "exact" })
    .eq("mirror_type", mirrorType)
    .order("frame_number", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch frames: ${error.message}`);

  const frames: MirrorFrame[] = (data ?? []).map((row) => ({
    id: row.id,
    mirrorType: row.mirror_type,
    frameNumber: row.frame_number,
    imageUri: row.image_uri,
    metadataUri: row.metadata_uri,
    sceneDescription: row.scene_description ?? "",
    mood: row.mood ?? "",
    dominantColors: row.dominant_colors ?? [],
    keyElements: row.key_elements ?? [],
    dataSignals: row.data_signals ?? [],
    dataSnapshot: (row.data_snapshot as DataSnapshot) ?? {
      weather: null,
      news: null,
      onChain: null,
      social: null,
      calendar: null,
      fetchedAt: "",
    },
    generatedAt: row.generated_at,
    previousFrameId: row.previous_frame_id,
  }));

  return { frames, total: count ?? 0 };
}
