"use client";

import { ExternalLink, Trash2, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { MintedCollection } from "@/types";
import { shortenAddress, getExplorerUrl } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/constants";

export default function GalleryPage() {
  const [collections, setCollections, { loaded }] = useLocalStorage<
    MintedCollection[]
  >(STORAGE_KEYS.COLLECTIONS, []);

  const removeCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gallery</h1>
        <p className="mt-2 text-zinc-400">
          Your minted NFT collections.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <Sparkles className="mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-zinc-500">No collections minted yet.</p>
          <a
            href="/create"
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Create Collection
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              {/* Collection header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {collection.config.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono">
                      {collection.config.symbol}
                    </span>
                    <span>
                      {collection.nfts.length} NFT
                      {collection.nfts.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {new Date(collection.mintedAt).toLocaleDateString()}
                    </span>
                    {collection.walletAddress && (
                      <span className="font-mono">
                        {shortenAddress(collection.walletAddress)}
                      </span>
                    )}
                  </div>
                  {collection.config.description && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {collection.config.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getExplorerUrl(collection.collectionAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-violet-400"
                    title="View collection on explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => removeCollection(collection.id)}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-500 hover:text-red-400"
                    title="Remove from gallery"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* NFT grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {collection.nfts.map((nft) => (
                  <a
                    key={nft.mint}
                    href={nft.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-zinc-800 transition-all hover:border-violet-500/30"
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
                    <div className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="h-3 w-3 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
