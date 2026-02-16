"use client";

import { motion } from "framer-motion";
import { FadeUp, StaggerContainer, staggerItem } from "@/components/ui/motion";

const milestones = [
  {
    phase: "01",
    title: "Platform Launch",
    description: "AI generation and Solana minting",
    status: "live" as const,
  },
  {
    phase: "02",
    title: "Multi-Model Support",
    description: "Multiple AI models and advanced style controls",
    status: "building" as const,
  },
  {
    phase: "03",
    title: "Community & Marketplace",
    description: "Creator profiles, social features, and NFT marketplace",
    status: "building" as const,
  },
  {
    phase: "04",
    title: "Mobile & Multi-chain",
    description: "Mobile app and multi-chain expansion",
    status: "planned" as const,
  },
];

export default function Roadmap() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeUp>
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Roadmap</h2>
            <p className="text-gray-500 text-sm">
              Building the future of AI-powered NFT creation.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="space-y-0">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.phase}
              variants={staggerItem}
              className="group relative flex gap-8 pb-12 last:pb-0"
            >
              {/* Vertical line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-[19px] top-10 w-px h-[calc(100%-10px)] bg-white/[0.04]" />
              )}

              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 mt-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    milestone.status === "live"
                      ? "bg-primary text-white"
                      : "bg-surface-3 text-gray-500 border border-white/[0.06]"
                  }`}
                >
                  {milestone.phase}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-white">
                    {milestone.title}
                  </h3>
                  {milestone.status === "live" && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{milestone.description}</p>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
