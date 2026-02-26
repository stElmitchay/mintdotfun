"use client";

import { useState, useEffect, useCallback } from "react";
import type { MirrorFrame } from "@/lib/mirrors/types";

interface UseMirrorTimelineOptions {
  mirrorType: string;
  limit?: number;
}

export function useMirrorTimeline(options: UseMirrorTimelineOptions) {
  const { mirrorType, limit = 20 } = options;

  const [frames, setFrames] = useState<MirrorFrame[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchFrames = useCallback(
    async (newOffset = 0) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type: mirrorType,
          limit: String(limit),
          offset: String(newOffset),
        });

        const res = await fetch(`/api/mirrors/timeline?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch timeline");

        const data = await res.json();

        if (newOffset === 0) {
          setFrames(data.frames || []);
        } else {
          setFrames((prev) => [...prev, ...(data.frames || [])]);
        }
        setTotal(data.total || 0);
        setOffset(newOffset);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch timeline"
        );
      } finally {
        setLoading(false);
      }
    },
    [mirrorType, limit]
  );

  useEffect(() => {
    if (mirrorType) fetchFrames(0);
  }, [mirrorType, fetchFrames]);

  const loadMore = useCallback(() => {
    if (frames.length < total) {
      fetchFrames(offset + limit);
    }
  }, [frames.length, total, offset, limit, fetchFrames]);

  return {
    frames,
    total,
    loading,
    error,
    refetch: () => fetchFrames(0),
    loadMore,
    hasMore: frames.length < total,
  };
}
