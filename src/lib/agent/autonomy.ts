import { z } from "zod";

export const AutonomyModeSchema = z.enum([
  "manual",
  "suggest",
  "auto_create",
  "full_autonomous",
]);

export const RiskProfileSchema = z.enum([
  "conservative",
  "balanced",
  "aggressive",
]);

export const TimeHorizonSchema = z.enum(["intraday", "swing", "long"]);

export const AgentPermissionInputSchema = z.object({
  mode: AutonomyModeSchema.optional(),
  allowedActions: z.array(z.string().min(1)).optional(),
  allowedTokens: z.array(z.string().min(1)).optional(),
  maxTradeLamports: z.number().int().nonnegative().optional(),
  dailySpendLimitLamports: z.number().int().nonnegative().optional(),
  maxOpenPositions: z.number().int().nonnegative().optional(),
  maxDrawdownBps: z.number().int().nonnegative().optional(),
  cooldownSeconds: z.number().int().nonnegative().optional(),
  requireApprovalAboveLamports: z.number().int().nonnegative().optional(),
});

export const AgentInstructionInputSchema = z.object({
  strategyText: z.string().max(6000).optional(),
  strategyJson: z.record(z.string(), z.unknown()).optional(),
  riskProfile: RiskProfileSchema.optional(),
  timeHorizon: TimeHorizonSchema.optional(),
});

export const AGENT_TRANSACTIONAL_TOOL_NAMES = new Set([
  "TRADE",
  "TRANSFER",
  "STAKE_WITH_JUPITER",
  "MINT_NFT",
  "DEPLOY_COLLECTION",
  "LIST_NFT_FOR_SALE",
  "CANCEL_NFT_LISTING",
]);

export const DEFAULT_PERMISSION_VALUES = {
  mode: "manual" as const,
  allowedActions: [] as string[],
  allowedTokens: [] as string[],
  maxTradeLamports: 0,
  dailySpendLimitLamports: 0,
  maxOpenPositions: 0,
  maxDrawdownBps: 0,
  cooldownSeconds: 0,
  requireApprovalAboveLamports: 0,
  isPaused: false,
};

