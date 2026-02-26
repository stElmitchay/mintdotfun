import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // Don't throw at module load — allows the app to run without Supabase
  // for local development. API routes will return 503 if called.
  console.warn(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Database features disabled."
  );
}

/**
 * Server-side Supabase client using the service role key.
 * Only use in API routes — never expose to the browser.
 */
export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/** Type-safe row shape matching the nfts table schema. */
export interface NftRow {
  id: string;
  wallet_address: string;
  mint_address: string;
  name: string;
  description: string;
  image_url: string;
  explorer_url: string;
  minted_at: string;
}

/** Type-safe row shape matching the listings table schema. */
export interface ListingRow {
  id: string;
  nft_mint_address: string;
  seller_wallet: string;
  price_lamports: number;
  status: "active" | "sold" | "cancelled";
  buyer_wallet: string | null;
  list_tx: string | null;
  sale_tx: string | null;
  listed_at: string;
  sold_at: string | null;
  cancelled_at: string | null;
  nft_name: string;
  nft_image_url: string;
  nft_description: string;
}

// ============================================================
// Cultural Mirrors
// ============================================================

/** Row shape for mirror_types table. */
export interface MirrorTypeRow {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  config: Record<string, unknown>;
  current_frame_number: number;
  current_frame_image_uri: string | null;
  current_frame_metadata_uri: string | null;
  is_active: boolean;
  created_at: string;
}

/** Row shape for mirror_frames table. */
export interface MirrorFrameRow {
  id: string;
  mirror_type: string;
  frame_number: number;
  image_uri: string;
  metadata_uri: string;
  scene_description: string | null;
  mood: string | null;
  dominant_colors: string[] | null;
  key_elements: string[] | null;
  data_signals: string[] | null;
  data_snapshot: Record<string, unknown> | null;
  generated_at: string;
  previous_frame_id: string | null;
  created_at: string;
}

/** Row shape for active_mirrors table. */
export interface ActiveMirrorRow {
  id: string;
  mint_address: string;
  mirror_type: string;
  owner_wallet: string;
  current_frame_number: number;
  current_metadata_uri: string | null;
  is_active: boolean;
  minted_at: string;
  last_updated_at: string | null;
}
