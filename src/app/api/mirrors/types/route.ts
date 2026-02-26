import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MIRROR_CONFIGS } from "@/lib/mirrors/config";
import type { MirrorTypeConfig, MirrorTypeInfo } from "@/lib/mirrors/types";

/**
 * GET /api/mirrors/types
 *
 * Returns all available mirror types with their current state and holder counts.
 * Reads config from DB JSONB column. Falls back to hardcoded for local dev.
 */
export async function GET() {
  if (!supabase) {
    // Fallback: return hardcoded config-only data without DB state
    const mirrors: MirrorTypeInfo[] = Object.values(MIRROR_CONFIGS).map(
      (config) => ({
        id: config.id,
        name: config.name,
        tagline: config.tagline,
        description: config.description,
        currentFrameImageUri: null,
        currentFrameNumber: 0,
        holdersCount: 0,
        mintPriceSol: config.mintPriceSol,
        maxSupply: config.maxSupply,
        updateCadenceHours: config.updateCadenceHours,
        isActive: true,
        creatorWallet: null,
      })
    );

    return NextResponse.json({ mirrors });
  }

  try {
    // Fetch mirror types from DB
    const { data: types, error } = await supabase
      .from("mirror_types")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    // Fetch holder counts for each type
    const mirrors: MirrorTypeInfo[] = await Promise.all(
      (types ?? []).map(async (t) => {
        const { count } = await supabase!
          .from("active_mirrors")
          .select("*", { count: "exact", head: true })
          .eq("mirror_type", t.id)
          .eq("is_active", true);

        // Read config from DB JSONB, fall back to hardcoded for original mirrors
        const cfg = (t.config as MirrorTypeConfig) ?? MIRROR_CONFIGS[t.id];

        return {
          id: t.id,
          name: t.name ?? cfg?.name ?? "",
          tagline: t.tagline ?? cfg?.tagline ?? "",
          description: t.description ?? cfg?.description ?? "",
          currentFrameImageUri: t.current_frame_image_uri,
          currentFrameNumber: t.current_frame_number ?? 0,
          holdersCount: count ?? 0,
          mintPriceSol: cfg?.mintPriceSol ?? 0.5,
          maxSupply: cfg?.maxSupply ?? null,
          updateCadenceHours: cfg?.updateCadenceHours ?? 24,
          isActive: t.is_active,
          creatorWallet: t.creator_wallet ?? null,
        };
      })
    );

    return NextResponse.json({ mirrors });
  } catch (err) {
    console.error("[api/mirrors/types] Failed:", err);
    return NextResponse.json(
      {
        error: `Failed to fetch mirror types: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
