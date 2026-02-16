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
