-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Standalone NFT schema (no collections).

CREATE TABLE nfts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  TEXT NOT NULL,
  mint_address    TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  image_url       TEXT NOT NULL,
  explorer_url    TEXT NOT NULL,
  minted_at       TIMESTAMPTZ DEFAULT now()
);

-- Index for fast wallet lookups (gallery page)
CREATE INDEX idx_nfts_wallet ON nfts(wallet_address);

-- Row Level Security
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read NFTs"
  ON nfts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert NFTs"
  ON nfts FOR INSERT
  WITH CHECK (true);
