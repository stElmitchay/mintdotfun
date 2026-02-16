"use client";

import { useState } from "react";
import { X, Loader2, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { listNFT } from "@/lib/solana/listNFT";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">List for Sale</h2>

        {/* NFT Preview */}
        <div className="flex items-center gap-4 mb-6 bg-white/5 rounded-xl p-3 border border-white/10">
          {nftImageUrl ? (
            <img
              src={nftImageUrl}
              alt={nftName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-500/40 to-cyan-500/40 flex items-center justify-center">
              <Tag className="w-6 h-6 text-white/30" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{nftName}</h3>
            <p className="text-sm text-gray-400 truncate">
              {mintAddress.slice(0, 8)}...{mintAddress.slice(-4)}
            </p>
          </div>
        </div>

        {/* Price Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price (SOL)
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
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 pr-16 text-white placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-all disabled:opacity-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              SOL
            </span>
          </div>
          {price && !isValidPrice && (
            <p className="text-sm text-red-400 mt-1">
              Enter a valid price greater than 0
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleList}
          disabled={!isValidPrice || listing}
          className="w-full bg-gradient-primary py-3 rounded-xl font-semibold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {listing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Listing...
            </>
          ) : (
            `List for ${isValidPrice ? priceSol : "—"} SOL`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Your NFT will be frozen in your wallet while listed. You can cancel
          the listing at any time.
        </p>
      </div>
    </div>
  );
}
