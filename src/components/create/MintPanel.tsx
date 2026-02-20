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

  // Shared inline style helpers
  const onAccent = "var(--color-on-accent)";
  const accent = "var(--color-accent)";
  const subtle = (pct: number) =>
    `color-mix(in srgb, var(--color-on-accent) ${pct}%, transparent)`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "color-mix(in srgb, var(--color-accent) 85%, black)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
          style={{
            background: onAccent,
            color: accent,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: accent }}
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-5 text-lg font-bold" style={{ color: accent }}>
            Mint NFT
          </h2>

          {status === "complete" && mintedNFT ? (
            /* ── Success ─────────────────────────── */
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium"
                style={{ background: subtle(8), color: accent }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ background: subtle(12) }}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                Minted successfully
              </div>

              <div className="overflow-hidden rounded-xl">
                <img
                  src={mintedNFT.imageUrl}
                  alt={mintedNFT.name}
                  className="aspect-square w-full object-cover"
                />
              </div>

              <div
                className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: subtle(6) }}
              >
                <span className="text-[10px] uppercase tracking-wider" style={{ color: subtle(40) }}>
                  Mint
                </span>
                <span className="flex-1 truncate font-mono text-xs" style={{ color: accent }}>
                  {shortenAddress(mintedNFT.mint, 8)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mintedNFT.mint);
                    setCopiedMint(true);
                    setTimeout(() => setCopiedMint(false), 2000);
                  }}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
                  style={{ color: accent }}
                >
                  {copiedMint ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={mintedNFT.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
                  style={{ color: accent }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: accent, color: onAccent }}
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form ─────────────────────────────── */
            <div className="space-y-4">
              {!connected && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3 text-xs font-medium"
                  style={{ background: subtle(8), color: accent }}
                >
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  No wallet connected. Connect to mint.
                </div>
              )}

              {connected && walletAddress && (
                <div
                  className="rounded-xl p-3 text-xs"
                  style={{ background: subtle(6), color: accent }}
                >
                  Minting with{" "}
                  <span className="font-mono">{shortenAddress(walletAddress, 6)}</span>
                </div>
              )}

              {/* Image preview */}
              <div className="overflow-hidden rounded-xl">
                <img
                  src={image.url}
                  alt="NFT Preview"
                  className="aspect-square w-full object-cover"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium" style={{ color: accent }}>
                  <Sparkles className="w-3 h-3" />
                  Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, name: e.target.value }))
                  }
                  placeholder="e.g., Cosmic Dreamer #1"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: subtle(6),
                    border: `1px solid ${subtle(10)}`,
                    color: accent,
                  }}
                  disabled={formDisabled}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: accent }}>
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, description: e.target.value }))
                  }
                  placeholder="Describe your NFT..."
                  className="h-20 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: subtle(6),
                    border: `1px solid ${subtle(10)}`,
                    color: accent,
                  }}
                  disabled={formDisabled}
                  maxLength={500}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-xl p-3 text-xs"
                  style={{ background: subtle(8), color: accent }}
                >
                  {error}
                </div>
              )}

              {/* Progress */}
              {progress && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3 text-xs"
                  style={{ background: subtle(6), color: accent }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {progress}
                </div>
              )}

              {/* Mint button */}
              <motion.button
                onClick={handleMint}
                disabled={!config.name || !connected || formDisabled}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: accent, color: onAccent }}
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

              <p className="text-center text-[10px]" style={{ color: subtle(40) }}>
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
