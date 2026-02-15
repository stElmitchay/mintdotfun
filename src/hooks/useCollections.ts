"use client";

import { useState, useEffect, useCallback } from "react";
import type { MintedCollection } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Fetches the user's minted collections from Supabase.
 * Falls back to localStorage if the API is unavailable.
 */
export function useCollections(walletAddress: string | null) {
  const [collections, setCollections] = useState<MintedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "local" | null>(null);

  const fetchCollections = useCallback(async () => {
    if (!walletAddress) {
      setCollections([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Try Supabase first
    try {
      const res = await fetch(`/api/collections?wallet=${encodeURIComponent(walletAddress)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.collections)) {
          setCollections(data.collections);
          setSource("db");
          setLoading(false);
          return;
        }
      }
    } catch {
      // Supabase unavailable — fall through to localStorage
    }

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter to current wallet
          const filtered = parsed.filter(
            (c: MintedCollection) => c.walletAddress === walletAddress
          );
          setCollections(filtered);
          setSource("local");
          setLoading(false);
          return;
        }
      }
    } catch {
      // localStorage parse error
    }

    setCollections([]);
    setSource(null);
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const removeCollection = useCallback(
    async (id: string) => {
      setCollections((prev) => prev.filter((c) => c.id !== id));

      // Also remove from localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              STORAGE_KEYS.COLLECTIONS,
              JSON.stringify(parsed.filter((c: MintedCollection) => c.id !== id))
            );
          }
        }
      } catch {
        // Ignore
      }
    },
    []
  );

  return { collections, loading, source, removeCollection, refetch: fetchCollections };
}
