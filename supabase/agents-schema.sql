-- Agent-as-NFT schema
-- Run in Supabase SQL Editor after enabling pgvector extension

-- Enable pgvector for semantic memory search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Agents (core state, one row per minted agent NFT)
-- ============================================================

CREATE TABLE agents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address            TEXT UNIQUE NOT NULL,
  owner_wallet            TEXT NOT NULL,
  name                    TEXT NOT NULL,
  archetype               TEXT NOT NULL,
  personality             JSONB NOT NULL,
  personality_hash        TEXT NOT NULL,
  personality_arweave_uri TEXT,
  level                   INTEGER NOT NULL DEFAULT 1,
  reputation_score        INTEGER NOT NULL DEFAULT 0,
  total_interactions      INTEGER NOT NULL DEFAULT 0,
  total_creations         INTEGER NOT NULL DEFAULT 0,
  total_sales             INTEGER NOT NULL DEFAULT 0,
  total_revenue_lamports  BIGINT NOT NULL DEFAULT 0,
  collaborations          INTEGER NOT NULL DEFAULT 0,
  autonomy_mode           TEXT NOT NULL DEFAULT 'manual',
  auto_mint_enabled       BOOLEAN NOT NULL DEFAULT false,
  auto_list_enabled       BOOLEAN NOT NULL DEFAULT false,
  min_list_price_lamports BIGINT,
  max_list_price_lamports BIGINT,
  creation_schedule       TEXT DEFAULT 'weekly',
  quality_threshold       INTEGER DEFAULT 70,
  connected_feeds         TEXT[] DEFAULT '{}',
  avatar_url              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_owner ON agents(owner_wallet);
CREATE INDEX idx_agents_mint ON agents(mint_address);
CREATE INDEX idx_agents_level ON agents(level DESC);
CREATE INDEX idx_agents_reputation ON agents(reputation_score DESC);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agents"
  ON agents FOR SELECT USING (true);

CREATE POLICY "Service role can insert agents"
  ON agents FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update agents"
  ON agents FOR UPDATE USING (true);

-- ============================================================
-- Agent Memories (episodic memory with vector search)
-- ============================================================

CREATE TABLE agent_memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedding     VECTOR(768),
  importance    FLOAT NOT NULL DEFAULT 0.5,
  decay_rate    FLOAT NOT NULL DEFAULT 0.1,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_agent ON agent_memories(agent_id);
CREATE INDEX idx_memories_type ON agent_memories(agent_id, type);
CREATE INDEX idx_memories_embedding ON agent_memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent memories"
  ON agent_memories FOR SELECT USING (true);

CREATE POLICY "Service role can insert agent memories"
  ON agent_memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update agent memories"
  ON agent_memories FOR UPDATE USING (true);

CREATE POLICY "Service role can delete agent memories"
  ON agent_memories FOR DELETE USING (true);

-- ============================================================
-- Agent Messages (full conversation history)
-- ============================================================

CREATE TABLE agent_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_agent ON agent_messages(agent_id, created_at DESC);
CREATE INDEX idx_messages_session ON agent_messages(session_id, created_at ASC);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent messages"
  ON agent_messages FOR SELECT USING (true);

CREATE POLICY "Service role can insert agent messages"
  ON agent_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- Agent Artworks (all generated creations)
-- ============================================================

CREATE TABLE agent_artworks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  image_url        TEXT NOT NULL,
  arweave_uri      TEXT,
  prompt           TEXT NOT NULL,
  agent_commentary TEXT,
  self_score       INTEGER,
  owner_approved   BOOLEAN,
  rejection_reason TEXT,
  mint_address     TEXT,
  listing_id       TEXT,
  status           TEXT NOT NULL DEFAULT 'generated',
  influences_used  JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artworks_agent ON agent_artworks(agent_id, created_at DESC);
CREATE INDEX idx_artworks_status ON agent_artworks(agent_id, status);

ALTER TABLE agent_artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent artworks"
  ON agent_artworks FOR SELECT USING (true);

CREATE POLICY "Service role can insert agent artworks"
  ON agent_artworks FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update agent artworks"
  ON agent_artworks FOR UPDATE USING (true);

-- ============================================================
-- Agent Interactions (agent-to-agent)
-- ============================================================

CREATE TABLE agent_interactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_agent_id UUID NOT NULL REFERENCES agents(id),
  target_agent_id    UUID NOT NULL REFERENCES agents(id),
  type               TEXT NOT NULL,
  messages           JSONB NOT NULL DEFAULT '[]',
  outcome            JSONB DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_initiator ON agent_interactions(initiator_agent_id);
CREATE INDEX idx_interactions_target ON agent_interactions(target_agent_id);

ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent interactions"
  ON agent_interactions FOR SELECT USING (true);

CREATE POLICY "Service role can insert agent interactions"
  ON agent_interactions FOR INSERT WITH CHECK (true);

-- ============================================================
-- Agent Evolution Snapshots (personality history)
-- ============================================================

CREATE TABLE agent_evolution_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  personality       JSONB NOT NULL,
  arweave_uri       TEXT,
  trigger           TEXT NOT NULL,
  level_at_snapshot INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_agent ON agent_evolution_snapshots(agent_id, created_at DESC);

ALTER TABLE agent_evolution_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read evolution snapshots"
  ON agent_evolution_snapshots FOR SELECT USING (true);

CREATE POLICY "Service role can insert evolution snapshots"
  ON agent_evolution_snapshots FOR INSERT WITH CHECK (true);
