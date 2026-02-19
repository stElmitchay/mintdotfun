"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Listing } from "@/types";
import { shortenAddress } from "@/lib/utils";
import { useClipReveal } from "@/hooks/useGSAP";

interface NFTCardProps {
  listing: Listing;
  index?: number;
}

export default function NFTCard({ listing, index = 0 }: NFTCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const aspects = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[3/4]",
    "aspect-[5/6]",
  ];
  const aspectClass = aspects[index % aspects.length];

  useClipReveal(cardRef, {
    direction: "up",
    duration: 1.2,
    delay: (index % 4) * 0.08,
    ease: "power4.out",
  });

  return (
    <div ref={cardRef}>
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block relative rounded-xl overflow-hidden bg-gray-2"
      >
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {listing.nftImageUrl ? (
            <img
              src={listing.nftImageUrl}
              alt={listing.nftName}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-3 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-accent/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute bottom-3 left-3 bg-gray-1/80 backdrop-blur-md px-3 py-1.5 rounded-lg">
            <span className="text-sm font-medium text-gray-12">
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
    </div>
  );
}
