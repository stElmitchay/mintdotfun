"use client";

import Sheet from "@/components/ui/Sheet";
import { ClipReveal, motion } from "@/components/ui/motion";

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
    <Sheet>
      {/* Oversized decorative title */}
      <div className="section-title-oversized mb-8 overflow-hidden leading-none">
        ROADMAP
      </div>

      <div className="max-w-3xl">
        <ClipReveal as="h2" className="text-3xl font-medium tracking-tight mb-3 text-gray-12" triggerOnScroll>
          Roadmap
        </ClipReveal>
        <motion.p
          className="text-gray-9 text-sm mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          Building the future of AI-powered NFT creation.
        </motion.p>

        <div className="relative space-y-0">
          {/* Timeline line */}
          <motion.div
            className="absolute left-[19px] top-10 w-px bg-accent/40"
            style={{ height: "calc(100% - 50px)", transformOrigin: "top" }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.phase}
              className="group relative flex gap-8 pb-12 last:pb-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 40,
                mass: 0.15,
                delay: index * 0.1,
              }}
            >
              {index < milestones.length - 1 && (
                <div className="absolute left-[19px] top-10 w-px h-[calc(100%-10px)] bg-gray-a3" />
              )}

              <div className="relative z-10 flex-shrink-0 mt-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-medium ${
                    milestone.status === "live"
                      ? "bg-accent text-gray-1"
                      : "bg-gray-4 text-gray-9 border border-gray-a4"
                  }`}
                >
                  {milestone.phase}
                </div>
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-medium text-gray-12">
                    {milestone.title}
                  </h3>
                  {milestone.status === "live" && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-9">{milestone.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
