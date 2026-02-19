"use client";

import { useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Sheet from "@/components/ui/Sheet";
import { ClipReveal, ScaleInCircle, motion } from "@/components/ui/motion";

export default function Hero() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const handleGetStarted = useCallback(() => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  }, [authenticated, router, login]);

  return (
    <Sheet className="relative min-h-[600px] flex items-center" noPadding>
      <div className="p-8 md:p-16 flex items-center gap-16 w-full relative">
        {/* Yellow circle — positioned top-right */}
        <div className="absolute right-0 top-0 h-full flex items-center">
          <ScaleInCircle
            size={420}
            delay={0.4}
            className="opacity-90 -mr-16 md:mr-0"
          />
        </div>

        {/* Statue overlaying the circle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 30,
              delay: 0.8,
            }}
          >
            <img
              src="/images/hero-statue.webp"
              alt="NFT Statue"
              className="w-[320px] h-auto drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0 0 40px rgba(255, 255, 2, 0.3))",
              }}
            />
          </motion.div>
        </div>

        {/* Text reveals */}
        <div className="relative z-10 flex-1">
          <div
            className="mb-10"
            style={{
              fontSize: "clamp(48px, 8vw, 85px)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            <ClipReveal>Create</ClipReveal>
            <ClipReveal delay={0.1} variant="offset">
              Unique
            </ClipReveal>
            <ClipReveal delay={0.2}>AI Art</ClipReveal>
            <ClipReveal delay={0.3} variant="offset">
              As NFTs
            </ClipReveal>
          </div>

          {/* Description */}
          <motion.p
            className="text-gray-11 text-base md:text-lg max-w-md leading-relaxed mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 30,
              delay: 1.0,
            }}
          >
            Describe your vision, let AI generate stunning artwork,
            and mint it as a 1-of-1 NFT on Solana.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 30,
              delay: 1.2,
            }}
          >
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-3 bg-accent px-8 py-4 rounded-full text-gray-1 font-medium hover:opacity-90 transition-all duration-300 group"
            >
              Start Creating
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>
      </div>
    </Sheet>
  );
}
