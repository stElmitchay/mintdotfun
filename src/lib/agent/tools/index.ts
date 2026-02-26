import type { Tool } from "ai";
import type { AgentRow } from "@/lib/supabase";
import { createGenerateArtTool } from "./generateArt";
import { createSearchMemoryTool } from "./searchMemory";
import { getSolanaTools } from "../solanaKit";

// ============================================================
// Tool Aggregator — combines custom + Solana Kit tools
// ============================================================

type AnyTool = Tool<any, any>;

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
