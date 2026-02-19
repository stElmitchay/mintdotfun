"use client";

import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Sheet from "@/components/ui/Sheet";
import { ClipReveal, motion } from "@/components/ui/motion";

export default function CTASection() {
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
    <Sheet variant="yellow" className="relative min-h-[400px] flex flex-col items-center justify-center text-center">
      {/* QuoteFrame-style content — dark text on yellow */}
      <div className="max-w-2xl mx-auto">
        <div
          className="mb-6"
          style={{
            fontSize: "clamp(28px, 5vw, 55px)",
            fontWeight: 500,
            lineHeight: 1.15,
          }}
        >
          <ClipReveal as="span" className="text-gray-1" triggerOnScroll>
            Turn your ideas into
          </ClipReveal>
          <ClipReveal as="span" className="text-gray-1" delay={0.1} triggerOnScroll>
            unique digital art.
          </ClipReveal>
          <ClipReveal as="span" className="text-gray-1" delay={0.2} triggerOnScroll>
            Mint it. Own it.
          </ClipReveal>
        </div>

        <motion.p
          className="text-gray-1/70 text-base mb-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.6 }}
        >
          From concept to on-chain in minutes. AI-powered creation on Solana.
        </motion.p>

        <motion.button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 bg-gray-1 text-accent px-8 py-4 rounded-full font-medium hover:opacity-90 transition-all duration-300 group"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 30, delay: 0.8 }}
        >
          Get Started
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </motion.button>
      </div>
    </Sheet>
  );
}
