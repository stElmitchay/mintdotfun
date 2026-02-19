"use client";

import NFTCard from "./NFTCard";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useListings } from "@/hooks/useListings";
import Sheet from "@/components/ui/Sheet";
import { ClipReveal, motion } from "@/components/ui/motion";

export default function NFTGrid() {
  const { listings, loading } = useListings({ limit: 6, sort: "newest" });

  return (
    <Sheet>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <ClipReveal as="h2" className="text-3xl font-medium tracking-tight mb-2 text-gray-12" triggerOnScroll>
            {listings.length > 0 ? "Listed NFTs" : "Marketplace"}
          </ClipReveal>
          <motion.p
            className="text-gray-9 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {listings.length > 0
              ? "Browse and collect AI-generated digital art"
              : "List your AI-generated NFTs for sale"}
          </motion.p>
        </div>
        <Link
          href="/gallery"
          className="hidden sm:flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300 group"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-9 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing, i) => (
            <NFTCard key={listing.id} listing={listing} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-gray-a3 rounded-2xl bg-gray-3/50">
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
      )}
    </Sheet>
  );
}
