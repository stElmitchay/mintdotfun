import { supabase } from "@/lib/supabase";
import { generateEmbedding } from "./embeddings";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// ============================================================
// Agent Memory System — store, search, consolidate
// ============================================================

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return supabase;
}

/** Store a memory with vector embedding. */
export async function storeMemory(params: {
  agentId: string;
  type: string;
  content: string;
  importance?: number;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const db = requireSupabase();
  const embedding = await generateEmbedding(params.content);

  const { data, error } = await db
    .from("agent_memories")
    .insert({
      agent_id: params.agentId,
      type: params.type,
      content: params.content,
      embedding: JSON.stringify(embedding),
      importance: params.importance ?? 0.5,
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to store memory: ${error.message}`);
  return data.id;
}

/** Semantic search over agent memories using vector similarity. */
export async function searchMemories(params: {
  agentId: string;
  query: string;
  limit?: number;
  threshold?: number;
}): Promise<
  Array<{
    id: string;
    type: string;
    content: string;
    importance: number;
    metadata: Record<string, unknown>;
    similarity: number;
  }>
> {
  const db = requireSupabase();
  const queryEmbedding = await generateEmbedding(params.query);

  const { data, error } = await db.rpc("match_agent_memories", {
    query_embedding: JSON.stringify(queryEmbedding),
    target_agent_id: params.agentId,
    match_threshold: params.threshold ?? 0.7,
    match_count: params.limit ?? 10,
  });

  if (error) throw new Error(`Memory search failed: ${error.message}`);
  return data ?? [];
}

/** Get recent memories by time (no vector search). */
export async function getRecentMemories(params: {
  agentId: string;
  type?: string;
  limit?: number;
}) {
  const db = requireSupabase();

  let query = db
    .from("agent_memories")
    .select("id, type, content, importance, metadata, created_at")
    .eq("agent_id", params.agentId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 20);

  if (params.type) {
    query = query.eq("type", params.type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch memories: ${error.message}`);
  return data ?? [];
}

/** Summarize a conversation and store as a memory. */
export async function consolidateConversation(params: {
  agentId: string;
  sessionId: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<string> {
  const transcript = params.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const { text: summary } = await generateText({
    model: google("gemini-2.5-flash"),
    system:
      "Summarize this conversation concisely, capturing key topics, decisions, and any creative ideas discussed. Keep it under 200 words.",
    prompt: transcript,
  });

  return storeMemory({
    agentId: params.agentId,
    type: "conversation_summary",
    content: summary,
    importance: 0.6,
    metadata: { sessionId: params.sessionId },
  });
}
