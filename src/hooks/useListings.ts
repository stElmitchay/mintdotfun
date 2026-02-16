"use client";

import { useState, useEffect, useCallback } from "react";
import type { Listing } from "@/types";

interface UseListingsOptions {
  seller?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  status?: "active" | "sold" | "cancelled";
  mint?: string;
  limit?: number;
}

export function useListings(options: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { seller, search, sort, status, mint, limit } = options;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (seller) params.set("seller", seller);
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      if (status) params.set("status", status);
      if (mint) params.set("mint", mint);
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [seller, search, sort, status, mint, limit]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
