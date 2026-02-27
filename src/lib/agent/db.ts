import { supabase } from "@/lib/supabase";
import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";
import { DEFAULT_PERMISSION_VALUES } from "./autonomy";

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

export interface AgentSessionSummary {
  sessionId: string;
  lastMessageAt: string;
  preview: string;
  messageCount: number;
}

/** List recent chat sessions for an agent based on agent_messages. */
export async function listAgentSessions(
  agentId: string,
  limit: number = 20
): Promise<AgentSessionSummary[]> {
  const db = requireSupabase();

  const { data, error } = await db
    .from("agent_messages")
    .select("session_id, role, content, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 80, 200));

  if (error) throw new Error(`Failed to list sessions: ${error.message}`);

  const bySession = new Map<string, AgentSessionSummary>();
  for (const row of data ?? []) {
    const sessionId = String(row.session_id ?? "");
    if (!sessionId) continue;

    const existing = bySession.get(sessionId);
    if (!existing) {
      bySession.set(sessionId, {
        sessionId,
        lastMessageAt: String(row.created_at),
        preview: String(row.content ?? "").slice(0, 120),
        messageCount: 1,
      });
      continue;
    }

    existing.messageCount += 1;
    if (!existing.preview && row.content) {
      existing.preview = String(row.content).slice(0, 120);
    }
  }

  return [...bySession.values()]
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )
    .slice(0, limit);
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

export interface AgentPermissionsRow {
  agent_id: string;
  owner_wallet: string;
  mode: "manual" | "suggest" | "auto_create" | "full_autonomous";
  allowed_actions: string[];
  allowed_tokens: string[];
  max_trade_lamports: number;
  daily_spend_limit_lamports: number;
  max_open_positions: number;
  max_drawdown_bps: number;
  cooldown_seconds: number;
  require_approval_above_lamports: number;
  is_paused: boolean;
  updated_at: string;
}

export interface AgentInstructionsRow {
  agent_id: string;
  strategy_text: string;
  strategy_json: Record<string, unknown>;
  risk_profile: "conservative" | "balanced" | "aggressive";
  time_horizon: "intraday" | "swing" | "long";
  updated_at: string;
}

export interface AgentRunRow {
  id: string;
  agent_id: string;
  trigger_type: "cron" | "event" | "manual";
  status: "planned" | "executed" | "failed" | "skipped";
  reason: string | null;
  started_at: string;
  finished_at: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface AgentReputationSnapshotRow {
  id: string;
  agent_id: string;
  xp_total: number;
  reputation_score: number;
  score_breakdown: Record<string, unknown>;
  window_7d: Record<string, unknown>;
  window_30d: Record<string, unknown>;
  window_90d: Record<string, unknown>;
  arweave_uri: string | null;
  created_at: string;
}

export async function getAgentPermissions(
  agentId: string
): Promise<AgentPermissionsRow | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_permissions")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch agent permissions: ${error.message}`);
  return (data as AgentPermissionsRow | null) ?? null;
}

export async function ensureAgentPermissions(
  agent: AgentRow
): Promise<AgentPermissionsRow> {
  const existing = await getAgentPermissions(agent.id);
  if (existing) return existing;

  const created = await upsertAgentPermissions({
    agentId: agent.id,
    ownerWallet: agent.owner_wallet,
    mode: DEFAULT_PERMISSION_VALUES.mode,
    allowedActions: DEFAULT_PERMISSION_VALUES.allowedActions,
    allowedTokens: DEFAULT_PERMISSION_VALUES.allowedTokens,
    maxTradeLamports: DEFAULT_PERMISSION_VALUES.maxTradeLamports,
    dailySpendLimitLamports: DEFAULT_PERMISSION_VALUES.dailySpendLimitLamports,
    maxOpenPositions: DEFAULT_PERMISSION_VALUES.maxOpenPositions,
    maxDrawdownBps: DEFAULT_PERMISSION_VALUES.maxDrawdownBps,
    cooldownSeconds: DEFAULT_PERMISSION_VALUES.cooldownSeconds,
    requireApprovalAboveLamports:
      DEFAULT_PERMISSION_VALUES.requireApprovalAboveLamports,
    isPaused: DEFAULT_PERMISSION_VALUES.isPaused,
  });

  return created;
}

export async function upsertAgentPermissions(params: {
  agentId: string;
  ownerWallet: string;
  mode?: "manual" | "suggest" | "auto_create" | "full_autonomous";
  allowedActions?: string[];
  allowedTokens?: string[];
  maxTradeLamports?: number;
  dailySpendLimitLamports?: number;
  maxOpenPositions?: number;
  maxDrawdownBps?: number;
  cooldownSeconds?: number;
  requireApprovalAboveLamports?: number;
  isPaused?: boolean;
}): Promise<AgentPermissionsRow> {
  const db = requireSupabase();
  const payload = {
    agent_id: params.agentId,
    owner_wallet: params.ownerWallet,
    mode: params.mode ?? DEFAULT_PERMISSION_VALUES.mode,
    allowed_actions: params.allowedActions ?? DEFAULT_PERMISSION_VALUES.allowedActions,
    allowed_tokens: params.allowedTokens ?? DEFAULT_PERMISSION_VALUES.allowedTokens,
    max_trade_lamports:
      params.maxTradeLamports ?? DEFAULT_PERMISSION_VALUES.maxTradeLamports,
    daily_spend_limit_lamports:
      params.dailySpendLimitLamports ??
      DEFAULT_PERMISSION_VALUES.dailySpendLimitLamports,
    max_open_positions:
      params.maxOpenPositions ?? DEFAULT_PERMISSION_VALUES.maxOpenPositions,
    max_drawdown_bps:
      params.maxDrawdownBps ?? DEFAULT_PERMISSION_VALUES.maxDrawdownBps,
    cooldown_seconds:
      params.cooldownSeconds ?? DEFAULT_PERMISSION_VALUES.cooldownSeconds,
    require_approval_above_lamports:
      params.requireApprovalAboveLamports ??
      DEFAULT_PERMISSION_VALUES.requireApprovalAboveLamports,
    is_paused: params.isPaused ?? DEFAULT_PERMISSION_VALUES.isPaused,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("agent_permissions")
    .upsert(payload, { onConflict: "agent_id" })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to upsert agent permissions: ${error.message}`);
  return data as AgentPermissionsRow;
}

export async function getAgentInstructions(
  agentId: string
): Promise<AgentInstructionsRow | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_instructions")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch agent instructions: ${error.message}`);
  return (data as AgentInstructionsRow | null) ?? null;
}

export async function upsertAgentInstructions(params: {
  agentId: string;
  strategyText?: string;
  strategyJson?: Record<string, unknown>;
  riskProfile?: "conservative" | "balanced" | "aggressive";
  timeHorizon?: "intraday" | "swing" | "long";
}): Promise<AgentInstructionsRow> {
  const db = requireSupabase();
  const payload = {
    agent_id: params.agentId,
    strategy_text: params.strategyText ?? "",
    strategy_json: params.strategyJson ?? {},
    risk_profile: params.riskProfile ?? "balanced",
    time_horizon: params.timeHorizon ?? "swing",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db
    .from("agent_instructions")
    .upsert(payload, { onConflict: "agent_id" })
    .select("*")
    .single();

  if (error)
    throw new Error(`Failed to upsert agent instructions: ${error.message}`);
  return data as AgentInstructionsRow;
}

export async function createAgentRun(params: {
  agentId: string;
  triggerType: "cron" | "event" | "manual";
  status: "planned" | "executed" | "failed" | "skipped";
  reason?: string;
  idempotencyKey: string;
}): Promise<AgentRunRow> {
  const db = requireSupabase();
  const payload = {
    agent_id: params.agentId,
    trigger_type: params.triggerType,
    status: params.status,
    reason: params.reason ?? null,
    idempotency_key: params.idempotencyKey,
    started_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("agent_runs")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create agent run: ${error.message}`);
  return data as AgentRunRow;
}

export async function finalizeAgentRun(params: {
  runId: string;
  status: "executed" | "failed" | "skipped";
  reason?: string;
}): Promise<AgentRunRow> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_runs")
    .update({
      status: params.status,
      reason: params.reason ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", params.runId)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to finalize agent run: ${error.message}`);
  return data as AgentRunRow;
}

export async function listAgentRuns(
  agentId: string,
  limit: number = 20
): Promise<AgentRunRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_runs")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list agent runs: ${error.message}`);
  return (data as AgentRunRow[]) ?? [];
}

export async function createAgentAction(params: {
  runId: string;
  agentId: string;
  actionType: string;
  planPayload?: Record<string, unknown>;
  riskCheckResult?: Record<string, unknown>;
  executionResult?: Record<string, unknown>;
  txSignature?: string | null;
  pnlLamports?: number | null;
  status?: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("agent_actions").insert({
    run_id: params.runId,
    agent_id: params.agentId,
    action_type: params.actionType,
    plan_payload: params.planPayload ?? {},
    risk_check_result: params.riskCheckResult ?? {},
    execution_result: params.executionResult ?? {},
    tx_signature: params.txSignature ?? null,
    pnl_lamports: params.pnlLamports ?? null,
    status: params.status ?? "planned",
  });
  if (error) throw new Error(`Failed to create agent action: ${error.message}`);
}

export async function createReputationEvent(params: {
  agentId: string;
  source:
    | "trade_result"
    | "uptime"
    | "risk_violation"
    | "owner_feedback"
    | "sale"
    | "run_result";
  xpDelta: number;
  repDelta: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("agent_reputation_events").insert({
    agent_id: params.agentId,
    source: params.source,
    xp_delta: params.xpDelta,
    rep_delta: params.repDelta,
    metadata: params.metadata ?? {},
  });
  if (error)
    throw new Error(`Failed to create reputation event: ${error.message}`);
}

export async function getLatestReputationSnapshot(
  agentId: string
): Promise<AgentReputationSnapshotRow | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_reputation_snapshots")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    throw new Error(`Failed to load reputation snapshot: ${error.message}`);
  return (data as AgentReputationSnapshotRow | null) ?? null;
}

export async function upsertReputationSnapshot(params: {
  agentId: string;
  xpTotal: number;
  reputationScore: number;
  scoreBreakdown?: Record<string, unknown>;
  window7d?: Record<string, unknown>;
  window30d?: Record<string, unknown>;
  window90d?: Record<string, unknown>;
  arweaveUri?: string | null;
}): Promise<AgentReputationSnapshotRow> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_reputation_snapshots")
    .insert({
      agent_id: params.agentId,
      xp_total: params.xpTotal,
      reputation_score: params.reputationScore,
      score_breakdown: params.scoreBreakdown ?? {},
      window_7d: params.window7d ?? {},
      window_30d: params.window30d ?? {},
      window_90d: params.window90d ?? {},
      arweave_uri: params.arweaveUri ?? null,
    })
    .select("*")
    .single();
  if (error)
    throw new Error(`Failed to create reputation snapshot: ${error.message}`);
  return data as AgentReputationSnapshotRow;
}

export async function listReputationEvents(
  agentId: string,
  limit: number = 200
): Promise<
  Array<{
    id: string;
    source: string;
    xp_delta: number;
    rep_delta: number;
    metadata: Record<string, unknown>;
    created_at: string;
  }>
> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("agent_reputation_events")
    .select("id,source,xp_delta,rep_delta,metadata,created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error(`Failed to list reputation events: ${error.message}`);
  return (data ?? []) as Array<{
    id: string;
    source: string;
    xp_delta: number;
    rep_delta: number;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
}
