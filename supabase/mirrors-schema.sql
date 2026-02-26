-- Run this in your Supabase SQL Editor
-- Cultural Mirrors schema

-- ============================================================
-- Mirror Types (one row per mirror — Dubai, Lagos, etc.)
-- ============================================================

CREATE TABLE mirror_types (
  id                         TEXT PRIMARY KEY,
  name                       TEXT NOT NULL,
  tagline                    TEXT,
  description                TEXT,
  config                     JSONB NOT NULL,
  current_frame_number       INT DEFAULT 0,
  current_frame_image_uri    TEXT,
  current_frame_metadata_uri TEXT,
  is_active                  BOOLEAN DEFAULT true,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mirror_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mirror types"
  ON mirror_types FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert mirror types"
  ON mirror_types FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update mirror types"
  ON mirror_types FOR UPDATE
  USING (true);

-- ============================================================
-- Mirror Frames (every generated frame, permanently archived)
-- ============================================================

CREATE TABLE mirror_frames (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mirror_type       TEXT NOT NULL REFERENCES mirror_types(id),
  frame_number      INT NOT NULL,
  image_uri         TEXT NOT NULL,
  metadata_uri      TEXT NOT NULL,
  scene_description TEXT,
  mood              TEXT,
  dominant_colors   TEXT[],
  key_elements      TEXT[],
  data_signals      TEXT[],
  data_snapshot     JSONB,
  generated_at      TIMESTAMPTZ NOT NULL,
  previous_frame_id UUID REFERENCES mirror_frames(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mirror_type, frame_number)
);

CREATE INDEX idx_mirror_frames_type_number
  ON mirror_frames(mirror_type, frame_number DESC);

ALTER TABLE mirror_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mirror frames"
  ON mirror_frames FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert mirror frames"
  ON mirror_frames FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Active Mirrors (individual minted NFTs being updated)
-- ============================================================

CREATE TABLE active_mirrors (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address         TEXT NOT NULL UNIQUE,
  mirror_type          TEXT NOT NULL REFERENCES mirror_types(id),
  owner_wallet         TEXT NOT NULL,
  current_frame_number INT DEFAULT 0,
  current_metadata_uri TEXT,
  is_active            BOOLEAN DEFAULT true,
  minted_at            TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_active_mirrors_type
  ON active_mirrors(mirror_type) WHERE is_active = true;

CREATE INDEX idx_active_mirrors_owner
  ON active_mirrors(owner_wallet);

ALTER TABLE active_mirrors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active mirrors"
  ON active_mirrors FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert active mirrors"
  ON active_mirrors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update active mirrors"
  ON active_mirrors FOR UPDATE
  USING (true);

-- ============================================================
-- Data Feed Cache (3-tier fallback: primary → cache → default)
-- ============================================================

CREATE TABLE data_feed_cache (
  mirror_type TEXT NOT NULL,
  feed_name   TEXT NOT NULL,
  data        JSONB NOT NULL,
  cached_at   TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (mirror_type, feed_name)
);

ALTER TABLE data_feed_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read data feed cache"
  ON data_feed_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can upsert data feed cache"
  ON data_feed_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update data feed cache"
  ON data_feed_cache FOR UPDATE
  USING (true);
