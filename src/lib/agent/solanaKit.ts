import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import NFTPlugin from "@solana-agent-kit/plugin-nft";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import {
  Keypair,
  Transaction,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import type { Tool } from "ai";

// ============================================================
// Solana Agent Kit — singleton with NFT + Token plugins
// ============================================================

type AnyTool = Tool<any, any>;

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

let cachedTools: Record<string, AnyTool> | null = null;

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

// Curated allowlist — read-only + useful transactional tools.
// Excludes dangerous ops like BURN, CLOSE_ACCOUNTS, LAUNCH_PUMPFUN, etc.
const ALLOWED_TOOLS = new Set([
  // Read-only: wallet & balance
  "BALANCE_ACTION",
  "TOKEN_BALANCE_ACTION",
  "WALLET_ADDRESS",
  // Read-only: market data
  "FETCH_PRICE",
  "PYTH_FETCH_PRICE",
  "GET_TOKEN_DATA",
  "GET_TOKEN_DATA_OR_INFO_BY_TICKER_OR_SYMBOL",
  "GET_TPS",
  "RUGCHECK",
  // Read-only: NFT / asset queries
  "GET_ASSET",
  "GET_ASSETS_BY_CREATOR",
  "SEARCH_ASSETS",
  // Read-only: marketplace
  "GET_MAGICEDEN_COLLECTION_STATS",
  "GET_POPULAR_MAGICEDEN_COLLECTIONS",
  "GET_MAGICEDEN_COLLECTION_LISTINGS",
  // Transactional: trading & staking
  "TRADE",
  "TRANSFER",
  "STAKE_WITH_JUPITER",
  // Transactional: NFT operations
  "MINT_NFT",
  "DEPLOY_COLLECTION",
  "LIST_NFT_FOR_SALE",
  "CANCEL_NFT_LISTING",
  // Devnet utility
  "REQUEST_FUNDS",
]);

/** Get LLM-callable Solana tools (NFT + Token actions). Cached singleton. */
export function getSolanaTools(): Record<string, AnyTool> {
  if (cachedTools) return cachedTools;

  if (!process.env.AGENT_AUTHORITY_SECRET) {
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
  const agentWithPlugins = (agent as any).use(NFTPlugin).use(TokenPlugin);

  const rawTools = createVercelAITools(
    agentWithPlugins,
    agentWithPlugins.actions
  ) as Record<string, Record<string, unknown>>;

  // Adapt tools if they use the old v4 `parameters` format, then filter
  const adapted: Record<string, AnyTool> = {};
  for (const [name, t] of Object.entries(rawTools)) {
    if (!ALLOWED_TOOLS.has(name)) continue;

    if ("inputSchema" in t) {
      adapted[name] = t as unknown as AnyTool;
    } else if ("parameters" in t) {
      adapted[name] = adaptTool(t);
    } else {
      adapted[name] = t as unknown as AnyTool;
    }
  }

  cachedTools = adapted;
  return cachedTools;
}
