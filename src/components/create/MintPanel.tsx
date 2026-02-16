"use client";

import { useState } from "react";
import { X, Loader2, ExternalLink, Check, Coins, AlertTriangle, Copy, Sparkles } from "lucide-react";
import type { GeneratedImage, NFTConfig, MintedNFT, MintStatus } from "@/types";
import { useUmi } from "@/hooks/useUmi";
import { mintSingleNFT } from "@/lib/solana/mintNFT";
import { STORAGE_KEYS } from "@/lib/constants";
import { shortenAddress } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.06] bg-surface-1 p-8"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg text-gray-600 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-6 text-xl font-bold">
            Mint Your <span className="text-primary">NFT</span>
          </h2>

          {status === "complete" && mintedNFT ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl bg-green-500/5 border border-green-500/15 p-4 text-green-400">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10">
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">NFT minted successfully!</span>
              </div>

              <div className="overflow-hidden rounded-xl">
                <img
                  src={mintedNFT.imageUrl}
                  alt={mintedNFT.name}
                  className="aspect-square w-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-white/[0.04] p-3">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">Mint</span>
                <span className="flex-1 truncate font-mono text-xs text-gray-400">
                  {shortenAddress(mintedNFT.mint, 8)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mintedNFT.mint);
                    setCopiedMint(true);
                    setTimeout(() => setCopiedMint(false), 2000);
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-3 text-gray-500 hover:text-white transition-all"
                >
                  {copiedMint ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={mintedNFT.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-surface-3 text-gray-500 hover:text-white transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-surface-2 border border-white/[0.06] py-3 rounded-xl text-sm font-medium text-white hover:bg-surface-3 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {!connected && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  No wallet connected. Connect to mint.
                </div>
              )}

              {connected && walletAddress && (
                <div className="rounded-xl bg-surface-2 border border-white/[0.04] p-3 text-xs text-gray-500">
                  Minting with{" "}
                  <span className="font-mono text-gray-400">{shortenAddress(walletAddress, 6)}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-xl">
                <img
                  src={image.url}
                  alt="NFT Preview"
                  className="aspect-square w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="e.g., Cosmic Dreamer #1"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40 transition-all"
                  disabled={formDisabled}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, description: e.target.value }))
                  }
                  placeholder="Describe your NFT..."
                  className="h-20 w-full resize-none rounded-xl border border-white/[0.06] bg-surface-2 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40 transition-all"
                  disabled={formDisabled}
                  maxLength={500}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              {progress && (
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 p-3 text-xs text-primary-light">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {progress}
                </div>
              )}

              <motion.button
                onClick={handleMint}
                disabled={!config.name || !connected || formDisabled}
                className="w-full flex items-center justify-center gap-2 bg-primary px-6 py-3.5 rounded-xl text-sm text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {status === "uploading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading to Arweave...
                  </>
                ) : status === "minting" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Minting on Solana...
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    Mint as NFT
                  </>
                )}
              </motion.button>

              <p className="text-center text-[11px] text-gray-600">
                Image on Arweave. Minting on{" "}
                {process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
