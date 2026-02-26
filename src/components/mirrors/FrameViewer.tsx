"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { MirrorFrame } from "@/lib/mirrors/types";

interface FrameViewerProps {
  frame: MirrorFrame;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function FrameViewer({
  frame,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: FrameViewerProps) {
  const date = new Date(frame.generatedAt);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Frame image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-3 mb-4">
        <img
          src={frame.imageUri}
          alt={`Frame #${frame.frameNumber}`}
          className="w-full h-full object-cover"
        />

        {/* Nav arrows */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3">
          {hasPrev ? (
            <button
              onClick={onPrev}
              className="bg-gray-1/80 backdrop-blur-md p-2 rounded-full border border-gray-a3 hover:bg-gray-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-11" />
            </button>
          ) : (
            <div />
          )}
          {hasNext ? (
            <button
              onClick={onNext}
              className="bg-gray-1/80 backdrop-blur-md p-2 rounded-full border border-gray-a3 hover:bg-gray-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-11" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Frame badge */}
        <div className="absolute top-3 right-3 bg-gray-1/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-gray-11 font-medium">
          Frame #{frame.frameNumber}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        {/* Date & Mood */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-9">{dateLabel}</span>
          <span className="text-sm font-medium text-gray-11 bg-gray-3 px-3 py-1 rounded-full">
            {frame.mood}
          </span>
        </div>

        {/* Scene description */}
        {frame.sceneDescription && (
          <div>
            <h4 className="text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
              Scene
            </h4>
            <p className="text-sm text-gray-11 leading-relaxed">
              {frame.sceneDescription}
            </p>
          </div>
        )}

        {/* Data signals */}
        {frame.dataSignals.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
              Data Signals
            </h4>
            <div className="flex flex-wrap gap-2">
              {frame.dataSignals.map((signal, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-3 text-gray-11 px-2.5 py-1 rounded-full"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dominant colors */}
        {frame.dominantColors.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
              Palette
            </h4>
            <div className="flex gap-2">
              {frame.dominantColors.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg border border-gray-a3"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Arweave link */}
        <a
          href={frame.metadataUri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-8 hover:text-gray-11 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View on Arweave
        </a>
      </div>
    </div>
  );
}
