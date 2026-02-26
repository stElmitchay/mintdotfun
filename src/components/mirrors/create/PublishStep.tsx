"use client";

import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";
import Link from "next/link";

interface PublishStepProps {
  config: MirrorTypeConfig;
  publishing: boolean;
  error: string | null;
  createdMirrorId: string | null;
  creationFeeSol: number;
  onPublish: () => void;
  onBack: () => void;
}

export default function PublishStep({
  config,
  publishing,
  error,
  createdMirrorId,
  creationFeeSol,
  onPublish,
  onBack,
}: PublishStepProps) {
  // Success state
  if (createdMirrorId) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-medium text-gray-12 mb-2">
          Mirror Created!
        </h2>
        <p className="text-sm text-gray-9 mb-6">
          <span className="text-gray-12 font-medium">{config.name}</span> is
          now live. Its first frame will be generated on the next update cycle.
        </p>
        <Link
          href={`/mirrors/${createdMirrorId}`}
          className="inline-flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
        >
          View Your Mirror
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Editor
      </button>

      <h2 className="text-2xl font-medium text-gray-12 mb-6">
        Publish Mirror
      </h2>

      {/* Summary card */}
      <div className="bg-gray-2 rounded-2xl p-6 border border-gray-a3 mb-6">
        <h3 className="text-lg font-medium text-gray-12 mb-1">
          {config.name}
        </h3>
        <p className="text-sm text-accent mb-3">{config.tagline}</p>
        <p className="text-sm text-gray-9 mb-4">{config.description}</p>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-3 rounded-lg p-2">
            <div className="text-sm font-medium text-gray-12">
              {config.mintPriceSol} SOL
            </div>
            <div className="text-[10px] text-gray-8">Mint Price</div>
          </div>
          <div className="bg-gray-3 rounded-lg p-2">
            <div className="text-sm font-medium text-gray-12">
              {config.maxSupply ?? "Unlimited"}
            </div>
            <div className="text-[10px] text-gray-8">Supply</div>
          </div>
          <div className="bg-gray-3 rounded-lg p-2">
            <div className="text-sm font-medium text-gray-12">
              {config.updateCadenceHours}h
            </div>
            <div className="text-[10px] text-gray-8">Update Cadence</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-a3">
          <div className="text-xs text-gray-8 space-y-1">
            <p>
              Location: {config.dataFeedConfig.location.city},{" "}
              {config.dataFeedConfig.location.country}
            </p>
            <p>
              Anchors: {config.architecturalAnchors.length} landmarks
            </p>
            <p>
              Events: {config.dataFeedConfig.customEvents.length} cultural
              events
            </p>
            <p>Creator revenue: 50% of each mint</p>
          </div>
        </div>
      </div>

      {/* Fee info */}
      {creationFeeSol > 0 && (
        <div className="flex items-center justify-between bg-gray-3 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-gray-9">Creation Fee</span>
          <span className="text-lg font-semibold text-gray-12">
            {creationFeeSol} SOL
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={onPublish}
        disabled={publishing}
        className="w-full bg-accent text-[var(--color-on-accent)] py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {publishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing...
          </>
        ) : creationFeeSol > 0 ? (
          `Pay ${creationFeeSol} SOL & Publish`
        ) : (
          "Publish Mirror"
        )}
      </button>
    </div>
  );
}
