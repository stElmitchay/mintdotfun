"use client";

import { useState } from "react";
import {
  Image,
  Brain,
  ChevronDown,
  ChevronUp,
  Wrench,
  Wallet,
  TrendingUp,
  Shield,
  ExternalLink,
  ArrowRightLeft,
  Coins,
  LayoutGrid,
  Tag,
} from "lucide-react";

interface ToolResultCardProps {
  toolName: string;
  state: string;
  result?: unknown;
  args?: Record<string, unknown>;
}

// Tool name → friendly label for the loading state
const TOOL_LABELS: Record<string, string> = {
  BALANCE_ACTION: "Checking balance",
  TOKEN_BALANCE_ACTION: "Checking token balances",
  WALLET_ADDRESS: "Getting wallet address",
  FETCH_PRICE: "Fetching price",
  PYTH_FETCH_PRICE: "Fetching price",
  GET_TOKEN_DATA: "Looking up token",
  GET_TOKEN_DATA_OR_INFO_BY_TICKER_OR_SYMBOL: "Looking up token",
  GET_TPS: "Checking network speed",
  RUGCHECK: "Running security check",
  GET_ASSET: "Fetching asset",
  GET_ASSETS_BY_CREATOR: "Searching assets",
  SEARCH_ASSETS: "Searching assets",
  TRADE: "Executing swap",
  TRANSFER: "Sending transfer",
  STAKE_WITH_JUPITER: "Staking SOL",
  MINT_NFT: "Minting NFT",
  DEPLOY_COLLECTION: "Deploying collection",
  LIST_NFT_FOR_SALE: "Listing for sale",
  CANCEL_NFT_LISTING: "Cancelling listing",
  REQUEST_FUNDS: "Requesting funds",
  GET_MAGICEDEN_COLLECTION_STATS: "Fetching collection stats",
  GET_POPULAR_MAGICEDEN_COLLECTIONS: "Fetching trending collections",
  GET_MAGICEDEN_COLLECTION_LISTINGS: "Fetching listings",
};

const BALANCE_TOOLS = new Set(["BALANCE_ACTION", "TOKEN_BALANCE_ACTION", "WALLET_ADDRESS", "REQUEST_FUNDS"]);
const PRICE_TOOLS = new Set(["FETCH_PRICE", "PYTH_FETCH_PRICE", "GET_TOKEN_DATA", "GET_TOKEN_DATA_OR_INFO_BY_TICKER_OR_SYMBOL", "RUGCHECK", "GET_TPS"]);
const TX_TOOLS = new Set(["TRADE", "TRANSFER", "STAKE_WITH_JUPITER"]);
const NFT_TOOLS = new Set(["GET_ASSET", "GET_ASSETS_BY_CREATOR", "SEARCH_ASSETS", "MINT_NFT", "DEPLOY_COLLECTION"]);
const MARKET_TOOLS = new Set(["LIST_NFT_FOR_SALE", "CANCEL_NFT_LISTING", "GET_MAGICEDEN_COLLECTION_STATS", "GET_POPULAR_MAGICEDEN_COLLECTIONS", "GET_MAGICEDEN_COLLECTION_LISTINGS"]);

function shortenHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatValue(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "number") return val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return String(val);
}

export default function ToolResultCard({ toolName, state, result, args }: ToolResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Loading state
  if (state !== "result") {
    const label = TOOL_LABELS[toolName] || `Using ${toolName}`;
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-3 text-gray-9 text-xs">
        <Wrench className="w-3.5 h-3.5 animate-spin" />
        <span>{label}...</span>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = result as Record<string, any> | undefined;

  // ── generateArt ──
  if (toolName === "generateArt") {
    const imageUrl = res?.imageUrl as string | undefined;
    const prompt = (args?.prompt as string) || (res?.prompt as string) || "";
    const artworkId = res?.artworkId as string | undefined;

    return (
      <div className="rounded-xl overflow-hidden bg-gray-3 max-w-sm">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full aspect-square object-cover animate-in fade-in duration-700"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-4 flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-7" />
          </div>
        )}
        <div className="px-3 py-2.5 space-y-1">
          {prompt && <p className="text-xs text-gray-9 line-clamp-2">{prompt}</p>}
          {artworkId && <p className="text-[10px] text-gray-7 font-mono">{artworkId}</p>}
        </div>
      </div>
    );
  }

  // ── searchMemory ──
  if (toolName === "searchMemory") {
    const memories = (res?.memories ?? res?.results ?? []) as Array<{
      content?: string;
      similarity?: number;
    }>;

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-9 hover:text-gray-11 transition-colors"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Recalled {memories.length} memories</span>
          {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
        </button>
        {expanded && memories.length > 0 && (
          <div className="px-3 pb-2.5 space-y-1.5">
            {memories.map((m, i) => (
              <div key={i} className="text-xs text-gray-9 flex gap-2">
                <span className="text-gray-7 shrink-0">
                  {m.similarity != null ? `${Math.round(m.similarity * 100)}%` : ""}
                </span>
                <span className="line-clamp-2">{m.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Balance / Wallet tools ──
  if (BALANCE_TOOLS.has(toolName)) {
    const balance = res?.balance ?? res?.sol ?? res?.amount;
    const address = res?.address ?? res?.wallet ?? res?.publicKey;
    const tokens = res?.tokens as Array<Record<string, unknown>> | undefined;
    const signature = res?.signature as string | undefined;

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <Wallet className="w-3.5 h-3.5 text-accent" />
          {balance != null && <span className="font-semibold">{formatValue(balance)} SOL</span>}
          {address && !balance && (
            <span className="font-mono text-gray-9">{shortenHash(String(address))}</span>
          )}
          {signature && <span className="text-gray-9">Funded</span>}
        </div>
        {tokens && tokens.length > 0 && (
          <div className="space-y-1 mt-1">
            {tokens.slice(0, 5).map((t, i) => (
              <div key={i} className="flex justify-between text-[11px] text-gray-9">
                <span>{String(t.symbol || t.name || t.mint || "Token")}</span>
                <span>{formatValue(t.balance ?? t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Price / Data / Security tools ──
  if (PRICE_TOOLS.has(toolName)) {
    const price = res?.price ?? res?.priceInUSDC;
    const name = res?.name ?? res?.symbol ?? res?.token;
    const tps = res?.tps;
    const isSecure = res?.isSecure ?? res?.safe;
    const riskLevel = res?.riskLevel ?? res?.risk;

    if (toolName === "GET_TPS" && tps != null) {
      return (
        <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 flex items-center gap-2 text-xs text-gray-11">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold">{formatValue(tps)} TPS</span>
          <span className="text-gray-8">Solana Network</span>
        </div>
      );
    }

    if (toolName === "RUGCHECK") {
      return (
        <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">Security Check</span>
          </div>
          {riskLevel && <p className="text-[11px] text-gray-9">Risk: {String(riskLevel)}</p>}
          {isSecure != null && (
            <p className="text-[11px] text-gray-9">{isSecure ? "Appears safe" : "Potential risks detected"}</p>
          )}
          {res?.message && <p className="text-[11px] text-gray-8 line-clamp-3">{String(res.message)}</p>}
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          {name && <span className="font-semibold">{String(name)}</span>}
          {price != null && <span className="text-accent">${formatValue(price)}</span>}
        </div>
        {res?.decimals != null && <p className="text-[11px] text-gray-8">Decimals: {String(res.decimals)}</p>}
        {res?.supply != null && <p className="text-[11px] text-gray-8">Supply: {formatValue(res.supply)}</p>}
      </div>
    );
  }

  // ── Transaction tools (TRADE, TRANSFER, STAKE) ──
  if (TX_TOOLS.has(toolName)) {
    const signature = res?.signature ?? res?.tx ?? res?.transactionHash ?? res?.txid;
    const status = res?.status ?? (signature ? "confirmed" : "completed");

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold capitalize">{toolName === "TRADE" ? "Swap" : toolName === "TRANSFER" ? "Transfer" : "Stake"}</span>
          <span className="text-[10px] text-gray-8 capitalize">{String(status)}</span>
        </div>
        {signature && (
          <a
            href={`https://solscan.io/tx/${String(signature)}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-accent hover:underline"
          >
            <span className="font-mono">{shortenHash(String(signature))}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  // ── NFT / Asset tools ──
  if (NFT_TOOLS.has(toolName)) {
    const assetName = res?.name ?? res?.content?.metadata?.name;
    const assetId = res?.id ?? res?.assetId ?? res?.mint ?? res?.signature;
    const imageUri = res?.content?.links?.image ?? res?.image;
    const items = res?.items ?? res?.assets;

    if (Array.isArray(items) && items.length > 0) {
      return (
        <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <LayoutGrid className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">{items.length} assets found</span>
          </div>
          {items.slice(0, 3).map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="text-[11px] text-gray-9 truncate">
              {String(item.name || item.id || `Asset ${i + 1}`)}
            </div>
          ))}
          {items.length > 3 && <p className="text-[10px] text-gray-7">+{items.length - 3} more</p>}
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <Coins className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold">{assetName ? String(assetName) : "NFT"}</span>
        </div>
        {imageUri && (
          <img src={String(imageUri)} alt="" className="w-full rounded-lg aspect-square object-cover" />
        )}
        {assetId && (
          <p className="text-[10px] text-gray-7 font-mono truncate">{shortenHash(String(assetId))}</p>
        )}
      </div>
    );
  }

  // ── Marketplace tools ──
  if (MARKET_TOOLS.has(toolName)) {
    const collectionName = res?.name ?? res?.collectionName ?? res?.symbol;
    const floorPrice = res?.floorPrice ?? res?.fp;
    const volume = res?.volume ?? res?.volumeAll;
    const listings = res?.listings ?? res?.items;
    const signature = res?.signature ?? res?.tx;

    if (signature) {
      return (
        <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <Tag className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">{toolName === "LIST_NFT_FOR_SALE" ? "Listed" : "Listing cancelled"}</span>
          </div>
          <a
            href={`https://solscan.io/tx/${String(signature)}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-accent hover:underline"
          >
            <span className="font-mono">{shortenHash(String(signature))}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
    }

    if (Array.isArray(listings) && listings.length > 0) {
      return (
        <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <LayoutGrid className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">{collectionName ? String(collectionName) : "Collection"}</span>
          </div>
          <p className="text-[11px] text-gray-9">{listings.length} listings</p>
          {floorPrice != null && <p className="text-[11px] text-gray-9">Floor: {formatValue(floorPrice)} SOL</p>}
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <Tag className="w-3.5 h-3.5 text-accent" />
          <span className="font-semibold">{collectionName ? String(collectionName) : "Market Data"}</span>
        </div>
        {floorPrice != null && <p className="text-[11px] text-gray-9">Floor: {formatValue(floorPrice)} SOL</p>}
        {volume != null && <p className="text-[11px] text-gray-9">Volume: {formatValue(volume)} SOL</p>}
      </div>
    );
  }

  // ── Generic fallback ──
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-3 text-gray-9 text-xs">
      <Wrench className="w-3.5 h-3.5" />
      <span>{toolName} completed</span>
    </div>
  );
}
