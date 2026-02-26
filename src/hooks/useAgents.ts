"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentRow } from "@/lib/supabase";

interface UseAgentsOptions {
  limit?: number;
  offset?: number;
  archetype?: string;
  sort?: "newest" | "reputation" | "level" | "creations";
}

export function useAgents(options: UseAgentsOptions = {}) {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { limit, offset, archetype, sort } = options;

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (offset) params.set("offset", String(offset));
      if (archetype) params.set("archetype", archetype);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/agents?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await res.json();
      setAgents(data.agents || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, archetype, sort]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, total, loading, error, refetch: fetchAgents };
}
