"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Users, Layers, User } from "lucide-react";
import type { MirrorTypeInfo } from "@/lib/mirrors/types";

interface MirrorCardProps {
  mirror: MirrorTypeInfo;
  index: number;
}

export default function MirrorCard({ mirror, index }: MirrorCardProps) {
  const cadenceLabel =
    mirror.updateCadenceHours <= 12
      ? `Every ${mirror.updateCadenceHours}h`
      : "Daily";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      <Link
        href={`/mirrors/${mirror.id}`}
        className="group block bg-gray-2 rounded-2xl overflow-hidden transition-colors hover:bg-gray-3"
      >
        {/* Frame image */}
        <div className="relative aspect-square overflow-hidden bg-gray-3">
          {mirror.currentFrameImageUri ? (
            <img
              src={mirror.currentFrameImageUri}
              alt={`${mirror.name} — current frame`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-7">
              <Layers className="w-10 h-10" />
            </div>
          )}

          {/* Frame badge */}
          {mirror.currentFrameNumber > 0 && (
            <div className="absolute top-3 right-3 bg-gray-1/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-gray-11 font-medium">
              Frame #{mirror.currentFrameNumber}
            </div>
          )}

          {/* Creator badge */}
          {mirror.creatorWallet && (
            <div className="absolute top-3 left-3 bg-accent/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-[var(--color-on-accent)] font-medium flex items-center gap-1">
              <User className="w-3 h-3" />
              Community
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 py-4">
          <h3 className="text-base font-medium text-gray-12 mb-1">
            {mirror.name}
          </h3>
          <p className="text-sm text-gray-9 mb-3 line-clamp-2">
            {mirror.tagline}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-8">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {mirror.holdersCount}
                {mirror.maxSupply ? `/${mirror.maxSupply}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {cadenceLabel}
              </span>
            </div>

            <span className="font-medium text-gray-12">
              {mirror.mintPriceSol} SOL
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
