"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollReveal } from "@/hooks/useGSAP";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useScrollReveal(headerRef, { y: 40, duration: 0.8 });

  useEffect(() => {
    const container = timelineRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const items = container.querySelectorAll("[data-milestone]");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top 75%",
            end: "bottom 50%",
            scrub: 1,
          },
        }
      );

      gsap.set(items, { y: 40, opacity: 0 });
      items.forEach((item, i) => {
        gsap.to(item, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          delay: i * 0.05,
        });
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div ref={headerRef}>
          <div className="mb-16">
            <h2 className="text-3xl font-medium tracking-tight mb-3 text-gray-12">
              Roadmap
            </h2>
            <p className="text-gray-9 text-sm">
              Building the future of AI-powered NFT creation.
            </p>
          </div>
        </div>

        <div ref={timelineRef} className="relative space-y-0">
          <div
            ref={lineRef}
            className="absolute left-[19px] top-10 w-px bg-accent/40"
            style={{
              height: "calc(100% - 50px)",
              transformOrigin: "top",
              transform: "scaleY(0)",
            }}
          />

          {milestones.map((milestone, index) => (
            <div
              key={milestone.phase}
              data-milestone
              className="group relative flex gap-8 pb-12 last:pb-0"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
