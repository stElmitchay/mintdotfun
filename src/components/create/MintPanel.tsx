"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Check, Coins, AlertTriangle } from "lucide-react";
import type { GeneratedImage, CollectionConfig, MintedNFT, MintedCollection, MintStatus } from "@/types";
import { useUmi } from "@/hooks/useUmi";
import { mintNFTCollection } from "@/lib/solana/mintCollection";
import { STORAGE_KEYS } from "@/lib/constants";

interface MintPanelProps {
  images: GeneratedImage[];
  onClose: () => void;
}

export default function MintPanel({ images, onClose }: MintPanelProps) {
  const { umi, connected, walletAddress } = useUmi();

  const [config, setConfig] = useState<CollectionConfig>({
    name: "",
    description: "",
    symbol: "",
    sellerFeeBasisPoints: 500,
  });

  const [status, setStatus] = useState<MintStatus>("idle");
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const handleMint = async () => {
    if (!config.name || !config.symbol || !connected) return;

    setStatus("uploading");
    setError(null);
    setProgress("Preparing uploads...");

    try {
      const result = await mintNFTCollection(
        umi,
        config,
        images.map((img) => ({ url: img.url, prompt: img.prompt })),
        (p) => {
          setProgress(p.message);
          if (p.phase === "collection" || p.phase === "minting") {
            setStatus("minting");
          }
        }
      );

      // Always persist whatever was minted (even on partial failure)
      if (result.minted.length > 0) {
        persistCollection(result.collection, result.minted);
      }

      setMintedNFTs(result.minted);
      setProgress("");

      if (result.error) {
        // Partial failure: some NFTs minted, but not all
        setError(result.error);
        setStatus(result.minted.length > 0 ? "complete" : "error");
      } else {
        setStatus("complete");
      }
    } catch (err) {
      // Only catches upfront validation errors (collection creation failure, etc.)
      console.error("Minting error:", err);
      const message =
        err instanceof Error ? err.message : "Minting failed";
      if (message.includes("insufficient")) {
        setError(
          "Insufficient SOL balance. You need devnet SOL to mint. Use a Solana faucet to get some."
        );
      } else if (message.includes("User rejected") || message.includes("denied")) {
        setError("Transaction was rejected. Please approve the transaction in your wallet.");
      } else {
        setError(message);
      }
      setStatus("error");
      setProgress("");
    }
  };

  const persistCollection = (collectionAddress: string, minted: MintedNFT[]) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      let existing: MintedCollection[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existing = parsed;
        }
      }
      const newCollection: MintedCollection = {
        id: `col-${Date.now()}`,
        config,
        collectionAddress,
        nfts: minted,
        mintedAt: Date.now(),
        walletAddress: walletAddress || "",
      };
      localStorage.setItem(
        STORAGE_KEYS.COLLECTIONS,
        JSON.stringify([newCollection, ...existing])
      );
    } catch (err) {
      console.warn("Failed to save collection to gallery:", err);
    }
  };

  const formDisabled = status !== "idle" && status !== "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-xl font-bold text-white">
          Mint Your Collection
        </h2>

        {status === "complete" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {error
                  ? `${mintedNFTs.length} of ${images.length} NFTs minted`
                  : "Collection minted successfully!"}
              </span>
            </div>
            {error && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                {error}
              </div>
            )}
            <div className="space-y-3">
              {mintedNFTs.map((nft) => (
                <div
                  key={nft.mint}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                >
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {nft.name}
                    </p>
                    <p className="truncate font-mono text-xs text-zinc-500">
                      {nft.mint}
                    </p>
                  </div>
                  <a
                    href={nft.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-violet-400 hover:text-violet-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-zinc-800 py-3 font-medium text-white hover:bg-zinc-700"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Wallet status */}
            {!connected && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                No Solana wallet connected. Connect your wallet to mint.
              </div>
            )}

            {connected && walletAddress && (
              <div className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
                Minting with wallet:{" "}
                <span className="font-mono text-zinc-300">{walletAddress}</span>
              </div>
            )}

            {/* Preview thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt="NFT Preview"
                  className="h-16 w-16 flex-shrink-0 rounded-lg border border-zinc-800 object-cover"
                />
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Collection Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g., Mystical Forest Creatures"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                disabled={formDisabled}
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Symbol *
              </label>
              <input
                type="text"
                value={config.symbol}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    symbol: e.target.value.toUpperCase().slice(0, 10),
                  }))
                }
                placeholder="e.g., MFC"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                disabled={formDisabled}
                maxLength={10}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, description: e.target.value }))
                }
                placeholder="Describe your collection..."
                className="h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                disabled={formDisabled}
                maxLength={500}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Royalty: {config.sellerFeeBasisPoints / 100}%
              </label>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={config.sellerFeeBasisPoints}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    sellerFeeBasisPoints: parseInt(e.target.value),
                  }))
                }
                className="w-full accent-violet-500"
                disabled={formDisabled}
              />
              <div className="mt-1 flex justify-between text-xs text-zinc-600">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {progress && (
              <div className="flex items-center gap-2 text-sm text-violet-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress}
              </div>
            )}

            <button
              onClick={handleMint}
              disabled={!config.name || !config.symbol || !connected || formDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-medium text-white transition-all hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading to Arweave...
                </>
              ) : status === "minting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Minting on Solana...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Mint {images.length} NFT{images.length > 1 ? "s" : ""} on
                  Solana
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-600">
              Images stored on Arweave. Minting on{" "}
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}.
              Your wallet will sign uploads and transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
