"use client";

import Hero from "@/components/home/Hero";
import CollectionSlider from "@/components/home/CollectionSlider";
import NFTGrid from "@/components/home/NFTGrid";
import Roadmap from "@/components/home/Roadmap";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-24 pb-8 flex flex-col gap-4">
      <Hero />

      {/* Oversized decorative text between sections */}
      <div className="section-title-oversized text-center select-none py-2 overflow-hidden">
        EXPLORE
      </div>

      <CollectionSlider />

      <div className="section-title-oversized text-center select-none py-2 overflow-hidden">
        TRENDING
      </div>

      <NFTGrid />
      <Roadmap />
      <CTASection />
    </div>
  );
}
