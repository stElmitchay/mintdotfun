"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Users,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMirrorTimeline } from "@/hooks/useMirrorTimeline";
import { useUmi } from "@/hooks/useUmi";
import type { MirrorTypeConfig, MirrorTypeInfo } from "@/lib/mirrors/types";
import MirrorTimeline from "@/components/mirrors/MirrorTimeline";
import MirrorMintModal from "@/components/mirrors/MirrorMintModal";
import FrameViewer from "@/components/mirrors/FrameViewer";

export default function MirrorTypePage() {
  const params = useParams();
  const type = params.type as string;
  const { connected } = useUmi();

  const [config, setConfig] = useState<MirrorTypeConfig | null>(null);
  const [mirrorInfo, setMirrorInfo] = useState<MirrorTypeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);

  const { frames, total, hasMore, loadMore } = useMirrorTimeline({
    mirrorType: type,
    limit: 30,
  });

  // Fetch mirror config + info from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [configRes, typesRes] = await Promise.all([
          fetch(`/api/mirrors/types/${type}`),
          fetch("/api/mirrors/types"),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData.config);
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          const found = typesData.mirrors?.find(
            (m: MirrorTypeInfo) => m.id === type
          );
          if (found) setMirrorInfo(found);
        }
      } catch {
        // Will show "not found" state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  if (!loading && !config) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-gray-9">Mirror type not found.</p>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-7" />
      </div>
    );
  }

  const selectedFrame = frames[selectedFrameIndex] ?? null;
  const cadenceLabel =
    config.updateCadenceHours <= 12
      ? `Every ${config.updateCadenceHours} hours`
      : "Daily";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link */}
        <Link
          href="/mirrors"
          className="inline-flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-6 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          All Mirrors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left: Frame display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {selectedFrame ? (
              <FrameViewer
                frame={selectedFrame}
                hasPrev={selectedFrameIndex < frames.length - 1}
                hasNext={selectedFrameIndex > 0}
                onPrev={() => setSelectedFrameIndex((i) => i + 1)}
                onNext={() => setSelectedFrameIndex((i) => i - 1)}
              />
            ) : mirrorInfo?.currentFrameImageUri ? (
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-3">
                <img
                  src={mirrorInfo.currentFrameImageUri}
                  alt={config.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-2xl bg-gray-3 flex items-center justify-center">
                <div className="text-center text-gray-7">
                  <Layers className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">First frame generating soon</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            {frames.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-11 mb-3">
                  Timeline ({total} frames)
                </h3>
                <MirrorTimeline
                  frames={frames}
                  selectedFrameId={selectedFrame?.id}
                  onSelectFrame={(f) => {
                    const idx = frames.findIndex((fr) => fr.id === f.id);
                    if (idx >= 0) setSelectedFrameIndex(idx);
                  }}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                />
              </div>
            )}
          </motion.div>

          {/* Right: Info panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24 self-start"
          >
            <div className="bg-gray-2 rounded-2xl p-6 border border-gray-a3">
              <div className="flex items-center gap-2 text-accent mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  Cultural Mirror
                </span>
              </div>

              <h1 className="text-2xl font-medium text-gray-12 mb-1">
                {config.name}
              </h1>
              <p className="text-sm text-accent mb-4">{config.tagline}</p>
              <p className="text-sm text-gray-9 mb-6 leading-relaxed">
                {config.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-3 rounded-xl p-3 text-center">
                  <Layers className="w-4 h-4 text-gray-8 mx-auto mb-1" />
                  <div className="text-lg font-medium text-gray-12">
                    {mirrorInfo?.currentFrameNumber ?? 0}
                  </div>
                  <div className="text-[10px] text-gray-8 uppercase tracking-wider">
                    Frames
                  </div>
                </div>
                <div className="bg-gray-3 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-gray-8 mx-auto mb-1" />
                  <div className="text-lg font-medium text-gray-12">
                    {mirrorInfo?.holdersCount ?? 0}
                  </div>
                  <div className="text-[10px] text-gray-8 uppercase tracking-wider">
                    Holders
                  </div>
                </div>
                <div className="bg-gray-3 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-gray-8 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-12 mt-0.5">
                    {cadenceLabel}
                  </div>
                  <div className="text-[10px] text-gray-8 uppercase tracking-wider">
                    Updates
                  </div>
                </div>
              </div>

              {/* Price + Mint */}
              <div className="flex items-center justify-between bg-gray-3 rounded-xl px-4 py-3 mb-4">
                <span className="text-sm text-gray-9">Mint Price</span>
                <span className="text-lg font-semibold text-gray-12">
                  {config.mintPriceSol} SOL
                </span>
              </div>

              {config.maxSupply && (
                <p className="text-xs text-gray-8 text-center mb-4">
                  {mirrorInfo?.holdersCount ?? 0} / {config.maxSupply} minted
                </p>
              )}

              <button
                onClick={() => setShowMintModal(true)}
                disabled={!mirrorInfo?.currentFrameImageUri}
                className="w-full bg-accent text-[var(--color-on-accent)] py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mirrorInfo?.currentFrameImageUri
                  ? `Mint ${config.name}`
                  : "Not yet available"}
              </button>

              {/* Data sources */}
              <div className="mt-6 pt-6 border-t border-gray-a3">
                <h4 className="text-xs font-medium text-gray-8 uppercase tracking-wider mb-3">
                  Powered By
                </h4>
                <div className="flex flex-wrap gap-2">
                  {config.dataFeedConfig.weatherEnabled && (
                    <span className="text-[11px] bg-gray-3 text-gray-9 px-2 py-1 rounded-md">
                      Weather
                    </span>
                  )}
                  <span className="text-[11px] bg-gray-3 text-gray-9 px-2 py-1 rounded-md">
                    News
                  </span>
                  {config.dataFeedConfig.onChainEnabled && (
                    <span className="text-[11px] bg-gray-3 text-gray-9 px-2 py-1 rounded-md">
                      On-Chain
                    </span>
                  )}
                  <span className="text-[11px] bg-gray-3 text-gray-9 px-2 py-1 rounded-md">
                    Calendar
                  </span>
                </div>
              </div>

              {/* Creator attribution */}
              {mirrorInfo?.creatorWallet && (
                <div className="mt-4 pt-4 border-t border-gray-a3">
                  <p className="text-xs text-gray-8">
                    Created by{" "}
                    <span className="font-mono text-gray-9">
                      {mirrorInfo.creatorWallet.slice(0, 4)}...
                      {mirrorInfo.creatorWallet.slice(-4)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mint modal */}
      {showMintModal && (
        <MirrorMintModal
          mirrorType={type}
          mirrorName={config.name}
          imageUrl={mirrorInfo?.currentFrameImageUri ?? null}
          priceSol={config.mintPriceSol}
          onClose={() => setShowMintModal(false)}
        />
      )}
    </div>
  );
}
