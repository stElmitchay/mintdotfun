"use client";

import { useState, useEffect, useCallback } from "react";
import type { MirrorTypeInfo } from "@/lib/mirrors/types";

export function useMirrorTypes() {
  const [mirrorTypes, setMirrorTypes] = useState<MirrorTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mirrors/types");
      if (!res.ok) throw new Error("Failed to fetch mirror types");

      const data = await res.json();
      setMirrorTypes(data.mirrors || []);
    } catch (err) {
      console.error("Failed to fetch mirror types:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch mirror types"
      );
      setMirrorTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return { mirrorTypes, loading, error, refetch: fetchTypes };
}
