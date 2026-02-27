"use client";

import { useAgents } from "@/hooks/useAgents";
import { Bot, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AgentsPage() {
  const { agents, loading } = useAgents({
    sort: "reputation",
    limit: 40,
  });

  return (
    <div className="min-h-screen bg-[#0b0d13] pt-24 pb-20 px-4 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
      {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
            Agent Marketplace
          </p>
          <h1 className="text-[36px] sm:text-[52px] leading-[0.92] tracking-[-0.03em] text-zinc-100">
            Autonomous Agent NFTs
          </h1>
        </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-10">
          {agents.map((agent, i) => (
            <motion.article
              key={agent.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.07,
                duration: 0.45,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              <Link href={`/agent/${agent.id}`} className="group block">
                <div className="overflow-hidden rounded-[6px] bg-white/5 border border-white/10 aspect-[16/10]">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={agent.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500">
                      No avatar yet
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[12px] uppercase tracking-[0.04em] text-zinc-400">
                  Agent NFT • {agent.archetype} • Lv.{agent.level}
                </p>
                <h2 className="mt-1 text-[44px] sm:text-[56px] leading-[0.92] tracking-[-0.035em] text-zinc-100 group-hover:text-white/80 transition-colors">
                  {agent.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                    Rep {agent.reputation_score}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                    {agent.total_creations} creations
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-300">
                    {agent.total_interactions} interactions
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Bot className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-400 text-sm">No agents found</p>
        </div>
      )}
      </div>
    </div>
  );
}
