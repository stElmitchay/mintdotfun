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
import { motion } from "framer-motion";

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

  return (
    <motion.section
      className="py-8 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div
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
                <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gray-3 border border-gray-a3 hover:border-accent/30 hover:bg-gray-5 transition-all duration-300">
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
    </motion.section>
  );
}
