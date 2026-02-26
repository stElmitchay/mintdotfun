-- Fix vector dimension: Google text-embedding-004 = 768, not 1536
ALTER TABLE agent_memories ALTER COLUMN embedding TYPE VECTOR(768);

-- Drop and recreate index with correct dimension
DROP INDEX IF EXISTS idx_memories_embedding;
CREATE INDEX idx_memories_embedding ON agent_memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC function for semantic memory search
CREATE OR REPLACE FUNCTION match_agent_memories(
  query_embedding VECTOR(768),
  target_agent_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
) RETURNS TABLE (
  id UUID, type TEXT, content TEXT, importance FLOAT,
  metadata JSONB, similarity FLOAT
) LANGUAGE sql STABLE AS $$
  SELECT m.id, m.type, m.content, m.importance, m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM agent_memories m
  WHERE m.agent_id = target_agent_id
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;
