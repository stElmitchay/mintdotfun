import type { Tool } from "ai";
import type { AgentRow } from "@/lib/supabase";
import { createGenerateArtTool } from "./generateArt";
import { createSearchMemoryTool } from "./searchMemory";
import { getSolanaTools } from "../solanaKit";
import {
  isToolEnabledByAllowedActions,
  isTransactionalToolName,
  resolveAllowedActionIds,
} from "../solanaActions";

// ============================================================
// Tool Aggregator — combines custom + Solana Kit tools
// ============================================================

type AnyTool = Tool;

export function createAgentTools(
  agent: AgentRow
): Record<string, AnyTool> {
  const customTools: Record<string, AnyTool> = {
    generateArt: createGenerateArtTool(agent),
    searchMemory: createSearchMemoryTool(agent),
  };

  // Solana Kit tools (NFT, Token actions)
  let solanaTools: Record<string, AnyTool> = {};
  try {
    solanaTools = getSolanaTools();
  } catch (err) {
    console.warn(
      "[tools] Solana Agent Kit unavailable:",
      err instanceof Error ? err.message : err
    );
  }

  return { ...customTools, ...solanaTools };
}

export interface ToolRestrictionOptions {
  isOwner: boolean;
  allowedActions?: string[];
  isPaused?: boolean;
}

export function restrictToolsForViewer(
  tools: Record<string, AnyTool>,
  options: ToolRestrictionOptions
): Record<string, AnyTool> {
  const allowedActionIds = resolveAllowedActionIds(options.allowedActions);

  const filtered: Record<string, AnyTool> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const isLikelySolanaTool = name === name.toUpperCase() || name.includes("_");
    const isTransactional = isTransactionalToolName(name);
    if (!options.isOwner && isTransactional) continue;
    if (options.isPaused && isTransactional) continue;
    if (
      isLikelySolanaTool &&
      !isToolEnabledByAllowedActions(name, allowedActionIds)
    ) {
      continue;
    }
    filtered[name] = tool;
  }
  return filtered;
}
