"use client";

import Hero from "@/components/home/Hero";
import CollectionSlider from "@/components/home/CollectionSlider";
import NFTGrid from "@/components/home/NFTGrid";
import Roadmap from "@/components/home/Roadmap";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <CollectionSlider />
      <NFTGrid />
      <Roadmap />
      <CTASection />
    </>
  );
}
