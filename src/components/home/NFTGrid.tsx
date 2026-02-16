"use client";

import NFTCard from "./NFTCard";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useListings } from "@/hooks/useListings";

export default function NFTGrid() {
  const { listings, loading } = useListings({ limit: 8, sort: "newest" });

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-2">
              {listings.length > 0 ? "Listed NFTs" : "Marketplace"}
            </h2>
            <p className="text-gray-400">
              {listings.length > 0
                ? "Browse and buy AI-generated digital art"
                : "List your AI-generated NFTs for sale"}
            </p>
          </div>
          <Link
            href="/gallery"
            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors group"
          >
            <span className="font-semibold">View all</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading listings...
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <NFTCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Listings Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Be the first to list an AI-generated NFT on the marketplace.
              Create an NFT and list it for sale from your gallery.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-3 bg-gradient-primary px-8 py-4 rounded-full text-white font-semibold hover:shadow-neon-lg transition-all group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Create an NFT
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
