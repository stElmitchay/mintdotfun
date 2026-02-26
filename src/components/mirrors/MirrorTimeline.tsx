"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MirrorFrame } from "@/lib/mirrors/types";

interface MirrorTimelineProps {
  frames: MirrorFrame[];
  selectedFrameId?: string;
  onSelectFrame: (frame: MirrorFrame) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function MirrorTimeline({
  frames,
  selectedFrameId,
  onSelectFrame,
  hasMore,
  onLoadMore,
}: MirrorTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (frames.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-8">
        No frames yet. The first update is coming soon.
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-2/90 backdrop-blur-md p-2 rounded-full border border-gray-a3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4 text-gray-11" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-2/90 backdrop-blur-md p-2 rounded-full border border-gray-a3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4 text-gray-11" />
      </button>

      {/* Timeline strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
      >
        {frames.map((frame) => {
          const isSelected = frame.id === selectedFrameId;
          const date = new Date(frame.generatedAt);
          const dateLabel = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <button
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`flex-shrink-0 group/thumb transition-all ${
                isSelected
                  ? "ring-2 ring-accent rounded-xl"
                  : "hover:ring-1 hover:ring-gray-a5 rounded-xl"
              }`}
            >
              <div className="w-20 sm:w-24">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-3">
                  <img
                    src={frame.imageUri}
                    alt={`Frame #${frame.frameNumber}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[10px] font-medium text-gray-11">
                    #{frame.frameNumber}
                  </div>
                  <div className="text-[10px] text-gray-8">{dateLabel}</div>
                </div>
              </div>
            </button>
          );
        })}

        {hasMore && (
          <button
            onClick={onLoadMore}
            className="flex-shrink-0 w-20 sm:w-24 aspect-square rounded-xl bg-gray-3 flex items-center justify-center text-xs text-gray-9 hover:text-gray-12 hover:bg-gray-4 transition-colors"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
