"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Check, Coins, AlertTriangle, Copy, Sparkles } from "lucide-react";
import type { GeneratedImage, NFTConfig, MintedNFT, MintStatus } from "@/types";
import { useUmi } from "@/hooks/useUmi";
import { mintSingleNFT } from "@/lib/solana/mintNFT";
import { STORAGE_KEYS } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";

interface MintPanelProps {
  image: GeneratedImage;
  onClose: () => void;
}

export default function MintPanel({ image, onClose }: MintPanelProps) {
  const { umi, connected, walletAddress } = useUmi();

  const [config, setConfig] = useState<NFTConfig>({
    name: "",
    description: "",
  });

  const [status, setStatus] = useState<MintStatus>("idle");
  const [mintedNFT, setMintedNFT] = useState<MintedNFT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [copiedMint, setCopiedMint] = useState(false);

  const handleMint = async () => {
    if (!config.name || !connected) return;

    setStatus("uploading");
    setError(null);
    setProgress("Preparing upload...");

    try {
      const result = await mintSingleNFT(
        umi,
        config,
        image.url,
        (p) => {
          setProgress(p.message);
          if (p.phase === "minting") {
            setStatus("minting");
          }
        }
      );

      const nft: MintedNFT = {
        ...result,
        description: config.description,
        mintedAt: Date.now(),
        walletAddress: walletAddress || "",
      };

      persistNFT(nft);
      setMintedNFT(nft);
      setProgress("");
      setStatus("complete");
    } catch (err) {
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

  const persistNFT = async (nft: MintedNFT) => {
    // Save to Supabase (primary) — fire and forget, don't block UI
    fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: nft.walletAddress,
        mint: nft.mint,
        name: nft.name,
        description: nft.description,
        imageUrl: nft.imageUrl,
        explorerUrl: nft.explorerUrl,
      }),
    }).catch((err) => {
      console.warn("Failed to save NFT to database:", err);
    });

    // Also save to localStorage as offline cache
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MINTED_NFTS);
      let existing: MintedNFT[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existing = parsed;
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.MINTED_NFTS,
        JSON.stringify([nft, ...existing])
      );
    } catch (err) {
      console.warn("Failed to save NFT to localStorage:", err);
    }
  };

  const formDisabled = status !== "idle" && status !== "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-dark-800/95 backdrop-blur-xl p-8 shadow-neon">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-dark-700 text-gray-500 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold">
          Mint Your <span className="text-gradient">NFT</span>
        </h2>

        {status === "complete" && mintedNFT ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-green-400">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20">
                <Check className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">NFT minted successfully!</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src={mintedNFT.imageUrl}
                alt={mintedNFT.name}
                className="aspect-square w-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-dark-700/50 border border-white/5 p-4">
              <span className="text-xs text-gray-500">Mint:</span>
              <span className="flex-1 truncate font-mono text-sm text-gray-300">
                {shortenAddress(mintedNFT.mint, 8)}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mintedNFT.mint);
                  setCopiedMint(true);
                  setTimeout(() => setCopiedMint(false), 2000);
                }}
                className="p-1.5 rounded-full hover:bg-dark-600 text-gray-500 hover:text-white transition-all"
                title="Copy mint address"
              >
                {copiedMint ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={mintedNFT.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-full hover:bg-dark-600 text-primary-light hover:text-primary transition-all"
                title="View on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white/5 backdrop-blur-sm py-4 rounded-2xl font-semibold text-white border border-white/10 hover:bg-white/10 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Wallet status */}
            {!connected && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                No Solana wallet connected. Connect your wallet to mint.
              </div>
            )}

            {connected && walletAddress && (
              <div className="rounded-2xl bg-dark-700/50 border border-white/5 p-3 text-sm text-gray-400">
                Minting with wallet:{" "}
                <span className="font-mono text-gray-300">{shortenAddress(walletAddress, 6)}</span>
              </div>
            )}

            {/* Single image preview */}
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src={image.url}
                alt="NFT Preview"
                className="aspect-square w-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                NFT Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g., Cosmic Dreamer #1"
                className="w-full rounded-2xl border border-white/10 bg-dark-700/50 px-6 py-4 text-white placeholder-gray-400 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={formDisabled}
                maxLength={100}
              />
            </div>

            <div className="space-y-3">
              <label className="font-semibold">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, description: e.target.value }))
                }
                placeholder="Describe your NFT..."
                className="h-24 w-full resize-none rounded-2xl border border-white/10 bg-dark-700/50 px-6 py-4 text-white placeholder-gray-400 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={formDisabled}
                maxLength={500}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {progress && (
              <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-sm text-primary-light">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                {progress}
              </div>
            )}

            <button
              onClick={handleMint}
              disabled={!config.name || !connected || formDisabled}
              className="w-full flex items-center justify-center gap-3 bg-gradient-primary px-8 py-4 rounded-2xl text-white font-semibold hover:shadow-neon-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-lg"
            >
              {status === "uploading" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading to Arweave...
                </>
              ) : status === "minting" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Minting on Solana...
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Mint as NFT
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Image stored on Arweave. Minting on{" "}
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}.
              One wallet signature to mint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
