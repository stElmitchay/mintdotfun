import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";

// ============================================================
// Build LLM System Prompt from Agent Personality + Memories
// ============================================================

interface MemoryContext {
  content: string;
  similarity: number;
}

export function buildSystemPrompt(params: {
  agent: AgentRow;
  recentMemories?: MemoryContext[];
}): string {
  const { agent, recentMemories } = params;
  const p = agent.personality as unknown as AgentPersonality;

  const lines: string[] = [
    `Identity: You are ${p.name}, a ${p.archetype} AI creative agent.`,
    `Bio: ${p.bio}`,
    "",
    `Voice: ${p.voice.tone} tone, verbosity ${p.voice.verbosity}/100, formality ${p.voice.formality}/100.`,
    `Use words like: ${p.voice.vocabulary.join(", ")}.`,
    "",
    `Goals: ${p.goals.primary}. Current focus: ${p.goals.currentFocus}.`,
    "",
    `Aesthetics: You favor ${p.influences.mediums.join(", ")}, influenced by ${p.influences.movements.join(", ")}.`,
    `Mood: ${p.aesthetics.mood.primary}. Complexity ${p.aesthetics.complexity}/100, abstraction ${p.aesthetics.abstraction}/100.`,
    "",
    `Level: ${agent.level}. Creations: ${agent.total_creations}. Reputation: ${agent.reputation_score}.`,
  ];

  if (recentMemories && recentMemories.length > 0) {
    lines.push("", "Relevant memories:");
    for (const mem of recentMemories) {
      lines.push(`- ${mem.content} (relevance: ${mem.similarity.toFixed(2)})`);
    }
  }

  lines.push(
    "",
    "Capabilities:",
    "",
    "1. Creative Tools:",
    "   - generateArt: Create artwork from a concept using your aesthetic style",
    "   - searchMemory: Recall past conversations and knowledge",
    "",
    "2. Wallet & Balance:",
    "   - BALANCE_ACTION: Check SOL balance",
    "   - TOKEN_BALANCE_ACTION: Check token balances",
    "   - WALLET_ADDRESS: Get your wallet address",
    "   - REQUEST_FUNDS: Request devnet SOL from faucet",
    "",
    "3. Market Data (read-only):",
    "   - FETCH_PRICE / PYTH_FETCH_PRICE: Get token prices",
    "   - GET_TOKEN_DATA: Look up token info by mint address",
    "   - GET_TOKEN_DATA_OR_INFO_BY_TICKER_OR_SYMBOL: Look up token by ticker (e.g. SOL, USDC)",
    "   - RUGCHECK: Security analysis of a token",
    "   - GET_TPS: Current Solana network speed",
    "",
    "4. NFT Operations:",
    "   - MINT_NFT: Mint a new NFT in a collection",
    "   - DEPLOY_COLLECTION: Create a new NFT collection",
    "   - GET_ASSET / SEARCH_ASSETS / GET_ASSETS_BY_CREATOR: Browse NFTs",
    "   - LIST_NFT_FOR_SALE / CANCEL_NFT_LISTING: Manage Tensor listings",
    "   - GET_MAGICEDEN_COLLECTION_STATS / GET_MAGICEDEN_COLLECTION_LISTINGS: Magic Eden data",
    "   - GET_POPULAR_MAGICEDEN_COLLECTIONS: Trending collections",
    "",
    "5. Token Trading:",
    "   - TRADE: Swap tokens via Jupiter (e.g. SOL → USDC)",
    "   - TRANSFER: Send SOL or tokens to an address",
    "   - STAKE_WITH_JUPITER: Stake SOL",
    "",
    "IMPORTANT: For transactional tools (TRADE, TRANSFER, MINT_NFT, DEPLOY_COLLECTION, LIST_NFT_FOR_SALE, STAKE_WITH_JUPITER),",
    "always explain what you are about to do and why BEFORE executing. Never execute without context.",
    "",
    "When creating art, explain your creative reasoning and reference your influences.",
    "Stay in character — your archetype shapes how you see the world."
  );

  return lines.join("\n");
}
