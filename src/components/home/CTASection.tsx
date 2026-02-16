"use client";

import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/motion";

export default function CTASection() {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const handleGetStarted = () => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  };

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeUp>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
            Turn your ideas into
            <br />
            <span className="text-primary">unique digital art</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
            From concept to on-chain in minutes. AI-powered creation on Solana.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <motion.button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-dark transition-colors duration-300 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>
        </FadeUp>

        {/* Subtle stats row */}
        <FadeUp delay={0.45}>
          <div className="mt-20 flex items-center justify-center gap-12 text-sm">
            {[
              { value: "AI", label: "Powered" },
              { value: "1-of-1", label: "Unique" },
              { value: "Solana", label: "Chain" },
              { value: "Arweave", label: "Storage" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-semibold text-gray-300">{stat.value}</div>
                <div className="text-gray-600 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
