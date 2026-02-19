"use client";

import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function SplitWords({
  text,
  className,
  wordRefs,
}: {
  text: string;
  className?: string;
  wordRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom mr-[0.3em]"
        >
          <span
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className="inline-block will-change-transform"
            style={{ transform: "translateY(120%)" }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function CTASection() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const sectionRef = useRef<HTMLElement>(null);
  const line1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const line2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const descRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = useCallback(() => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  }, [authenticated, router, login]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      tl.to(
        line1Refs.current.filter(Boolean),
        { y: 0, stagger: 0.06, duration: 0.8 },
        0
      );

      tl.to(
        line2Refs.current.filter(Boolean),
        { y: 0, stagger: 0.06, duration: 0.8 },
        0.2
      );

      tl.fromTo(
        descRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        0.5
      );

      tl.fromTo(
        btnRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.65
      );

      tl.fromTo(
        statsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.8
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl lg:text-5xl font-medium tracking-tight leading-[1.1] mb-6">
          <SplitWords text="Turn your ideas into" wordRefs={line1Refs} />
          <br />
          <SplitWords
            text="unique digital art"
            className="text-accent"
            wordRefs={line2Refs}
          />
        </h2>

        <p
          ref={descRef}
          className="text-gray-11 text-lg mb-10 max-w-xl mx-auto"
          style={{ opacity: 0 }}
        >
          From concept to on-chain in minutes. AI-powered creation on Solana.
        </p>

        <button
          ref={btnRef}
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 bg-accent text-gray-1 px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-all duration-300 group"
          style={{ opacity: 0 }}
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>

        <div ref={statsRef} style={{ opacity: 0 }}>
          <div className="mt-20 flex items-center justify-center gap-12 text-sm">
            {[
              { value: "AI", label: "Powered" },
              { value: "1-of-1", label: "Unique" },
              { value: "Solana", label: "Chain" },
              { value: "Arweave", label: "Storage" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-medium text-gray-12">{stat.value}</div>
                <div className="text-gray-9 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
