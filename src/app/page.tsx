"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, Coins, ArrowRight, Zap } from "lucide-react";

export default function Home() {
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
    <div className="relative">
      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 pb-20 pt-24 text-center sm:pt-32">
        {/* Gradient background effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-400">
            <Zap className="h-3.5 w-3.5" />
            Powered by AI + Solana
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Describe Your Vision.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Mint Your Collection.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Go from an idea to a fully minted NFT collection on Solana in
            minutes. Describe what you want, upload inspiration, and let AI
            create your art. No design skills needed.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleGetStarted}
              className="group flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-base font-medium text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25"
            >
              Start Creating
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          How It Works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <Step
            icon={<Wand2 className="h-6 w-6" />}
            step="1"
            title="Describe"
            description="Tell us your vision. Describe the style, theme, and mood. Upload reference images or existing drafts for inspiration."
          />
          <Step
            icon={<Sparkles className="h-6 w-6" />}
            step="2"
            title="Generate"
            description="Our AI creates unique artwork based on your description. Preview, refine, and select the pieces you love."
          />
          <Step
            icon={<Coins className="h-6 w-6" />}
            step="3"
            title="Mint"
            description="Mint your selected artwork as NFTs directly on Solana. Your collection is live on-chain in seconds."
          />
        </div>
      </section>
    </div>
  );
}

function Step({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-violet-500/30 hover:bg-zinc-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Step {step}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
