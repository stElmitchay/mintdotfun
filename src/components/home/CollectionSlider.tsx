"use client";

import { useState } from "react";
import {
  Orbit,
  Zap,
  Waves,
  Bug,
  Grid3X3,
  Flame,
  Wind,
} from "lucide-react";

const collections = [
  { name: "Cosmic Dreams", count: "AI Art", bg: "from-teal-500/20 to-cyan-500/20", icon: Orbit },
  { name: "Neon Worlds", count: "Digital", bg: "from-cyan-500/20 to-sky-500/20", icon: Zap },
  { name: "Abstract Souls", count: "Generative", bg: "from-teal-600/20 to-emerald-500/20", icon: Waves },
  { name: "Cyber Creatures", count: "AI Art", bg: "from-cyan-600/20 to-teal-500/20", icon: Bug },
  { name: "Pixel Realms", count: "Pixel Art", bg: "from-sky-500/20 to-cyan-500/20", icon: Grid3X3 },
  { name: "Mystic Beings", count: "Fantasy", bg: "from-teal-500/20 to-cyan-500/20", icon: Flame },
  { name: "Astral Flow", count: "Abstract", bg: "from-cyan-500/20 to-teal-600/20", icon: Wind },
];

export default function CollectionSlider() {
  const [paused, setPaused] = useState(false);

  // Duplicate items for seamless infinite loop
  const items = [...collections, ...collections];

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Featured Styles</h2>
        </div>

        <div
          className="relative overflow-hidden collection-slider-mask"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex gap-4 w-max"
            style={{
              animation: `scroll-carousel 25s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {items.map((collection, index) => {
              const Icon = collection.icon;
              return (
                <div key={index} className="flex-shrink-0 group cursor-pointer">
                  <div
                    className={`w-48 h-24 rounded-2xl bg-gradient-to-br ${collection.bg} backdrop-blur-xl border border-white/10 p-4 hover:border-primary/50 transition-all card-hover`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">
                          {collection.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {collection.count}
                        </div>
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
