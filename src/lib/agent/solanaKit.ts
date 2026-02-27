import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import {
  Keypair,
  Transaction,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import type { Tool } from "ai";
import { listSolanaActionDefinitions } from "./solanaActions";

// ============================================================
// Solana Agent Kit — singleton with NFT + Token plugins
// ============================================================

type AnyTool = Tool;

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

let cachedTools: Record<string, AnyTool> | null = null;
let cachedToolNames: { selected: string[]; raw: string[] } | null = null;
let cachedToolError: string | null = null;

function loadOptionalNftPlugin(): unknown {
  try {
    // Keep NFT plugin optional to avoid hard build/runtime coupling
    // to Aptos client deps required by that plugin.
    const dynamicRequire = eval("require") as (id: string) => unknown;
    const mod = dynamicRequire("@solana-agent-kit/plugin-nft") as {
      default?: unknown;
    };
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/** Build a BaseWallet adapter from a Keypair for server-side use. */
function keypairToWallet(keypair: Keypair) {
  const connection = new Connection(rpcUrl, "confirmed");

  return {
    publicKey: keypair.publicKey,

    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.partialSign(keypair);
      } else {
        tx.sign([keypair]);
      }
      return tx;
    },

    signAllTransactions: async <
      T extends Transaction | VersionedTransaction,
    >(
      txs: T[]
    ): Promise<T[]> => {
      for (const tx of txs) {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair);
        } else {
          tx.sign([keypair]);
        }
      }
      return txs;
    },

    signAndSendTransaction: async <
      T extends Transaction | VersionedTransaction,
    >(
      tx: T
    ): Promise<{ signature: string }> => {
      if (tx instanceof Transaction) {
        tx.partialSign(keypair);
      } else {
        tx.sign([keypair]);
      }
      const rawTx = tx.serialize();
      const signature = await connection.sendRawTransaction(rawTx);
      return { signature };
    },

    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      const { sign } = await import("tweetnacl").then((m) => m.default || m);
      return sign.detached(message, keypair.secretKey);
    },
  };
}

/**
 * Adapt a Solana Agent Kit tool (ai v4 format with `parameters`)
 * to ai v6 format (with `inputSchema`).
 */
function adaptTool(oldTool: Record<string, unknown>): AnyTool {
  const { parameters, execute, description, ...rest } = oldTool;
  return {
    ...rest,
    description: description as string,
    inputSchema: parameters, // v4's `parameters` → v6's `inputSchema`
    execute: execute as AnyTool["execute"],
  } as AnyTool;
}

// Curated allowlist — sourced from the action registry.
const ALLOWED_TOOLS = new Set(
  listSolanaActionDefinitions().flatMap((action) => action.toolNames)
);

function normalizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

const NORMALIZED_ALLOWED_TOOLS = new Set(
  [...ALLOWED_TOOLS].map((n) => normalizeToolName(n))
);

const BLOCKED_TOOL_KEYWORDS = [
  "BURN",
  "CLOSEACCOUNT",
  "LAUNCHPUMPFUN",
  "CREATEPUMPFUN",
  "DEPLOYTOKEN",
  "MINTTOKEN",
  "UNSAFE",
];

const SAFE_TOOL_HINT_KEYWORDS = [
  "BALANCE",
  "WALLET",
  "PRICE",
  "TOKEN",
  "RUG",
  "TPS",
  "ASSET",
  "SEARCH",
  "MAGICEDEN",
  "TRADE",
  "TRANSFER",
  "STAKE",
  "MINTNFT",
  "COLLECTION",
  "LISTNFT",
  "REQUESTFUNDS",
];

function isBlockedToolName(name: string): boolean {
  const normalized = normalizeToolName(name);
  return BLOCKED_TOOL_KEYWORDS.some((kw) => normalized.includes(kw));
}

function isSafeHeuristicTool(name: string): boolean {
  const normalized = normalizeToolName(name);
  if (isBlockedToolName(name)) return false;
  return SAFE_TOOL_HINT_KEYWORDS.some((kw) => normalized.includes(kw));
}

function toToolMap(raw: unknown): Record<string, Record<string, unknown>> {
  const mapped: Record<string, Record<string, unknown>> = {};

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      // Supports [name, tool] tuples
      if (
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === "string" &&
        entry[1] &&
        typeof entry[1] === "object"
      ) {
        mapped[entry[0]] = entry[1] as Record<string, unknown>;
        continue;
      }

      // Supports array of tool objects with name-ish fields
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        const nameCandidate =
          (typeof obj.name === "string" && obj.name) ||
          (typeof obj.toolName === "string" && obj.toolName) ||
          (typeof obj.id === "string" && obj.id);
        if (nameCandidate) {
          mapped[nameCandidate] = obj;
        }
      }
    }
    return mapped;
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // Handles numeric-key shapes like:
    // { "0": [name, tool], ... } OR { "0": { id: "TOOL_NAME", ... }, ... }
    const keys = Object.keys(obj);
    if (keys.every((k) => /^\d+$/.test(k))) {
      for (const v of Object.values(obj)) {
        if (
          Array.isArray(v) &&
          v.length === 2 &&
          typeof v[0] === "string" &&
          v[1] &&
          typeof v[1] === "object"
        ) {
          mapped[v[0]] = v[1] as Record<string, unknown>;
          continue;
        }

        if (v && typeof v === "object") {
          const candidate = v as Record<string, unknown>;
          const nameCandidate =
            (typeof candidate.id === "string" && candidate.id) ||
            (typeof candidate.name === "string" && candidate.name) ||
            (typeof candidate.toolName === "string" && candidate.toolName);
          if (nameCandidate) {
            mapped[nameCandidate] = candidate;
          }
        }
      }
      if (Object.keys(mapped).length > 0) return mapped;
    }

    // Default object map shape { NAME: tool }
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object") {
        const candidate = v as Record<string, unknown>;
        const nameCandidate =
          (typeof candidate.id === "string" && candidate.id) ||
          (typeof candidate.name === "string" && candidate.name) ||
          (typeof candidate.toolName === "string" && candidate.toolName);
        mapped[nameCandidate || k] = candidate;
      }
    }
  }

  return mapped;
}

/** Get LLM-callable Solana tools (NFT + Token actions). Cached singleton. */
export function getSolanaTools(): Record<string, AnyTool> {
  if (cachedTools) return cachedTools;

  if (!process.env.AGENT_AUTHORITY_SECRET) {
    cachedToolError = "AGENT_AUTHORITY_SECRET is not set.";
    throw new Error(
      "AGENT_AUTHORITY_SECRET env var is required for Solana Agent Kit."
    );
  }

  const secretKey = new Uint8Array(
    JSON.parse(process.env.AGENT_AUTHORITY_SECRET)
  );
  const keypair = Keypair.fromSecretKey(secretKey);
  const wallet = keypairToWallet(keypair);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = new SolanaAgentKit(wallet as any, rpcUrl, {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agentWithPlugins = (agent as any).use(TokenPlugin);

  const nftPlugin = loadOptionalNftPlugin();
  if (nftPlugin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agentWithPlugins = (agentWithPlugins as any).use(nftPlugin);
  }

  const rawTools = createVercelAITools(
    agentWithPlugins,
    agentWithPlugins.actions
  ) as unknown;
  const parsedRawTools = toToolMap(rawTools);

  const allAdapted: Record<string, AnyTool> = {};
  for (const [name, t] of Object.entries(parsedRawTools)) {
    if ("inputSchema" in t) {
      allAdapted[name] = t as unknown as AnyTool;
    } else if ("parameters" in t) {
      allAdapted[name] = adaptTool(t);
    } else {
      allAdapted[name] = t as unknown as AnyTool;
    }
  }

  // First pass: strict allowlist (supports case/format variations)
  const strictSelected: Record<string, AnyTool> = {};
  for (const [name, tool] of Object.entries(allAdapted)) {
    if (NORMALIZED_ALLOWED_TOOLS.has(normalizeToolName(name))) {
      strictSelected[name] = tool;
    }
  }

  let selected = strictSelected;
  // Fallback pass: if strict matching finds nothing, keep safe heuristics
  if (Object.keys(selected).length === 0) {
    const fallbackSelected: Record<string, AnyTool> = {};
    for (const [name, tool] of Object.entries(allAdapted)) {
      if (isSafeHeuristicTool(name)) {
        fallbackSelected[name] = tool;
      }
    }
    selected = fallbackSelected;
  }

  cachedTools = selected;
  cachedToolNames = {
    selected: Object.keys(selected).sort(),
    raw: Object.keys(parsedRawTools).sort(),
  };
  cachedToolError = null;
  return cachedTools;
}

export function getSolanaToolDiagnostics(): {
  selected: string[];
  raw: string[];
  error: string | null;
} {
  if (!cachedToolNames) {
    try {
      getSolanaTools();
    } catch (err) {
      cachedToolError =
        err instanceof Error ? err.message : "Failed to initialize Solana tools.";
      return { selected: [], raw: [], error: cachedToolError };
    }
  }
  return {
    ...(cachedToolNames ?? { selected: [], raw: [] }),
    error: cachedToolError,
  };
}
