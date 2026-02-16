"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const collections = [
  { name: "Cosmic Dreams", count: "AI Art", bg: "from-blue-500/20 to-purple-500/20" },
  { name: "Neon Worlds", count: "Digital", bg: "from-cyan-500/20 to-blue-500/20" },
  { name: "Abstract Souls", count: "Generative", bg: "from-purple-500/20 to-pink-500/20" },
  { name: "Cyber Creatures", count: "AI Art", bg: "from-pink-500/20 to-purple-500/20" },
  { name: "Pixel Realms", count: "Pixel Art", bg: "from-indigo-500/20 to-purple-500/20" },
  { name: "Mystic Beings", count: "Fantasy", bg: "from-teal-500/20 to-cyan-500/20" },
  { name: "Astral Flow", count: "Abstract", bg: "from-violet-500/20 to-purple-500/20" },
];

export default function CollectionSlider() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Styles</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-dark-700 hover:bg-dark-600 border border-white/5 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full bg-dark-700 hover:bg-dark-600 border border-white/5 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide collection-slider-mask">
            {collections.map((collection, index) => (
              <div key={index} className="flex-shrink-0 group cursor-pointer">
                <div
                  className={`w-48 h-24 rounded-2xl bg-gradient-to-br ${collection.bg} backdrop-blur-xl border border-white/10 p-4 hover:border-primary/50 transition-all card-hover`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary" />
                    <div>
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
