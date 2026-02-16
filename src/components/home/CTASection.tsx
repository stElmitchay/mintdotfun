"use client";

import { Sparkles } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

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
    <section className="py-20 px-6 relative">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-neon-lg animate-float">
          <Sparkles className="w-10 h-10" />
        </div>

        <h2 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
          Turn your ideas into unique digital art
        </h2>

        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Join creators who are minting AI-generated NFTs on Solana. From
          concept to on-chain in minutes.
        </p>

        <button
          onClick={handleGetStarted}
          className="bg-gradient-primary px-10 py-4 rounded-full text-white font-semibold text-lg hover:shadow-neon-lg transition-all inline-flex items-center gap-3 group"
        >
          Get Started
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="bg-dark-700/30 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
            <div className="text-3xl font-bold text-gradient mb-2">AI</div>
            <div className="text-gray-400 text-sm">Powered</div>
          </div>
          <div className="bg-dark-700/30 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
            <div className="text-3xl font-bold text-gradient mb-2">1-of-1</div>
            <div className="text-gray-400 text-sm">Unique NFTs</div>
          </div>
          <div className="bg-dark-700/30 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
            <div className="text-3xl font-bold text-gradient mb-2">Solana</div>
            <div className="text-gray-400 text-sm">Blockchain</div>
          </div>
          <div className="bg-dark-700/30 backdrop-blur-xl rounded-2xl p-6 border border-white/5">
            <div className="text-3xl font-bold text-gradient mb-2">Arweave</div>
            <div className="text-gray-400 text-sm">Permanent Storage</div>
          </div>
        </div>
      </div>
    </section>
  );
}
