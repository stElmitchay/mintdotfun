"use client";

import { useState, useRef } from "react";
import {
  Orbit,
  Zap,
  Waves,
  Bug,
  Grid3X3,
  Flame,
  Wind,
} from "lucide-react";
import { useScrollReveal, useParallax } from "@/hooks/useGSAP";

const styles = [
  { name: "Cosmic Dreams", tag: "AI Art", icon: Orbit },
  { name: "Neon Worlds", tag: "Digital", icon: Zap },
  { name: "Abstract Souls", tag: "Generative", icon: Waves },
  { name: "Cyber Creatures", tag: "AI Art", icon: Bug },
  { name: "Pixel Realms", tag: "Pixel Art", icon: Grid3X3 },
  { name: "Mystic Beings", tag: "Fantasy", icon: Flame },
  { name: "Astral Flow", tag: "Abstract", icon: Wind },
];

export default function CollectionSlider() {
  const [paused, setPaused] = useState(false);
  const items = [...styles, ...styles];
  const headerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useScrollReveal(headerRef, { y: 30, duration: 0.7 });
  useParallax(sliderRef, -0.15);

  return (
    <section className="py-16 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef}>
          <div className="mb-8">
            <h2 className="text-xl font-medium tracking-tight text-gray-11">
              Featured Styles
            </h2>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="relative overflow-hidden collection-slider-mask"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex gap-3 w-max"
            style={{
              animation: `scroll-carousel 30s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {items.map((style, index) => {
              const Icon = style.icon;
              return (
                <div key={index} className="flex-shrink-0 group cursor-pointer">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gray-a3 border border-gray-a4 hover:border-accent/30 hover:bg-gray-a5 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-accent-dim flex items-center justify-center">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-11 group-hover:text-gray-12 transition-colors">
                        {style.name}
                      </div>
                      <div className="text-[11px] text-gray-9">
                        {style.tag}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
