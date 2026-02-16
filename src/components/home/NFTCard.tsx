"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/types";
import { shortenAddress } from "@/lib/utils";

interface NFTCardProps {
  listing: Listing;
}

export default function NFTCard({ listing }: NFTCardProps) {
  return (
    <Link
      href={`/nft/${listing.mintAddress}`}
      className="group relative bg-dark-800 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 card-hover cursor-pointer block"
    >
      <div className="relative h-64 overflow-hidden">
        {listing.nftImageUrl ? (
          <img
            src={listing.nftImageUrl}
            alt={listing.nftName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500/40 to-cyan-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Tag className="w-12 h-12 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-bold mb-1 group-hover:text-gradient transition-colors truncate">
            {listing.nftName}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-primary" />
            <span className="text-sm text-gray-400">
              {shortenAddress(listing.sellerWallet)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <div className="text-xs text-gray-500 mb-1">Price</div>
            <div className="text-lg font-bold text-gradient">
              {listing.priceSol} SOL
            </div>
          </div>
        </div>

        <div className="w-full bg-gradient-primary py-3 rounded-xl font-semibold text-center opacity-0 group-hover:opacity-100 transition-all hover:shadow-neon">
          View Details
        </div>
      </div>
    </Link>
  );
}
