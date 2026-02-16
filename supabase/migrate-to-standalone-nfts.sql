-- Migration: collections → standalone NFTs
-- Run this in your Supabase SQL Editor to update the existing schema.

-- 1. Add new columns to nfts table
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 2. Backfill wallet_address from the parent collection (for any existing rows)
UPDATE nfts n
SET wallet_address = c.wallet_address
FROM collections c
WHERE n.collection_id = c.id
  AND n.wallet_address IS NULL;

-- 3. Make wallet_address NOT NULL now that it's backfilled
ALTER TABLE nfts ALTER COLUMN wallet_address SET NOT NULL;

-- 4. Drop the collection foreign key (make collection_id nullable, then drop)
ALTER TABLE nfts ALTER COLUMN collection_id DROP NOT NULL;

-- 5. Add wallet index for gallery lookups
CREATE INDEX IF NOT EXISTS idx_nfts_wallet ON nfts(wallet_address);

-- 6. Drop old collection index (no longer needed)
DROP INDEX IF EXISTS idx_nfts_collection;

-- 7. Drop collections table (no longer used)
-- This cascades and sets collection_id to NULL on existing nft rows
-- because we already removed the NOT NULL constraint.
-- NOTE: If you want to keep old collection data, comment this out.
ALTER TABLE nfts DROP CONSTRAINT IF EXISTS nfts_collection_id_fkey;
DROP TABLE IF EXISTS collections CASCADE;

-- 8. Drop the now-orphaned collection_id column
ALTER TABLE nfts DROP COLUMN IF EXISTS collection_id;
