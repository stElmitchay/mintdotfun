"use client";

import NFTCard from "./NFTCard";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useListings } from "@/hooks/useListings";
import { useScrollReveal } from "@/hooks/useGSAP";

export default function NFTGrid() {
  const { listings, loading } = useListings({ limit: 8, sort: "newest" });
  const headerRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  useScrollReveal(headerRef, { y: 40, duration: 0.8 });
  useScrollReveal(emptyRef, { y: 40, duration: 0.8, delay: 0.1 });

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef}>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-2 text-gray-12">
                {listings.length > 0 ? "Listed NFTs" : "Marketplace"}
              </h2>
              <p className="text-gray-9 text-sm">
                {listings.length > 0
                  ? "Browse and collect AI-generated digital art"
                  : "List your AI-generated NFTs for sale"}
              </p>
            </div>
            <Link
              href="/gallery"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300 group"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-9 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : listings.length > 0 ? (
          <div className="masonry-grid">
            {listings.map((listing, i) => (
              <NFTCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        ) : (
          <div ref={emptyRef}>
            <div className="text-center py-32 border border-gray-a3 rounded-2xl bg-gray-2/50">
              <p className="text-gray-9 mb-6 text-sm">
                No listings yet. Be the first to list an NFT.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-accent text-gray-1 px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300"
              >
                Create an NFT
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
