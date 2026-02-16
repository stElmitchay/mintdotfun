"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Check, Coins, AlertTriangle, Copy } from "lucide-react";
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
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-xl font-bold text-white">
          Mint Your NFT
        </h2>

        {status === "complete" && mintedNFT ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">NFT minted successfully!</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <img
                src={mintedNFT.imageUrl}
                alt={mintedNFT.name}
                className="aspect-square w-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 p-3">
              <span className="text-xs text-zinc-500">Mint:</span>
              <span className="flex-1 truncate font-mono text-xs text-zinc-300">
                {shortenAddress(mintedNFT.mint, 8)}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mintedNFT.mint);
                  setCopiedMint(true);
                  setTimeout(() => setCopiedMint(false), 2000);
                }}
                className="text-zinc-500 hover:text-white"
                title="Copy mint address"
              >
                {copiedMint ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={mintedNFT.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
                title="View on explorer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
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

            {/* Single image preview */}
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <img
                src={image.url}
                alt="NFT Preview"
                className="aspect-square w-full object-cover"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                NFT Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g., Cosmic Dreamer #1"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                disabled={formDisabled}
                maxLength={100}
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
                placeholder="Describe your NFT..."
                className="h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                disabled={formDisabled}
                maxLength={500}
              />
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
              disabled={!config.name || !connected || formDisabled}
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
                  Mint as NFT
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-600">
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
