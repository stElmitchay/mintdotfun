"use client";

import { Zap, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useMagnetic } from "@/hooks/useGSAP";

/* ── Char-Split Helper ───────────────────────────────────────── */
function SplitChars({
  text,
  className,
  charRefs,
  offset,
}: {
  text: string;
  className?: string;
  charRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
  offset: number;
}) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
        >
          <span
            ref={(el) => {
              charRefs.current[offset + i] = el;
            }}
            className="inline-block will-change-transform"
            style={{ transform: "translateY(115%)" }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const statueRef = useRef<HTMLDivElement>(null);

  /* Refs for GSAP animation targets */
  const badgeRef = useRef<HTMLDivElement>(null);
  const line1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const line2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const line3Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLButtonElement>(null);

  /* Magnetic effect on CTA button */
  useMagnetic(ctaBtnRef, 0.25);

  const line1 = "Create Your";
  const line2 = "AI-Powered NFT";
  const line3 = "In Minutes";

  const handleGetStarted = useCallback(() => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  }, [authenticated, router, login]);

  /* ── GSAP Entrance Timeline ──────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Badge
      tl.fromTo(
        badgeRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.15
      );

      // Line 1 chars
      tl.to(
        line1Refs.current.filter(Boolean),
        { y: 0, stagger: 0.025, duration: 0.65 },
        0.35
      );

      // Line 2 chars (overlapping)
      tl.to(
        line2Refs.current.filter(Boolean),
        { y: 0, stagger: 0.025, duration: 0.65 },
        0.65
      );

      // Line 3 chars
      tl.to(
        line3Refs.current.filter(Boolean),
        { y: 0, stagger: 0.025, duration: 0.65 },
        0.95
      );

      // Description
      tl.fromTo(
        descRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        1.1
      );

      // CTAs
      tl.fromTo(
        ctaRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        1.25
      );

      // Stats
      tl.fromTo(
        statsRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        1.35
      );
    });

    return () => ctx.revert();
  }, []);

  /* ── Statue Parallax (mouse) ─────────────────────────────── */
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
            <div ref={badgeRef} style={{ opacity: 0 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-sm text-gray-400">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Powered by AI + Solana
              </div>
            </div>

            {/* Heading — GSAP character splits */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                <SplitChars
                  text={line1}
                  charRefs={line1Refs}
                  offset={0}
                />
                <br />
                <SplitChars
                  text={line2}
                  className="text-primary"
                  charRefs={line2Refs}
                  offset={0}
                />
                <br />
                <SplitChars
                  text={line3}
                  charRefs={line3Refs}
                  offset={0}
                />
              </h1>
            </div>

            {/* Description */}
            <p
              ref={descRef}
              className="text-lg text-gray-500 leading-relaxed max-w-xl"
              style={{ opacity: 0 }}
            >
              Describe your vision, let AI generate stunning artwork, and mint
              it as a 1-of-1 NFT on Solana. No design skills needed.
            </p>

            {/* CTAs */}
            <div ref={ctaRef} style={{ opacity: 0 }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  ref={ctaBtnRef}
                  onClick={handleGetStarted}
                  className="flex items-center gap-3 bg-primary px-8 py-4 rounded-full text-white font-semibold hover:bg-primary-dark transition-colors duration-300 group"
                  data-cursor-hover
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => router.push("/gallery")}
                  className="flex items-center gap-3 px-8 py-4 rounded-full text-gray-400 font-medium hover:text-white transition-colors duration-300"
                >
                  View Gallery
                </button>
              </div>
            </div>

            {/* Stats */}
            <div ref={statsRef} style={{ opacity: 0 }}>
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
            </div>
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
