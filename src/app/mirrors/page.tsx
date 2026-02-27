"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useMirrorTypes } from "@/hooks/useMirrorTypes";
import { motion } from "framer-motion";

export default function MirrorsPage() {
  const { mirrorTypes, loading } = useMirrorTypes();
  const { authenticated } = usePrivy();

  return (
    <div className="min-h-screen bg-[#0b0d13] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-10 flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
              Mirror Marketplace
            </p>
            <h1 className="text-[36px] sm:text-[52px] leading-[0.92] tracking-[-0.03em] text-zinc-100">
              Living Mirror NFTs
            </h1>
          </div>
          <div className="shrink-0">
            {authenticated && (
              <Link
                href="/mirrors/create"
                className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-85"
              >
                <Plus className="w-4 h-4" />
                Create Mirror
              </Link>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Editorial Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-10">
            {mirrorTypes.map((mirror, i) => {
              const cadence =
                mirror.updateCadenceHours <= 12
                  ? `${mirror.updateCadenceHours}h updates`
                  : "Daily updates";
              return (
                <motion.article
                  key={mirror.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.07,
                    duration: 0.45,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                >
                  <Link href={`/mirrors/${mirror.id}`} className="group block">
                    <div className="overflow-hidden rounded-[6px] bg-white/5 border border-white/10 aspect-[16/10]">
                      {mirror.currentFrameImageUri ? (
                        <img
                          src={mirror.currentFrameImageUri}
                          alt={mirror.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500">
                          First frame generating
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[12px] uppercase tracking-[0.04em] text-zinc-400">
                      Cultural Mirror • {cadence} • {mirror.holdersCount} holders
                    </p>
                    <h2 className="mt-1 text-[44px] sm:text-[56px] leading-[0.92] tracking-[-0.035em] text-zinc-100 group-hover:text-white/80 transition-colors">
                      {mirror.name}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                        Frame #{mirror.currentFrameNumber || 0}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                        {mirror.mintPriceSol} SOL
                      </span>
                      {mirror.maxSupply ? (
                        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                          Supply {mirror.holdersCount}/{mirror.maxSupply}
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                          Unlimited supply
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.article>
              );
            })}

            {mirrorTypes.length === 0 && (
              <p className="text-zinc-500 text-sm">No mirrors available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
