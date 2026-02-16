"use client";

import { Sparkles, Zap, Rocket } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

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
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary-light">
              <Zap className="w-3.5 h-3.5" />
              Powered by AI + Solana
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Create Your{" "}
              <span className="text-gradient">AI-Powered NFT</span>{" "}
              In Minutes
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
              Describe your vision, let AI generate stunning artwork, and mint
              it as a 1-of-1 NFT on Solana. No design skills needed — just your
              creativity.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleGetStarted}
                className="flex items-center gap-3 bg-gradient-primary px-8 py-4 rounded-full text-white font-semibold hover:shadow-neon-lg transition-all group"
              >
                <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Creating
              </button>
              <button
                onClick={() => router.push("/gallery")}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-8 py-4 rounded-full text-white font-semibold border border-white/10 hover:bg-white/10 transition-all"
              >
                <Zap className="w-5 h-5" />
                View Gallery
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">1-of-1</div>
                <div className="text-sm text-gray-400">Unique NFTs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">AI</div>
                <div className="text-sm text-gray-400">Generated Art</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">Solana</div>
                <div className="text-sm text-gray-400">On-Chain</div>
              </div>
            </div>
          </div>

          {/* Statue Section with 3D Parallax */}
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
              {/* Purple aura */}
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
