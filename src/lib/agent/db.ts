import { supabase } from "@/lib/supabase";
import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Agent Database Helpers
// ============================================================

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return supabase;
}

/** Check if an agent name is already taken (case-insensitive). */
export async function isAgentNameTaken(name: string): Promise<boolean> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agents")
    .select("id")
    .ilike("name", name)
    .limit(1);

  if (error) throw new Error(`Name check failed: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** Create a new agent record after successful on-chain mint. Returns UUID. */
export async function createAgentRecord(params: {
  mintAddress: string;
  ownerWallet: string;
  name: string;
  archetype: string;
  personality: AgentPersonality;
  personalityHash: string;
  personalityArweaveUri: string;
  avatarUrl: string;
}): Promise<string> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agents")
    .insert({
      mint_address: params.mintAddress,
      owner_wallet: params.ownerWallet,
      name: params.name,
      archetype: params.archetype,
      personality: params.personality as unknown as Record<string, unknown>,
      personality_hash: params.personalityHash,
      personality_arweave_uri: params.personalityArweaveUri,
      avatar_url: params.avatarUrl,
      level: 1,
      reputation_score: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create agent: ${error.message}`);
  return data.id;
}

/** Get an agent by its on-chain mint address. */
export async function getAgentByMintAddress(mintAddress: string) {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("mint_address", mintAddress)
    .single();

  if (error || !data) return null;
  return data;
}

/** Get all agents owned by a wallet. */
export async function getAgentsByOwner(ownerWallet: string) {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("owner_wallet", ownerWallet)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch agents: ${error.message}`);
  return data ?? [];
}

/** Create an evolution snapshot (personality history entry). */
export async function createEvolutionSnapshot(params: {
  agentId: string;
  personality: AgentPersonality;
  arweaveUri: string | null;
  trigger: string;
  levelAtSnapshot: number;
}): Promise<string> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agent_evolution_snapshots")
    .insert({
      agent_id: params.agentId,
      personality: params.personality as unknown as Record<string, unknown>,
      arweave_uri: params.arweaveUri,
      trigger: params.trigger,
      level_at_snapshot: params.levelAtSnapshot,
    })
    .select("id")
    .single();

  if (error)
    throw new Error(`Failed to create evolution snapshot: ${error.message}`);
  return data.id;
}

/** Get an agent by UUID. */
export async function getAgentById(
  agentId: string
): Promise<AgentRow | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error || !data) return null;
  return data as AgentRow;
}

/** Save a chat message. */
export async function saveMessage(params: {
  agentId: string;
  sessionId: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = requireSupabase();

  const { error } = await db.from("agent_messages").insert({
    agent_id: params.agentId,
    session_id: params.sessionId,
    role: params.role,
    content: params.content,
    metadata: params.metadata ?? {},
  });

  if (error) throw new Error(`Failed to save message: ${error.message}`);
}

/** Get messages for a session. */
export async function getSessionMessages(params: {
  agentId: string;
  sessionId: string;
  limit?: number;
}) {
  const db = requireSupabase();

  const query = db
    .from("agent_messages")
    .select("*")
    .eq("agent_id", params.agentId)
    .eq("session_id", params.sessionId)
    .order("created_at", { ascending: true });

  if (params.limit) query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return data ?? [];
}

/** Increment total_interactions counter. */
export async function incrementInteractions(agentId: string): Promise<void> {
  const db = requireSupabase();

  const { error } = await db.rpc("increment_agent_counter", {
    agent_uuid: agentId,
    counter_name: "total_interactions",
  });

  // Fallback if RPC not available: read-then-write
  if (error) {
    const agent = await getAgentById(agentId);
    if (!agent) return;
    await db
      .from("agents")
      .update({
        total_interactions: agent.total_interactions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);
  }
}

/** Increment total_creations counter. */
export async function incrementCreations(agentId: string): Promise<void> {
  const db = requireSupabase();

  const { error } = await db.rpc("increment_agent_counter", {
    agent_uuid: agentId,
    counter_name: "total_creations",
  });

  if (error) {
    const agent = await getAgentById(agentId);
    if (!agent) return;
    await db
      .from("agents")
      .update({
        total_creations: agent.total_creations + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);
  }
}

/** Save a generated artwork. Returns artwork UUID. */
export async function saveArtwork(params: {
  agentId: string;
  imageUrl: string;
  prompt: string;
  agentCommentary?: string;
  selfScore?: number;
  influencesUsed?: string[];
}): Promise<string> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agent_artworks")
    .insert({
      agent_id: params.agentId,
      image_url: params.imageUrl,
      prompt: params.prompt,
      agent_commentary: params.agentCommentary ?? null,
      self_score: params.selfScore ?? null,
      influences_used: params.influencesUsed ?? [],
      status: "generated",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save artwork: ${error.message}`);
  return data.id;
}

/** List all agents with optional filtering and sorting. */
export async function getAllAgents(options: {
  limit?: number;
  offset?: number;
  archetype?: string;
  sort?: string;
} = {}): Promise<{ agents: AgentRow[]; total: number }> {
  const db = requireSupabase();
  const { limit = 20, offset = 0, archetype, sort = "newest" } = options;

  let query = db.from("agents").select("*", { count: "exact" });

  if (archetype) {
    query = query.eq("archetype", archetype);
  }

  switch (sort) {
    case "reputation":
      query = query.order("reputation_score", { ascending: false });
      break;
    case "level":
      query = query.order("level", { ascending: false });
      break;
    case "creations":
      query = query.order("total_creations", { ascending: false });
      break;
    default: // "newest"
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch agents: ${error.message}`);
  return { agents: (data ?? []) as AgentRow[], total: count ?? 0 };
}

/** Fetch recent artworks for an agent. */
export async function getAgentArtworks(
  agentId: string,
  limit: number = 10
) {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agent_artworks")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch artworks: ${error.message}`);
  return data ?? [];
}

/** Update agent stats (level, reputation, etc). */
export async function updateAgentStats(
  agentId: string,
  updates: Partial<
    Pick<
      AgentRow,
      | "level"
      | "reputation_score"
      | "total_interactions"
      | "total_creations"
      | "total_sales"
      | "total_revenue_lamports"
      | "collaborations"
    >
  >
): Promise<void> {
  const db = requireSupabase();

  const { error } = await db
    .from("agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", agentId);

  if (error) throw new Error(`Failed to update agent stats: ${error.message}`);
}
