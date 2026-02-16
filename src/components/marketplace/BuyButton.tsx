"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { buyNFT } from "@/lib/solana/buyNFT";

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
      <span className={`text-xs text-gray-500 ${className}`}>Your listing</span>
    );
  }

  return (
    <button
      onClick={handleBuy}
      disabled={buying}
      className={`bg-gradient-primary py-3 rounded-xl font-semibold hover:shadow-neon transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${className}`}
    >
      {buying ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Buying...
        </>
      ) : (
        `Buy for ${priceSol} SOL`
      )}
    </button>
  );
}
