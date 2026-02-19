"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { buyNFT } from "@/lib/solana/buyNFT";
import { motion } from "framer-motion";

interface BuyButtonProps {
  listingId: string;
  priceSol: number;
  sellerWallet: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function BuyButton({
  listingId,
  priceSol,
  sellerWallet,
  onSuccess,
  onError,
  className = "",
}: BuyButtonProps) {
  const { umi, connected, walletAddress } = useUmi();
  const [buying, setBuying] = useState(false);

  const isOwnListing = walletAddress === sellerWallet;

  const handleBuy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!connected || isOwnListing) return;

    setBuying(true);
    try {
      await buyNFT(umi, listingId);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      onError?.(message);
    } finally {
      setBuying(false);
    }
  };

  if (!connected) {
    return null;
  }

  if (isOwnListing) {
    return (
      <span className={`text-xs text-gray-600 ${className}`}>Your listing</span>
    );
  }

  return (
    <motion.button
      onClick={handleBuy}
      disabled={buying}
      className={`bg-primary py-3 rounded-xl text-sm font-semibold text-black hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {buying ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Buying...
        </>
      ) : (
        `Buy for ${priceSol} SOL`
      )}
    </motion.button>
  );
}
