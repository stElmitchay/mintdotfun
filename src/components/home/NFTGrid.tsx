"use client";

import NFTCard from "./NFTCard";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useListings } from "@/hooks/useListings";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/motion";

export default function NFTGrid() {
  const { listings, loading } = useListings({ limit: 8, sort: "newest" });

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <FadeUp>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {listings.length > 0 ? "Listed NFTs" : "Marketplace"}
              </h2>
              <p className="text-gray-500 text-sm">
                {listings.length > 0
                  ? "Browse and collect AI-generated digital art"
                  : "List your AI-generated NFTs for sale"}
              </p>
            </div>
            <Link
              href="/gallery"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors duration-300 group"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </FadeUp>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : listings.length > 0 ? (
          <motion.div
            className="masonry-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {listings.map((listing, i) => (
              <NFTCard key={listing.id} listing={listing} index={i} />
            ))}
          </motion.div>
        ) : (
          <FadeUp>
            <div className="text-center py-32 border border-white/[0.04] rounded-2xl bg-surface-1/50">
              <p className="text-gray-600 mb-6 text-sm">
                No listings yet. Be the first to list an NFT.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors duration-300"
              >
                Create an NFT
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </FadeUp>
        )}
      </div>
    </section>
  );
}
