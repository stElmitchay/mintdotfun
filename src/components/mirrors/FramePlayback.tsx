"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { MirrorFrame } from "@/lib/mirrors/types";

interface FramePlaybackProps {
  frames: MirrorFrame[];
  intervalMs?: number;
  onFrameChange?: (frame: MirrorFrame) => void;
}

export default function FramePlayback({
  frames,
  intervalMs = 2000,
  onFrameChange,
}: FramePlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Frames should be in chronological order (oldest first) for playback
  const chronological = [...frames].reverse();

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, chronological.length - 1));
      setCurrentIndex(clamped);
      onFrameChange?.(chronological[clamped]);
    },
    [chronological, onFrameChange]
  );

  useEffect(() => {
    if (playing && chronological.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= chronological.length) {
            setPlaying(false);
            return prev;
          }
          onFrameChange?.(chronological[next]);
          return next;
        });
      }, intervalMs / speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, intervalMs, speed, chronological, onFrameChange]);

  if (chronological.length === 0) return null;

  const current = chronological[currentIndex];
  const date = new Date(current?.generatedAt ?? "");
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Image with crossfade */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-3 mb-4">
        <img
          key={current?.id}
          src={current?.imageUri}
          alt={`Frame #${current?.frameNumber}`}
          className="w-full h-full object-cover animate-fadeIn"
        />

        {/* Overlay info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-medium">
              Frame #{current?.frameNumber}
            </span>
            <span className="text-xs opacity-80">{dateLabel}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(0)}
            className="p-2 text-gray-9 hover:text-gray-12 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setPlaying(!playing)}
            className="p-2.5 bg-accent text-[var(--color-on-accent)] rounded-full hover:opacity-90 transition-opacity"
          >
            {playing ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => goTo(chronological.length - 1)}
            className="p-2 text-gray-9 hover:text-gray-12 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1.5">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                speed === s
                  ? "bg-gray-4 text-gray-12"
                  : "text-gray-8 hover:text-gray-11"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress */}
        <span className="text-xs text-gray-8">
          {currentIndex + 1} / {chronological.length}
        </span>
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={chronological.length - 1}
        value={currentIndex}
        onChange={(e) => goTo(parseInt(e.target.value))}
        className="w-full mt-3 slider"
      />
    </div>
  );
}
