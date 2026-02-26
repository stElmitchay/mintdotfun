"use client";

import { Loader2, Sparkles, Plus } from "lucide-react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useMirrorTypes } from "@/hooks/useMirrorTypes";
import MirrorCard from "@/components/mirrors/MirrorCard";
import { motion } from "framer-motion";

export default function MirrorsPage() {
  const { mirrorTypes, loading } = useMirrorTypes();
  const { authenticated } = usePrivy();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 text-accent mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Cultural Mirrors
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-medium text-gray-12 mb-3">
            Living NFTs
          </h1>
          <p className="text-base sm:text-lg text-gray-9 max-w-xl">
            NFTs that evolve daily. Each mirror reflects a city&apos;s cultural
            pulse through real-world data — weather, news, markets, and events
            — rendered as living art.
          </p>

          {authenticated && (
            <Link
              href="/mirrors/create"
              className="inline-flex items-center gap-2 mt-5 bg-gray-3 hover:bg-gray-4 text-gray-12 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create a Mirror
            </Link>
          )}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-8" />
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mirrorTypes.map((mirror, i) => (
              <MirrorCard key={mirror.id} mirror={mirror} index={i} />
            ))}

            {/* Placeholder cards for types not yet in DB */}
            {mirrorTypes.length === 0 && (
              <>
                {["Dubai Mirror", "Lagos Pulse", "Tokyo Neon", "Solana Pulse", "New York Rhythm"].map(
                  (name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.08,
                        duration: 0.5,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      className="bg-gray-2 rounded-2xl overflow-hidden border border-dashed border-gray-a3"
                    >
                      <div className="aspect-square bg-gray-3 flex items-center justify-center">
                        <span className="text-gray-7 text-sm">Coming Soon</span>
                      </div>
                      <div className="px-4 py-4">
                        <h3 className="text-base font-medium text-gray-9">
                          {name}
                        </h3>
                        <p className="text-sm text-gray-7 mt-1">
                          Initializing...
                        </p>
                      </div>
                    </motion.div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
