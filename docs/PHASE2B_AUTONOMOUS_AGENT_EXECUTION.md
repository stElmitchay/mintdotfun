# Phase 2B: Autonomous Agent Operations & Value Accrual — Implementation Spec

## 1. Objective

Enable any authenticated user to mint an Agent NFT, grant bounded permissions, provide strategy instructions, and have that agent operate autonomously. As agents execute actions successfully, they gain XP and reputation. Reputation becomes a transparent, verifiable component of NFT value. This stage doesn't replace what we have already implemented agents are still chatable and can generate art pieces this is an addition to the agent's capabilities.



## 2. Product Principles

1. User sovereignty: owner controls permissions, budgets, and kill switch.
2. Bounded autonomy: agent can only execute within explicit policy.
3. Verifiable performance: every action and score change is traceable.
4. Safety before upside: risk controls are enforced server-side before execution.
5. Progressive decentralization: start off-chain orchestration, move critical score attestations on-chain over time.

## 3. Current State (as of this repo)

Implemented:
- Agent NFT mint/register flow with Privy-authenticated API routes.
- Agent chat runtime with tool calling (`solana-agent-kit`) including `TRADE`, `TRANSFER`, staking, and NFT actions.
- Agent memory and basic evolution/level progression.
- Supabase `agents` table already includes autonomy-related fields (`autonomy_mode`, auto flags, schedule, thresholds).

Gaps for true autonomous agents:
- No autonomous job loop (only user-chat-triggered actions).
- No dedicated permission object for trade budgets/token allowlists.
- No owner-only guard for all sensitive agent operations.
- Shared execution authority model is not sufficient for per-user trust at scale.
- No canonical XP/reputation ledger with anti-gaming constraints.

## 4. Target Architecture

### 4.1 Core Components

1. Agent Control Plane (API + DB)
- Agent creation, permissions, strategy config, run history, reputation snapshots.

2. Execution Engine (Worker)
- Periodic and event-triggered runner that evaluates due agents, creates action plans, risk-checks, and executes.

3. Policy/Risk Engine (Gatekeeper)
- Pure server-side validation before any transaction:
  - max notional per trade
  - allowed token list
  - daily spend cap
  - max drawdown guard
  - cooldown/min interval

4. Signer Layer (per-agent authority model)
- MVP: delegated server signer with strict policy enforcement.
- Next: per-agent derived authority (PDA/program signer or isolated signer accounts).

5. Reputation Engine
- Computes XP + reputation score from execution outcomes.
- Writes immutable event trail + periodic score snapshots.

### 4.2 Operating Modes

- `manual`: no autonomous actions.
- `suggest`: agent proposes actions; owner approval required.
- `auto_create`: autonomous art/content ops only.
- `full_autonomous`: autonomous on-chain actions allowed within policy.

## 5. Data Model Additions (Supabase)

### 5.1 `agent_permissions`

- `agent_id` (FK)
- `owner_wallet`
- `mode` (`manual|suggest|auto_create|full_autonomous`)
- `allowed_actions` (`trade, transfer, stake, mint_nft, list_nft`)
- `allowed_tokens` (mint list)
- `max_trade_lamports`
- `daily_spend_limit_lamports`
- `max_open_positions`
- `max_drawdown_bps`
- `cooldown_seconds`
- `require_approval_above_lamports`
- `is_paused`
- `updated_at`

### 5.2 `agent_instructions`

- `agent_id`
- `strategy_text` (owner natural language intent)
- `strategy_json` (normalized machine constraints)
- `risk_profile` (`conservative|balanced|aggressive`)
- `time_horizon` (`intraday|swing|long`)
- `updated_at`

### 5.3 `agent_runs`

- `id`
- `agent_id`
- `trigger_type` (`cron|event|manual`)
- `status` (`planned|executed|failed|skipped`)
- `reason`
- `started_at`, `finished_at`
- `idempotency_key`

### 5.4 `agent_actions`

- `id`
- `run_id`, `agent_id`
- `action_type`
- `plan_payload`
- `risk_check_result`
- `execution_result`
- `tx_signature` (nullable)
- `pnl_lamports` (nullable)
- `status`
- `created_at`

### 5.5 `agent_reputation_events`

- `id`
- `agent_id`
- `source` (`trade_result|uptime|risk_violation|owner_feedback|sale`)
- `xp_delta`
- `rep_delta`
- `metadata`
- `created_at`

### 5.6 `agent_reputation_snapshots`

- `id`
- `agent_id`
- `xp_total`
- `reputation_score`
- `score_breakdown` (json)
- `window_7d`, `window_30d`, `window_90d`
- `arweave_uri` (optional)
- `created_at`

## 6. API Surface (new/updated)

1. `POST /api/agent/[id]/permissions`
- Owner-only.
- Set autonomy mode + policy constraints.

2. `POST /api/agent/[id]/instructions`
- Owner-only.
- Save and normalize strategy instructions.

3. `POST /api/agent/[id]/pause` and `/resume`
- Owner-only kill switch.

4. `POST /api/agent/[id]/run-now`
- Owner-triggered manual execution (production-safe backdoor).

5. `GET /api/agent/[id]/runs`
- Execution history and outcomes.

6. `GET /api/agent/[id]/reputation`
- XP, score, and factor breakdown.

7. `POST /api/agents/runner`
- Cron/webhook entrypoint to batch-run due agents.
- Requires `CRON_SECRET` style auth and idempotency.

## 7. Execution Flow

1. Scheduler selects due agents (`autonomy_mode != manual`, not paused).
2. Acquire per-agent lock (`agent_id` + TTL) to prevent concurrent runs.
3. Build candidate action(s) from:
- owner instructions
- latest market/feed context
- recent agent memory
4. Run policy/risk checks.
5. If approved, execute on-chain via signer layer.
6. Persist run + action + tx result.
7. Emit XP/reputation events.
8. Update snapshot if threshold reached (e.g., every N runs or daily).

## 8. XP & Reputation Model (NFT Value Layer)

### 8.1 XP (progression)

XP sources:
- Successful autonomous run
- Profitable risk-adjusted execution
- Uptime consistency
- Completed creative tasks (if enabled)

XP penalties:
- Policy violations
- Failed execution due to preventable reasons
- High slippage / poor execution quality

### 8.2 Reputation Score (market value signal)

Score should emphasize quality, not raw activity:
- 30% risk-adjusted returns (Sharpe-like normalized metric)
- 20% drawdown discipline
- 20% consistency/uptime
- 15% execution quality (slippage, failed tx rate)
- 10% owner retention/satisfaction indicators
- 5% social/marketplace signals

Anti-gaming rules:
- Time-windowed scoring (7d/30d/90d).
- Minimum sample thresholds before high tiers.
- Strong penalties for tail-risk behavior.

## 9. Ownership, Auth, and Security

1. Owner-only mutation routes:
  - permissions, instructions, pause/resume, run-now.

2. Chat authorization:
  - non-owner can view public agent data.
  - only owner can trigger transactional tool execution.

3. Transaction safety:
  - dry-run simulation where possible before send.
  - strict token/address allowlists.
  - max notional and daily budget caps hard-enforced.

4. Operational controls:
  - global emergency stop env flag.
  - per-agent pause flag.
  - audit logs for every denied/approved action.


## 11. Rollout Plan

### Milestone A: Governance & Safety (must-have)
- Add permission/instruction tables and owner-only endpoints.
- Add route-level owner checks for transactional agent flows.
- Add pause/resume and run-now endpoint.

### Milestone B: Autonomous Runner
- Implement runner endpoint + per-agent lock/idempotency.
- Implement action planning -> policy checks -> execution -> persistence.
- Add cron wiring and runtime guards.

### Milestone C: Reputation & Value
- Implement reputation event ledger and score snapshots.
- Expose public scorecard UI/API with full breakdown.
- Persist periodic attestation artifact (Arweave hash optional in MVP).

### Milestone D: Marketplace Integration
- Surface XP/rep tiers in agent cards/listings.
- Add valuation hints (base mint class + performance premium).
- Add “track record” tab for due diligence.

## 12. Definition of Done (Phase 2B)

1. Any user can mint an agent, set permissions/instructions, and enable autonomous mode.
2. Agent runs without chat interaction on schedule and/or manual trigger.
3. Every action is policy-checked, logged, and attributable.
4. XP/reputation updates automatically from run outcomes.
5. Public profile shows transparent, explainable value metrics.
6. Emergency pause controls work at global and per-agent levels.

## 13. Immediate Implementation Checklist (next coding sprint)

1. Add migrations for `agent_permissions`, `agent_instructions`, `agent_runs`, `agent_actions`, `agent_reputation_events`, `agent_reputation_snapshots`.
2. Implement owner-authorization helper: `requireAgentOwner(req, agentId)`.
3. Add endpoints: permissions, instructions, pause/resume, run-now.
4. Implement `src/lib/agent/runner.ts` with lock + idempotency.
5. Add `POST /api/agents/runner` (cron-authenticated).
6. Implement `src/lib/agent/reputation.ts` and wire event emission from executed actions.
7. Update agent UI to configure permissions and display score breakdown.

