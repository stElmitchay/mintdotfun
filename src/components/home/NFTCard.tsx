"use client";

import Link from "next/link";
import type { Listing } from "@/types";
import { shortenAddress } from "@/lib/utils";
import { motion } from "framer-motion";

interface NFTCardProps {
  listing: Listing;
  index?: number;
}

export default function NFTCard({ listing, index = 0 }: NFTCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.15,
        delay: (index % 3) * 0.08,
      }}
    >
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block rounded-xl overflow-hidden bg-gray-3 hover:shadow-lg transition-shadow duration-300"
      >
        <div className="relative aspect-square overflow-hidden">
          {listing.nftImageUrl ? (
            <img
              src={listing.nftImageUrl}
              alt={listing.nftName}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-4 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent/20" />
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-gray-1/80 backdrop-blur-md px-3 py-1.5 rounded-lg">
            <span className="text-sm font-medium text-accent">
              {listing.priceSol} SOL
            </span>
          </div>

          <div className="absolute top-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-xs text-gray-11 bg-gray-1/60 backdrop-blur-sm px-2 py-1 rounded font-mono">
              {shortenAddress(listing.sellerWallet)}
            </span>
          </div>
        </div>

        <div className="px-3 py-3">
          <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors duration-300">
            {listing.nftName}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
