export type ActionRisk = "read" | "write";

export interface SolanaActionDefinition {
  id: string;
  label: string;
  risk: ActionRisk;
  aliases: string[];
  toolNames: string[];
}

function normalize(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

const ACTIONS: SolanaActionDefinition[] = [
  {
    id: "wallet_address",
    label: "Wallet Address",
    risk: "read",
    aliases: ["wallet_address", "wallet", "address"],
    toolNames: ["WALLET_ADDRESS"],
  },
  {
    id: "balance",
    label: "SOL Balance",
    risk: "read",
    aliases: ["balance", "sol_balance"],
    toolNames: ["BALANCE_ACTION"],
  },
  {
    id: "token_balance",
    label: "Token Balance",
    risk: "read",
    aliases: ["token_balance", "balances"],
    toolNames: ["TOKEN_BALANCE_ACTION"],
  },
  {
    id: "fetch_price",
    label: "Price Fetch",
    risk: "read",
    aliases: ["fetch_price", "price", "prices"],
    toolNames: ["FETCH_PRICE", "PYTH_FETCH_PRICE"],
  },
  {
    id: "token_info",
    label: "Token Info",
    risk: "read",
    aliases: ["token_info", "token_data", "lookup_token"],
    toolNames: ["GET_TOKEN_DATA", "GET_TOKEN_DATA_OR_INFO_BY_TICKER_OR_SYMBOL"],
  },
  {
    id: "rugcheck",
    label: "Rugcheck",
    risk: "read",
    aliases: ["rugcheck", "risk_check"],
    toolNames: ["RUGCHECK"],
  },
  {
    id: "network_tps",
    label: "Network TPS",
    risk: "read",
    aliases: ["network_tps", "tps"],
    toolNames: ["GET_TPS"],
  },
  {
    id: "get_asset",
    label: "Get Asset",
    risk: "read",
    aliases: ["get_asset", "asset"],
    toolNames: ["GET_ASSET"],
  },
  {
    id: "search_assets",
    label: "Search Assets",
    risk: "read",
    aliases: ["search_assets", "nft_search"],
    toolNames: ["SEARCH_ASSETS", "GET_ASSETS_BY_CREATOR"],
  },
  {
    id: "collection_stats",
    label: "Collection Stats",
    risk: "read",
    aliases: ["collection_stats", "me_stats"],
    toolNames: [
      "GET_MAGICEDEN_COLLECTION_STATS",
      "GET_POPULAR_MAGICEDEN_COLLECTIONS",
      "GET_MAGICEDEN_COLLECTION_LISTINGS",
    ],
  },
  {
    id: "request_funds",
    label: "Request Devnet Funds",
    risk: "write",
    aliases: ["request_funds", "faucet"],
    toolNames: ["REQUEST_FUNDS"],
  },
  {
    id: "trade",
    label: "Token Trade",
    risk: "write",
    aliases: ["trade", "swap"],
    toolNames: ["TRADE"],
  },
  {
    id: "transfer",
    label: "Transfer",
    risk: "write",
    aliases: ["transfer", "send"],
    toolNames: ["TRANSFER"],
  },
  {
    id: "stake",
    label: "Stake",
    risk: "write",
    aliases: ["stake", "stake_with_jupiter"],
    toolNames: ["STAKE_WITH_JUPITER"],
  },
  {
    id: "mint_nft",
    label: "Mint NFT",
    risk: "write",
    aliases: ["mint_nft", "mint"],
    toolNames: ["MINT_NFT"],
  },
  {
    id: "deploy_collection",
    label: "Deploy Collection",
    risk: "write",
    aliases: ["deploy_collection", "create_collection", "collection_create"],
    toolNames: ["DEPLOY_COLLECTION"],
  },
  {
    id: "list_nft",
    label: "List NFT",
    risk: "write",
    aliases: ["list_nft", "list_nft_for_sale", "list"],
    toolNames: ["LIST_NFT_FOR_SALE"],
  },
  {
    id: "cancel_nft_listing",
    label: "Cancel NFT Listing",
    risk: "write",
    aliases: ["cancel_nft_listing", "cancel_listing", "delist"],
    toolNames: ["CANCEL_NFT_LISTING"],
  },
];

const TOOL_TO_ACTION = new Map<string, string>();
const ALIAS_TO_ACTION = new Map<string, string>();
const TRANSACTIONAL_ACTION_IDS = new Set<string>();
const READ_ACTION_IDS = new Set<string>();

for (const action of ACTIONS) {
  if (action.risk === "write") TRANSACTIONAL_ACTION_IDS.add(action.id);
  if (action.risk === "read") READ_ACTION_IDS.add(action.id);
  for (const toolName of action.toolNames) {
    TOOL_TO_ACTION.set(normalize(toolName), action.id);
  }
  for (const alias of [action.id, ...action.aliases, ...action.toolNames]) {
    ALIAS_TO_ACTION.set(normalize(alias), action.id);
  }
}

export function listSolanaActionDefinitions(): SolanaActionDefinition[] {
  return ACTIONS;
}

export function resolveActionId(value: string): string | null {
  return ALIAS_TO_ACTION.get(normalize(value)) ?? null;
}

export function resolveAllowedActionIds(values: string[] | null | undefined): Set<string> {
  const resolved = new Set<string>();
  if (!values || values.length === 0) return resolved;

  for (const raw of values) {
    const id = resolveActionId(raw);
    if (id) resolved.add(id);
  }
  return resolved;
}

export function findUnresolvedActionValues(
  values: string[] | null | undefined
): string[] {
  if (!values || values.length === 0) return [];
  const unresolved: string[] = [];
  for (const value of values) {
    if (!resolveActionId(value)) unresolved.push(value);
  }
  return unresolved;
}

export function getToolActionId(toolName: string): string | null {
  return TOOL_TO_ACTION.get(normalize(toolName)) ?? null;
}

export function isTransactionalToolName(toolName: string): boolean {
  const actionId = getToolActionId(toolName);
  return actionId ? TRANSACTIONAL_ACTION_IDS.has(actionId) : false;
}

export function isToolEnabledByAllowedActions(
  toolName: string,
  allowedActionIds: Set<string>
): boolean {
  const actionId = getToolActionId(toolName);
  if (!actionId) return false;
  // Read actions are always safe and always enabled.
  if (READ_ACTION_IDS.has(actionId)) return true;
  if (allowedActionIds.size === 0) return true;
  return allowedActionIds.has(actionId);
}
