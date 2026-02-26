"use client";

import { useState } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { mintMirrorNFT } from "@/lib/mirrors/mintMirror";
import type { MirrorMintResult } from "@/lib/mirrors/mintMirror";
import type { MirrorMintStatus } from "@/lib/mirrors/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface MirrorMintModalProps {
  mirrorType: string;
  mirrorName: string;
  imageUrl: string | null;
  priceSol: number;
  onClose: () => void;
  onSuccess?: (result: MirrorMintResult) => void;
}

export default function MirrorMintModal({
  mirrorType,
  mirrorName,
  imageUrl,
  priceSol,
  onClose,
  onSuccess,
}: MirrorMintModalProps) {
  const { umi, connected } = useUmi();
  const [status, setStatus] = useState<MirrorMintStatus>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MirrorMintResult | null>(null);

  const handleMint = async () => {
    if (!connected) return;

    setError(null);
    setStatus("preparing");

    try {
      const mintResult = await mintMirrorNFT(umi, mirrorType, (progress) => {
        setStatus(progress.phase);
        setMessage(progress.message);
      });

      setResult(mintResult);
      setStatus("complete");
      onSuccess?.(mintResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Minting failed");
      setStatus("error");
    }
  };

  const isMinting =
    status === "preparing" || status === "minting" || status === "registering";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={!isMinting ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-gray-2 border border-gray-a3 rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Close */}
          <button
            onClick={onClose}
            disabled={isMinting}
            className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-9 hover:text-gray-12 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Image preview */}
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-3 mb-5">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={mirrorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-7 text-sm">
                  No frame yet
                </div>
              )}
            </div>

            {/* Success state */}
            {status === "complete" && result ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-12 mb-2">
                  Mirror Minted!
                </h3>
                <p className="text-sm text-gray-9 mb-4">
                  Your {mirrorName} will update automatically. Check back
                  tomorrow to see its first evolution.
                </p>
                <Link
                  href={`/mirrors/${mirrorType}/${result.mint}`}
                  className="inline-block bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  View Your Mirror
                </Link>
              </div>
            ) : (
              <>
                {/* Info */}
                <h3 className="text-lg font-medium text-gray-12 mb-1">
                  Mint {mirrorName}
                </h3>
                <p className="text-sm text-gray-9 mb-5">
                  A living NFT that evolves daily based on real-world data. You
                  own it, we update it. One wallet approval.
                </p>

                {/* Price */}
                <div className="flex items-center justify-between bg-gray-3 rounded-xl px-4 py-3 mb-5">
                  <span className="text-sm text-gray-9">Mint Price</span>
                  <span className="text-lg font-semibold text-gray-12">
                    {priceSol} SOL
                  </span>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Mint button */}
                <button
                  onClick={handleMint}
                  disabled={isMinting || !connected}
                  className="w-full bg-accent text-[var(--color-on-accent)] py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {message || "Processing..."}
                    </>
                  ) : !connected ? (
                    "Connect Wallet to Mint"
                  ) : (
                    `Mint for ${priceSol} SOL`
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
