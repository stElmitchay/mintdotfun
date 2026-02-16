"use client";

import { ExternalLink, Sparkles, Loader2, RefreshCw, Wallet, Trash2 } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { useOwnedAssets } from "@/hooks/useOwnedAssets";
import { useMintedNFTs } from "@/hooks/useMintedNFTs";
import { shortenAddress } from "@/lib/utils";

export default function GalleryPage() {
  const { umi, connected, walletAddress } = useUmi();
  const { assets, loading: chainLoading, error: chainError, refetch: refetchChain } = useOwnedAssets(umi, walletAddress);
  const { nfts: mintedNFTs, loading: dbLoading, removeNFT } = useMintedNFTs(walletAddress);

  const hasMintedNFTs = mintedNFTs.length > 0;
  const hasOnChainAssets = assets.length > 0;
  const loading = chainLoading || dbLoading;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gallery</h1>
        <p className="mt-2 text-zinc-400">
          Your minted NFTs.
        </p>
      </div>

      {/* On-chain owned assets */}
      {connected && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">On-Chain Assets</h2>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                {shortenAddress(walletAddress || "")}
              </span>
            </div>
            <button
              onClick={refetchChain}
              disabled={chainLoading}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-50"
              title="Refresh from blockchain"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${chainLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {chainLoading && !hasOnChainAssets && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-12 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading assets from blockchain...
            </div>
          )}

          {chainError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {chainError}
            </div>
          )}

          {!chainLoading && !chainError && !hasOnChainAssets && (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-8 text-center text-sm text-zinc-500">
              No mpl-core NFTs found for this wallet on-chain.
            </div>
          )}

          {hasOnChainAssets && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {assets.map((asset) => (
                <a
                  key={asset.address}
                  href={asset.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 transition-all hover:border-violet-500/30"
                >
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-zinc-900 text-zinc-700">
                      <Sparkles className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <p className="text-xs font-medium text-white">
                      {asset.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-zinc-400">
                      {shortenAddress(asset.address, 6)}
                    </p>
                  </div>
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink className="h-3 w-3 text-white" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mint history from database */}
      {dbLoading && !hasMintedNFTs && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading minted NFTs...
        </div>
      )}

      {hasMintedNFTs && (
        <div>
          {connected && (
            <h2 className="mb-4 text-lg font-bold text-white">Mint History</h2>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {mintedNFTs.map((nft) => (
              <div
                key={nft.mint}
                className="group relative overflow-hidden rounded-xl border border-zinc-800 transition-all hover:border-violet-500/30"
              >
                <a
                  href={nft.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <p className="text-xs font-medium text-white">
                      {nft.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-zinc-400">
                      {shortenAddress(nft.mint, 6)}
                    </p>
                  </div>
                </a>
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <a
                    href={nft.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-black/50 p-1"
                  >
                    <ExternalLink className="h-3 w-3 text-white" />
                  </a>
                  <button
                    onClick={() => removeNFT(nft.mint)}
                    className="rounded-full bg-black/50 p-1 text-zinc-400 hover:text-red-400"
                    title="Remove from gallery"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasMintedNFTs && !hasOnChainAssets && !connected && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <Sparkles className="mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-zinc-500">No NFTs minted yet.</p>
          <a
            href="/create"
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Create NFT
          </a>
        </div>
      )}
    </div>
  );
}
