"use client";

import { useState, useEffect } from "react";
import type { AgentRow } from "@/lib/supabase";
import type { AgentPersonality } from "@/types/agent";
import { Brain, Sparkles, MessageCircle, Star, Trophy } from "lucide-react";

interface AgentProfileSidebarProps {
  agent: AgentRow;
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

interface ArtworkItem {
  id: string;
  image_url: string;
  prompt?: string;
}

export default function AgentProfileSidebar({ agent }: AgentProfileSidebarProps) {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const personality = agent.personality as unknown as AgentPersonality | null;
  const accentColor = ARCHETYPE_COLORS[agent.archetype] ?? "var(--color-accent)";

  useEffect(() => {
    fetch(`/api/agent/${agent.id}/artworks?limit=6`)
      .then((r) => r.json())
      .then((d) => setArtworks(d.artworks || []))
      .catch(() => {});
  }, [agent.id]);

  const aesthetics = personality?.aesthetics;
  const voice = personality?.voice;

  const traits = [
    { label: "Complexity", value: aesthetics?.complexity ?? 50 },
    { label: "Abstraction", value: aesthetics?.abstraction ?? 50 },
    { label: "Darkness", value: aesthetics?.darkness ?? 50 },
    { label: "Verbosity", value: voice?.verbosity ?? 50 },
    { label: "Formality", value: voice?.formality ?? 50 },
  ];

  return (
    <div className="space-y-6 p-5">
      {/* Avatar */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-4 mb-3">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-gray-7" />
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-12">{agent.name}</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-xs font-medium capitalize px-2.5 py-0.5 rounded-full"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {agent.archetype}
          </span>
          <span className="text-xs font-semibold text-accent">
            Lv.{agent.level}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Sparkles, label: "Creations", value: agent.total_creations },
          { icon: MessageCircle, label: "Interactions", value: agent.total_interactions },
          { icon: Trophy, label: "Reputation", value: agent.reputation_score },
          { icon: Star, label: "Sales", value: agent.total_sales },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-3 rounded-lg p-3 text-center">
            <Icon className="w-4 h-4 text-gray-8 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-12">{value}</p>
            <p className="text-[10px] text-gray-8">{label}</p>
          </div>
        ))}
      </div>

      {/* Personality traits */}
      <div>
        <p className="text-xs font-semibold text-gray-10 uppercase tracking-wider mb-3">
          Personality
        </p>
        <div className="space-y-2.5">
          {traits.map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-9">{label}</span>
                <span className="text-gray-8">{value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${value}%`,
                    background: accentColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Influences */}
      {personality?.influences && (
        <div>
          <p className="text-xs font-semibold text-gray-10 uppercase tracking-wider mb-2">
            Influences
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...(personality.influences.movements ?? []),
              ...(personality.influences.mediums ?? []),
            ].slice(0, 8).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-3 text-gray-9"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent artworks */}
      {artworks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-10 uppercase tracking-wider mb-2">
            Recent Artworks
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {artworks.map((art) => (
              <div
                key={art.id}
                className="aspect-square rounded-lg overflow-hidden bg-gray-4"
              >
                <img
                  src={art.image_url}
                  alt={art.prompt || "Artwork"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {personality?.bio && (
        <div>
          <p className="text-xs font-semibold text-gray-10 uppercase tracking-wider mb-2">
            About
          </p>
          <p className="text-xs text-gray-9 leading-relaxed">{personality.bio}</p>
        </div>
      )}
    </div>
  );
}
