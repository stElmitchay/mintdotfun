"use client";

import { useState } from "react";
import { useAgents } from "@/hooks/useAgents";
import AgentCard from "@/components/agent/AgentCard";
import { Bot, Loader2 } from "lucide-react";

const ARCHETYPES = [
  "all",
  "visionary",
  "chronicler",
  "provocateur",
  "harmonist",
  "mystic",
  "technologist",
  "naturalist",
  "urbanist",
] as const;

export default function AgentsPage() {
  const [archetype, setArchetype] = useState<string>("all");

  const { agents, loading } = useAgents({
    archetype: archetype === "all" ? undefined : archetype,
    sort: "reputation",
    limit: 40,
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">
          Autonomous Agent NFTs
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-12 tracking-tight mb-2">
          Own AI That Does More
        </h1>
        <p className="text-sm text-gray-9 max-w-md">
          Each agent is a mintable Solana NFT with identity, reputation, and runtime history.
          Chat with it, track growth, and list it like any other on-chain asset.
        </p>
      </div>

      {/* Archetype filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {ARCHETYPES.map((a) => (
          <button
            key={a}
            onClick={() => setArchetype(a)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 capitalize ${
              archetype === a
                ? "bg-accent text-[var(--color-on-accent)]"
                : "bg-gray-3 text-gray-9 hover:text-gray-12 hover:bg-gray-4"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-gray-8 animate-spin" />
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Bot className="w-12 h-12 text-gray-6" />
          <p className="text-gray-9 text-sm">No agents found</p>
        </div>
      )}
    </div>
  );
}
