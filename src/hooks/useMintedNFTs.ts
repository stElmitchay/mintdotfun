"use client";

import { useState, useEffect, useCallback } from "react";
import type { MintedNFT } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Fetches the user's minted NFTs from Supabase.
 * Falls back to localStorage if the API is unavailable.
 */
export function useMintedNFTs(walletAddress: string | null) {
  const [nfts, setNFTs] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "local" | null>(null);

  const fetchNFTs = useCallback(async (cancelled = { value: false }) => {
    if (!walletAddress) {
      if (cancelled.value) return;
      setNFTs([]);
      setLoading(false);
      return;
    }

    if (cancelled.value) return;
    setLoading(true);

    // Try Supabase first
    try {
      const res = await fetch(`/api/collections?wallet=${encodeURIComponent(walletAddress)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nfts)) {
          if (cancelled.value) return;
          setNFTs(data.nfts);
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
      const raw = localStorage.getItem(STORAGE_KEYS.MINTED_NFTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (n: MintedNFT) => n.walletAddress === walletAddress
          );
          if (cancelled.value) return;
          setNFTs(filtered);
          setSource("local");
          setLoading(false);
          return;
        }
      }
    } catch {
      // localStorage parse error
    }

    if (cancelled.value) return;
    setNFTs([]);
    setSource(null);
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    const cancelled = { value: false };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNFTs(cancelled);
    return () => {
      cancelled.value = true;
    };
  }, [fetchNFTs]);

  const removeNFT = useCallback(
    async (mint: string) => {
      setNFTs((prev) => prev.filter((n) => n.mint !== mint));

      // Also remove from localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.MINTED_NFTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localStorage.setItem(
              STORAGE_KEYS.MINTED_NFTS,
              JSON.stringify(parsed.filter((n: MintedNFT) => n.mint !== mint))
            );
          }
        }
      } catch {
        // Ignore
      }
    },
    []
  );

  return {
    nfts,
    loading,
    source,
    removeNFT,
    refetch: () => fetchNFTs({ value: false }),
  };
}
