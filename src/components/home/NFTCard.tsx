"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Listing } from "@/types";
import { shortenAddress } from "@/lib/utils";

interface NFTCardProps {
  listing: Listing;
  index?: number;
}

export default function NFTCard({ listing, index = 0 }: NFTCardProps) {
  // Vary aspect ratios for masonry visual interest
  const aspects = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"];
  const aspectClass = aspects[index % aspects.length];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 20,
          },
        },
      }}
    >
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block relative rounded-xl overflow-hidden bg-surface-2"
      >
        {/* Image */}
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {listing.nftImageUrl ? (
            <img
              src={listing.nftImageUrl}
              alt={listing.nftName}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-surface-3 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/20" />
            </div>
          )}

          {/* Overlay on hover — clean fade with info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Price tag — always visible, bottom left */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
            <span className="text-sm font-semibold text-white">
              {listing.priceSol} SOL
            </span>
          </div>

          {/* Info on hover — top area */}
          <div className="absolute top-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                {shortenAddress(listing.sellerWallet)}
              </span>
            </div>
          </div>
        </div>

        {/* Title below image — minimal */}
        <div className="px-3 py-3">
          <h3 className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-300">
            {listing.nftName}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
