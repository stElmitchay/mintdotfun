"use client";

import Link from "next/link";
import type { AgentRow } from "@/lib/supabase";
import { Brain, Sparkles, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AgentCardProps {
  agent: AgentRow;
  index?: number;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  visionary: "#a78bfa",
  chronicler: "#60a5fa",
  provocateur: "#f87171",
  harmonist: "#34d399",
  mystic: "#c084fc",
  technologist: "#38bdf8",
  naturalist: "#4ade80",
  urbanist: "#fb923c",
};

export default function AgentCard({ agent, index = 0 }: AgentCardProps) {
  const accentColor = ARCHETYPE_COLORS[agent.archetype] ?? "var(--color-accent)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.15,
        delay: (index % 4) * 0.08,
      }}
    >
      <Link
        href={`/agent/${agent.id}`}
        className="group block rounded-xl overflow-hidden bg-gray-3 hover:shadow-lg transition-shadow duration-300"
      >
        <div className="relative aspect-square overflow-hidden">
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={agent.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-4 flex items-center justify-center">
              <Brain className="w-10 h-10 text-gray-7" />
            </div>
          )}

          {/* Level badge — top right */}
          <div className="absolute top-2.5 right-2.5 bg-gray-1/80 backdrop-blur-md px-2 py-0.5 rounded-full">
            <span className="text-xs font-semibold text-accent">
              Lv.{agent.level}
            </span>
          </div>

          {/* Archetype badge — top left */}
          <div
            className="absolute top-2.5 left-2.5 backdrop-blur-md px-2.5 py-0.5 rounded-full"
            style={{ background: `${accentColor}22` }}
          >
            <span className="text-xs font-medium capitalize" style={{ color: accentColor }}>
              {agent.archetype}
            </span>
          </div>
        </div>

        <div className="px-3 py-3 space-y-1.5">
          <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors duration-300">
            {agent.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-8">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {agent.total_creations}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {agent.total_interactions}
            </span>
            <span className="ml-auto text-accent font-medium">
              {agent.reputation_score} rep
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
