"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessageCircle,
  Tags,
} from "lucide-react";
import type { AgentRow } from "@/lib/supabase";
import { getCoreAssetUrl, shortenAddress } from "@/lib/utils";

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

export default function AgentInfoPage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agent/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Not found")))
      .then((data) => setAgent(data as AgentRow))
      .catch(() => setAgent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-7" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <p className="text-gray-9">Agent not found.</p>
      </div>
    );
  }

  const accentColor = ARCHETYPE_COLORS[agent.archetype] ?? "var(--color-accent)";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <Link
          href={`/agent/${agent.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-6 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl overflow-hidden border border-gray-a3 bg-gray-2"
          >
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-3 flex items-center justify-center text-gray-7">
                No artwork
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl border border-gray-a3 bg-gray-2 p-6"
          >
            <p className="text-xs uppercase tracking-widest font-semibold mb-2 text-accent">
              Agent NFT
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-12 tracking-tight">
              {agent.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-9 max-w-2xl">
              A live autonomous NFT on Solana. This agent stores identity, reputation, and execution history as it gains XP over time.
              Buy the token, own the agent shell and its on-chain provenance.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize"
                style={{ background: `${accentColor}22`, color: accentColor }}
              >
                {agent.archetype}
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-3 text-gray-11">
                Lv.{agent.level}
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-3 text-gray-11">
                {agent.reputation_score} rep
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Creations" value={String(agent.total_creations)} />
              <Stat label="Interactions" value={String(agent.total_interactions)} />
              <Stat label="Sales" value={String(agent.total_sales)} />
              <Stat label="Revenue" value={`${(agent.total_revenue_lamports / 1_000_000_000).toFixed(2)} SOL`} />
            </div>

            <div className="mt-6 rounded-xl bg-gray-3 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-8 mb-1">
                Mint Address
              </p>
              <p className="font-mono text-sm text-gray-12">
                {shortenAddress(agent.mint_address, 8)}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/agent/${agent.id}`}
                className="inline-flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-4 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                Open Chat
              </Link>
              <a
                href={getCoreAssetUrl(agent.mint_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-a4 text-gray-12 px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-3 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Metaplex
              </a>
              <Link
                href={`/nft/${agent.mint_address}`}
                className="inline-flex items-center gap-2 border border-gray-a4 text-gray-12 px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-3 transition-colors"
              >
                <Tags className="w-4 h-4" />
                List This Agent
              </Link>
            </div>

            <p className="mt-3 text-xs text-gray-8">
              Listing is handled from the asset page. Open “List This Agent” to set price and publish.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-3 p-3 text-center">
      <p className="text-lg font-semibold text-gray-12">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-gray-8">{label}</p>
    </div>
  );
}
