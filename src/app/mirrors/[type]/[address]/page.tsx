"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Layers,
  ExternalLink,
  Play,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMirrorTimeline } from "@/hooks/useMirrorTimeline";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";
import { shortenAddress, getCoreAssetUrl } from "@/lib/utils";
import MirrorTimeline from "@/components/mirrors/MirrorTimeline";
import FrameViewer from "@/components/mirrors/FrameViewer";
import FramePlayback from "@/components/mirrors/FramePlayback";

export default function OwnedMirrorPage() {
  const params = useParams();
  const type = params.type as string;
  const address = params.address as string;

  const [config, setConfig] = useState<MirrorTypeConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const { frames, total, hasMore, loadMore, loading } = useMirrorTimeline({
    mirrorType: type,
    limit: 50,
  });

  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [showPlayback, setShowPlayback] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedFrame = frames[selectedFrameIndex] ?? null;

  // Fetch config from API
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/mirrors/types/${type}`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
        }
      } catch {
        // Will show "not found" state
      } finally {
        setConfigLoading(false);
      }
    }
    fetchConfig();
  }, [type]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!configLoading && !config) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-gray-9">Mirror type not found.</p>
      </div>
    );
  }

  if (configLoading || !config) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-7" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link */}
        <Link
          href={`/mirrors/${type}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-6 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {config.name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left: Frame display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {showPlayback && frames.length > 1 ? (
              <FramePlayback
                frames={frames}
                onFrameChange={(f) => {
                  const idx = frames.findIndex((fr) => fr.id === f.id);
                  if (idx >= 0) setSelectedFrameIndex(idx);
                }}
              />
            ) : selectedFrame ? (
              <FrameViewer
                frame={selectedFrame}
                hasPrev={selectedFrameIndex < frames.length - 1}
                hasNext={selectedFrameIndex > 0}
                onPrev={() => setSelectedFrameIndex((i) => i + 1)}
                onNext={() => setSelectedFrameIndex((i) => i - 1)}
              />
            ) : (
              <div className="aspect-square rounded-2xl bg-gray-3 flex items-center justify-center">
                <div className="text-center text-gray-7">
                  <Layers className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">
                    {loading ? "Loading..." : "No frames yet"}
                  </p>
                </div>
              </div>
            )}

            {/* Playback toggle */}
            {frames.length > 1 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowPlayback(!showPlayback)}
                  className="flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors bg-gray-3 px-4 py-2 rounded-full"
                >
                  <Play className="w-3.5 h-3.5" />
                  {showPlayback ? "Exit Timelapse" : "Watch Timelapse"}
                </button>
              </div>
            )}

            {/* Timeline */}
            {frames.length > 0 && !showPlayback && (
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
              <h1 className="text-xl font-medium text-gray-12 mb-1">
                {config.name}
              </h1>
              <p className="text-sm text-accent mb-4">{config.tagline}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-3 rounded-xl p-3 text-center">
                  <Layers className="w-4 h-4 text-gray-8 mx-auto mb-1" />
                  <div className="text-lg font-medium text-gray-12">
                    {total}
                  </div>
                  <div className="text-[10px] text-gray-8 uppercase tracking-wider">
                    Frames
                  </div>
                </div>
                <div className="bg-gray-3 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-gray-8 mx-auto mb-1" />
                  <div className="text-sm font-medium text-gray-12 mt-0.5">
                    {config.updateCadenceHours <= 12
                      ? `${config.updateCadenceHours}h`
                      : "Daily"}
                  </div>
                  <div className="text-[10px] text-gray-8 uppercase tracking-wider">
                    Updates
                  </div>
                </div>
              </div>

              {/* NFT Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-8">Mint Address</span>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 text-gray-11 hover:text-gray-12 transition-colors p-2"
                  >
                    <span className="font-mono text-xs">
                      {shortenAddress(address)}
                    </span>
                    {copied ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-40" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-8">Mirror Type</span>
                  <span className="text-gray-11">{config.name}</span>
                </div>
              </div>

              {/* External links */}
              <div className="mt-6 pt-4 border-t border-gray-a3 space-y-2">
                <a
                  href={getCoreAssetUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors py-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Metaplex
                </a>
                <Link
                  href={`/nft/${address}`}
                  className="flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors py-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  List Mirror NFT
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
