"use client";

import { useState } from "react";
import { X, Loader2, XCircle } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { listNFT } from "@/lib/solana/listNFT";
import { motion, AnimatePresence } from "framer-motion";

interface ListingModalProps {
  mintAddress: string;
  nftName: string;
  nftImageUrl: string;
  nftDescription: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ListingModal({
  mintAddress,
  nftName,
  nftImageUrl,
  nftDescription,
  onClose,
  onSuccess,
}: ListingModalProps) {
  const { umi } = useUmi();
  const [price, setPrice] = useState("");
  const [listing, setListing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceSol = parseFloat(price);
  const isValidPrice = !isNaN(priceSol) && priceSol > 0;

  const handleList = async () => {
    if (!isValidPrice) return;

    setListing(true);
    setError(null);

    try {
      const priceLamports = Math.round(priceSol * 1e9);
      await listNFT(umi, mintAddress, priceLamports, nftName, nftImageUrl, nftDescription);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list NFT");
    } finally {
      setListing(false);
    }
  };

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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-surface-1 rounded-2xl border border-white/[0.06] p-6 max-w-md w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-bold mb-6">List for Sale</h2>

          {/* NFT Preview */}
          <div className="flex items-center gap-4 mb-6 bg-surface-2 rounded-xl p-3 border border-white/[0.04]">
            {nftImageUrl ? (
              <img
                src={nftImageUrl}
                alt={nftName}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-surface-3 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/20" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{nftName}</h3>
              <p className="text-xs text-gray-600 font-mono truncate">
                {mintAddress.slice(0, 8)}...{mintAddress.slice(-4)}
              </p>
            </div>
          </div>

          {/* Price Input */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Price
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.001"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={listing}
                className="w-full bg-surface-2 border border-white/[0.06] rounded-xl px-4 py-3 pr-16 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all disabled:opacity-50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                SOL
              </span>
            </div>
            {price && !isValidPrice && (
              <p className="text-xs text-red-400 mt-1.5">
                Enter a valid price greater than 0
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl p-3 bg-red-500/5 border border-red-500/15 flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <motion.button
            onClick={handleList}
            disabled={!isValidPrice || listing}
            className="w-full bg-primary py-3 rounded-xl text-sm font-semibold text-black hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {listing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Listing...
              </>
            ) : (
              `List for ${isValidPrice ? priceSol : "—"} SOL`
            )}
          </motion.button>

          <p className="text-[11px] text-gray-600 text-center mt-3">
            NFT will be frozen while listed. Cancel anytime.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
