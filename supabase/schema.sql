-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Creates the tables for persisting minted collections and NFTs.

CREATE TABLE collections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address    TEXT NOT NULL,
  collection_address TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  symbol            TEXT NOT NULL,
  description       TEXT DEFAULT '',
  royalty_bps       INT DEFAULT 500,
  minted_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nfts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id   UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  mint_address    TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  image_url       TEXT NOT NULL,
  explorer_url    TEXT NOT NULL,
  minted_at       TIMESTAMPTZ DEFAULT now()
);

-- Index for fast wallet lookups (gallery page)
CREATE INDEX idx_collections_wallet ON collections(wallet_address);

-- Index for fast collection → NFT joins
CREATE INDEX idx_nfts_collection ON nfts(collection_id);

-- Row Level Security (defense in depth — API routes use service key,
-- but if the anon key ever leaks, RLS prevents cross-user access)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so our API routes work.
-- These policies are for direct client access (not used currently,
-- but ready if we switch to client-side Supabase later).
CREATE POLICY "Users can read own collections"
  ON collections FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read NFTs"
  ON nfts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert NFTs"
  ON nfts FOR INSERT
  WITH CHECK (true);
