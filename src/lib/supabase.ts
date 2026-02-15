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

/** Type-safe row shapes matching the schema. */
export interface CollectionRow {
  id: string;
  wallet_address: string;
  collection_address: string;
  name: string;
  symbol: string;
  description: string;
  royalty_bps: number;
  minted_at: string;
}

export interface NftRow {
  id: string;
  collection_id: string;
  mint_address: string;
  name: string;
  image_url: string;
  explorer_url: string;
  minted_at: string;
}
