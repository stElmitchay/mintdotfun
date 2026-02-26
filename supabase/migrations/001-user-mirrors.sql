-- Migration: Add support for user-created mirrors
-- Run after mirrors-schema.sql

ALTER TABLE mirror_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE mirror_types ADD COLUMN IF NOT EXISTS creator_wallet TEXT;
ALTER TABLE mirror_types ADD COLUMN IF NOT EXISTS creator_share_pct INT DEFAULT 0;
ALTER TABLE mirror_types ADD COLUMN IF NOT EXISTS last_update_started_at TIMESTAMPTZ;
