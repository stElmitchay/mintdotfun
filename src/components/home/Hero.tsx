"use client";

import { Zap, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FadeUp, TextReveal } from "@/components/ui/motion";

export default function Hero() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const statueRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (statueRef.current) {
        const rect = statueRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        setMousePosition({
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y)),
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            {/* Badge */}
            <FadeUp delay={0.1}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-sm text-gray-400">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Powered by AI + Solana
              </div>
            </FadeUp>

            {/* Heading */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                <TextReveal text="Create Your" delay={0.2} />
                <br />
                <span className="text-primary">
                  <TextReveal text="AI-Powered NFT" delay={0.35} />
                </span>
                <br />
                <TextReveal text="In Minutes" delay={0.5} />
              </h1>
            </div>

            {/* Description */}
            <FadeUp delay={0.6}>
              <p className="text-lg text-gray-500 leading-relaxed max-w-xl">
                Describe your vision, let AI generate stunning artwork, and mint
                it as a 1-of-1 NFT on Solana. No design skills needed.
              </p>
            </FadeUp>

            {/* CTAs */}
            <FadeUp delay={0.7}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <motion.button
                  onClick={handleGetStarted}
                  className="flex items-center gap-3 bg-primary px-8 py-4 rounded-full text-white font-semibold hover:bg-primary-dark transition-colors duration-300 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
                <button
                  onClick={() => router.push("/gallery")}
                  className="flex items-center gap-3 px-8 py-4 rounded-full text-gray-400 font-medium hover:text-white transition-colors duration-300"
                >
                  View Gallery
                </button>
              </div>
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.85}>
              <div className="flex gap-10 pt-8 border-t border-white/[0.04]">
                {[
                  { label: "Unique NFTs", value: "1-of-1" },
                  { label: "Generated Art", value: "AI" },
                  { label: "On-Chain", value: "Solana" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Statue Section with 3D Parallax — UNTOUCHED */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div
              ref={statueRef}
              className="relative w-full max-w-6xl mx-auto statue-parallax"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                transform: `
                  perspective(1000px)
                  translateX(${mousePosition.x * 15}px)
                  translateY(${mousePosition.y * 15}px)
                  rotateY(${mousePosition.x * 8}deg)
                  rotateX(${-mousePosition.y * 8}deg)
                  scale(${isHovered ? 1.05 : 1})
                `,
                transformStyle: "preserve-3d",
                transition: "transform 0.1s ease-out, scale 0.3s ease-out",
                willChange: "transform",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              {/* Aura */}
              <div className="absolute inset-0 bg-gradient-radial from-teal-500/30 via-cyan-600/20 to-transparent rounded-full blur-3xl opacity-60 animate-pulse scale-150" />

              <div
                className="relative"
                style={{ animation: "float 3s ease-in-out infinite" }}
              >
                <div className="relative z-10 drop-shadow-2xl">
                  <img
                    src="/images/hero-statue.webp"
                    alt="NFT Statue"
                    className="w-full h-auto max-w-6xl mx-auto filter drop-shadow-lg"
                    style={{
                      filter: "drop-shadow(0 0 20px rgba(13, 148, 136, 0.5))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
