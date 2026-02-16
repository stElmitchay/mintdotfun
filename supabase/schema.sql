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

-- ============================================================
-- Marketplace listings
-- ============================================================

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_mint_address TEXT NOT NULL,
  seller_wallet   TEXT NOT NULL,
  price_lamports  BIGINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_wallet    TEXT,
  list_tx         TEXT,
  sale_tx         TEXT,
  listed_at       TIMESTAMPTZ DEFAULT NOW(),
  sold_at         TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  nft_name        TEXT NOT NULL,
  nft_image_url   TEXT NOT NULL,
  nft_description TEXT DEFAULT ''
);

CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_seller ON listings(seller_wallet);
CREATE INDEX idx_listings_mint ON listings(nft_mint_address);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listings"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert listings"
  ON listings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update listings"
  ON listings FOR UPDATE
  USING (true);
