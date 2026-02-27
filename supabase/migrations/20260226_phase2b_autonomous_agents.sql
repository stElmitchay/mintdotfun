-- Phase 2B: Autonomous Agent Operations
-- Creates permission, instruction, run/action ledger, and reputation tables.

create extension if not exists pgcrypto;

create table if not exists agent_permissions (
  agent_id uuid primary key references agents(id) on delete cascade,
  owner_wallet text not null,
  mode text not null default 'manual' check (mode in ('manual', 'suggest', 'auto_create', 'full_autonomous')),
  allowed_actions text[] not null default array[]::text[],
  allowed_tokens text[] not null default array[]::text[],
  max_trade_lamports bigint not null default 0 check (max_trade_lamports >= 0),
  daily_spend_limit_lamports bigint not null default 0 check (daily_spend_limit_lamports >= 0),
  max_open_positions integer not null default 0 check (max_open_positions >= 0),
  max_drawdown_bps integer not null default 0 check (max_drawdown_bps >= 0),
  cooldown_seconds integer not null default 0 check (cooldown_seconds >= 0),
  require_approval_above_lamports bigint not null default 0 check (require_approval_above_lamports >= 0),
  is_paused boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_permissions_mode on agent_permissions(mode);
create index if not exists idx_agent_permissions_paused on agent_permissions(is_paused);

create table if not exists agent_instructions (
  agent_id uuid primary key references agents(id) on delete cascade,
  strategy_text text not null default '',
  strategy_json jsonb not null default '{}'::jsonb,
  risk_profile text not null default 'balanced' check (risk_profile in ('conservative', 'balanced', 'aggressive')),
  time_horizon text not null default 'swing' check (time_horizon in ('intraday', 'swing', 'long')),
  updated_at timestamptz not null default now()
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('cron', 'event', 'manual')),
  status text not null check (status in ('planned', 'executed', 'failed', 'skipped')),
  reason text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_agent_runs_idempotency on agent_runs(agent_id, idempotency_key);
create index if not exists idx_agent_runs_agent_created on agent_runs(agent_id, created_at desc);
create index if not exists idx_agent_runs_status on agent_runs(status);

create table if not exists agent_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  action_type text not null,
  plan_payload jsonb not null default '{}'::jsonb,
  risk_check_result jsonb not null default '{}'::jsonb,
  execution_result jsonb not null default '{}'::jsonb,
  tx_signature text,
  pnl_lamports bigint,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_actions_run on agent_actions(run_id);
create index if not exists idx_agent_actions_agent_created on agent_actions(agent_id, created_at desc);
create index if not exists idx_agent_actions_status on agent_actions(status);

create table if not exists agent_reputation_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  source text not null check (source in ('trade_result', 'uptime', 'risk_violation', 'owner_feedback', 'sale', 'run_result')),
  xp_delta integer not null default 0,
  rep_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_rep_events_agent_created on agent_reputation_events(agent_id, created_at desc);
create index if not exists idx_agent_rep_events_source on agent_reputation_events(source);

create table if not exists agent_reputation_snapshots (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  xp_total integer not null default 0,
  reputation_score integer not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  window_7d jsonb not null default '{}'::jsonb,
  window_30d jsonb not null default '{}'::jsonb,
  window_90d jsonb not null default '{}'::jsonb,
  arweave_uri text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_rep_snaps_agent_created on agent_reputation_snapshots(agent_id, created_at desc);

