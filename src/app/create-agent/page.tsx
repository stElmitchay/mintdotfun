"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Sparkles,
  Check,
  Eye,
  Pen,
  Flame,
  Leaf,
  Building2,
  Shield,
  Moon,
  Cpu,
  Palette,
  BookOpen,
  Orbit,
  Zap,
  Waves,
  Grid3X3,
  Hexagon,
  Star,
  Diamond,
  Pentagon,
  Triangle,
  Circle,
  Square,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUmi } from "@/hooks/useUmi";
import { useWhimsicalWord } from "@/hooks/useWhimsicalWord";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateSigner,
  signAllTransactions,
  none,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import { createV2 } from "@metaplex-foundation/mpl-core";
import type { AgentArchetype, AgentPersonality } from "@/types/agent";

// ============================================
// Archetype data
// ============================================

interface ArchetypeInfo {
  id: AgentArchetype;
  label: string;
  description: string;
  icon: typeof Eye;
  color: string;
}

const ARCHETYPES: ArchetypeInfo[] = [
  { id: "visionary", label: "Visionary", description: "Pushes boundaries, explores the unknown", icon: Eye, color: "#e94560" },
  { id: "chronicler", label: "Chronicler", description: "Documents culture, captures truth", icon: BookOpen, color: "#d4a574" },
  { id: "provocateur", label: "Provocateur", description: "Challenges norms, disrupts complacency", icon: Flame, color: "#ff4444" },
  { id: "harmonist", label: "Harmonist", description: "Creates beauty, seeks balance", icon: Palette, color: "#aa96da" },
  { id: "mystic", label: "Mystic", description: "Reveals hidden layers of reality", icon: Moon, color: "#e0aaff" },
  { id: "technologist", label: "Technologist", description: "Explores digital consciousness", icon: Cpu, color: "#00ff9f" },
  { id: "naturalist", label: "Naturalist", description: "Channels rhythms of the natural world", icon: Leaf, color: "#4a7c59" },
  { id: "urbanist", label: "Urbanist", description: "Captures the pulse of city life", icon: Building2, color: "#ff6600" },
];

// ============================================
// Slider config
// ============================================

interface SliderConfig {
  key: "complexity" | "abstraction" | "darkness" | "temperature";
  label: string;
  description: string;
  icon: typeof SlidersHorizontal;
}

const SLIDERS: SliderConfig[] = [
  { key: "complexity", label: "Complexity", description: "Detail level in generated art", icon: Grid3X3 },
  { key: "abstraction", label: "Abstraction", description: "Concrete to abstract spectrum", icon: Waves },
  { key: "darkness", label: "Darkness", description: "Light and airy to dark and moody", icon: Moon },
  { key: "temperature", label: "Temperature", description: "Cool blues to warm reds", icon: Flame },
];

// ============================================
// Texture overlay
// ============================================

const TEXTURE_ICONS = [
  Orbit, Zap, Waves, Grid3X3, Flame,
  Sparkles, Hexagon, Star, Diamond, Pentagon, Triangle,
  Circle, Square,
];

const TEXTURE_POSITIONS = [
  { x: 5, y: 8, size: 16, rotate: 15, opacity: 0.08 },
  { x: 20, y: 65, size: 12, rotate: -30, opacity: 0.06 },
  { x: 38, y: 20, size: 18, rotate: 45, opacity: 0.09 },
  { x: 8, y: 42, size: 14, rotate: -15, opacity: 0.06 },
  { x: 52, y: 10, size: 11, rotate: 60, opacity: 0.06 },
  { x: 15, y: 82, size: 20, rotate: -45, opacity: 0.08 },
  { x: 45, y: 52, size: 13, rotate: 30, opacity: 0.06 },
  { x: 28, y: 35, size: 16, rotate: -60, opacity: 0.08 },
  { x: 60, y: 72, size: 12, rotate: 20, opacity: 0.06 },
  { x: 72, y: 25, size: 14, rotate: -25, opacity: 0.06 },
  { x: 85, y: 55, size: 18, rotate: 50, opacity: 0.08 },
  { x: 78, y: 85, size: 11, rotate: -40, opacity: 0.06 },
  { x: 90, y: 15, size: 15, rotate: 35, opacity: 0.06 },
  { x: 65, y: 45, size: 13, rotate: -10, opacity: 0.06 },
  { x: 35, y: 75, size: 17, rotate: 70, opacity: 0.08 },
  { x: 55, y: 90, size: 12, rotate: -55, opacity: 0.06 },
];

function TextureOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {TEXTURE_POSITIONS.map((pos, i) => {
        const Icon = TEXTURE_ICONS[i % TEXTURE_ICONS.length];
        return (
          <Icon
            key={i}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: pos.size,
              height: pos.size,
              opacity: pos.opacity,
              transform: `rotate(${pos.rotate}deg)`,
              color: "var(--color-on-accent)",
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Step animation variants
// ============================================

const stepVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -80 : 80, opacity: 0 }),
};

function StepShell({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-8"
    >
      {children}
    </motion.div>
  );
}

function StepLabel({ number, text }: { number: number; text: string }) {
  return (
    <div className="text-center">
      <span className="text-xs font-mono mb-2 block" style={{ color: "var(--color-on-accent)" }}>
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--color-on-accent)" }}>
        {text}
      </h2>
    </div>
  );
}

// ============================================
// Mint progress phases
// ============================================

type MintPhase =
  | "preparing"
  | "personality"
  | "avatar"
  | "uploading"
  | "approve"
  | "minting"
  | "registering"
  | "done"
  | "error";

const PHASE_LABELS: Record<MintPhase, string> = {
  preparing: "Preparing...",
  personality: "Generating personality...",
  avatar: "Creating avatar...",
  uploading: "Uploading to Arweave...",
  approve: "Approve transaction...",
  minting: "Minting on Solana...",
  registering: "Registering agent...",
  done: "Done!",
  error: "Something went wrong",
};

// ============================================
// Main component
// ============================================

const TOTAL_STEPS = 3;

export default function CreateAgentPage() {
  const { authenticated, login } = usePrivy();
  const { umi, connected, walletAddress } = useUmi();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<AgentArchetype | null>(null);
  const [sliders, setSliders] = useState({ complexity: 50, abstraction: 50, darkness: 50, temperature: 50 });

  // Step management
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Mint state
  const [mintPhase, setMintPhase] = useState<MintPhase>("preparing");
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintResult, setMintResult] = useState<{
    agentId: string;
    avatarUrl: string;
    name: string;
    archetype: AgentArchetype;
  } | null>(null);

  const whimsicalWord = useWhimsicalWord(step === 2 && mintPhase !== "done" && mintPhase !== "error");

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };
  const next = () => goTo(step + 1);
  const prev = () => goTo(step - 1);

  // Auto-focus name input
  useEffect(() => {
    if (step === 0 && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [step]);

  // Mint flow — triggered when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    if (!archetype || !name.trim() || !connected || !walletAddress) return;

    let cancelled = false;

    async function mintAgent() {
      setMintPhase("personality");
      setMintError(null);

      try {
        // Step 1: Server-side preparation (personality + avatar + Arweave uploads)
        setMintPhase("personality");
        const mintRes = await fetch("/api/agent/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            archetype,
            complexity: sliders.complexity,
            abstraction: sliders.abstraction,
            darkness: sliders.darkness,
            temperature: sliders.temperature,
            ownerAddress: walletAddress,
          }),
        });

        if (!mintRes.ok) {
          const data = await mintRes.json().catch(() => ({ error: `HTTP ${mintRes.status}` }));
          throw new Error(data.error || `Mint preparation failed (${mintRes.status})`);
        }

        const {
          metadataUri,
          avatarImageUri,
          personalityUri,
          personalityHash,
          agentAuthorityPubkey,
          personality,
        } = await mintRes.json() as {
          metadataUri: string;
          avatarImageUri: string;
          personalityUri: string;
          personalityHash: string;
          agentAuthorityPubkey: string;
          personality: AgentPersonality;
        };

        if (cancelled) return;

        // Step 2: Build & sign Solana transaction
        setMintPhase("approve");

        const assetSigner = generateSigner(umi);
        const builder = createV2(umi, {
          asset: assetSigner,
          owner: umi.identity.publicKey,
          updateAuthority: umiPublicKey(agentAuthorityPubkey),
          name: name.trim(),
          uri: metadataUri,
          plugins: none(),
          externalPluginAdapters: none(),
        });

        const blockhash = await umi.rpc.getLatestBlockhash({ commitment: "finalized" });
        const builtTx = builder.setBlockhash(blockhash).build(umi);

        let signedTxs;
        try {
          signedTxs = await signAllTransactions([
            { transaction: builtTx, signers: builder.getSigners(umi) },
          ]);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("User rejected") || message.includes("denied")) {
            throw new Error("Transaction was rejected. Please approve in your wallet.");
          }
          throw new Error(`Transaction signing failed: ${message}`);
        }

        if (cancelled) return;

        setMintPhase("minting");
        const sig = await umi.rpc.sendTransaction(signedTxs[0]);
        await umi.rpc.confirmTransaction(sig, {
          commitment: "confirmed",
          strategy: { type: "blockhash", ...blockhash },
        });

        if (cancelled) return;

        // Step 3: Register agent in database
        setMintPhase("registering");
        const registerRes = await fetch("/api/agent/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mintAddress: assetSigner.publicKey.toString(),
            ownerWallet: walletAddress,
            personality,
            personalityHash,
            personalityArweaveUri: personalityUri,
            avatarUrl: avatarImageUri,
          }),
        });

        if (!registerRes.ok) {
          const data = await registerRes.json().catch(() => ({ error: `HTTP ${registerRes.status}` }));
          throw new Error(data.error || `Registration failed (${registerRes.status})`);
        }

        const { agentId } = await registerRes.json() as { agentId: string };

        if (cancelled) return;

        setMintPhase("done");
        setMintResult({
          agentId,
          avatarUrl: avatarImageUri,
          name: personality.name,
          archetype: personality.archetype,
        });
      } catch (err) {
        if (cancelled) return;
        setMintPhase("error");
        setMintError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    mintAgent();
    return () => { cancelled = true; };
  }, [step, archetype, name, connected, walletAddress, sliders, umi]);

  // ============================================
  // Not authenticated
  // ============================================

  if (!authenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: "var(--color-accent)" }}>
        <TextureOverlay />
        <div className="flex flex-col items-center gap-6 relative z-10 px-6">
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--color-on-accent) 10%, transparent)" }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Shield className="w-8 h-8" style={{ color: "var(--color-on-accent)" }} />
          </motion.div>
          <h2 className="text-3xl font-bold text-center" style={{ color: "var(--color-on-accent)" }}>
            Connect to Create an Agent
          </h2>
          <p className="text-sm text-center max-w-md" style={{ color: "var(--color-on-accent)" }}>
            Sign in with your email or wallet to mint an AI creative agent on Solana.
          </p>
          <motion.button
            onClick={login}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: "var(--color-on-accent)", color: "var(--color-accent)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Connect Wallet
          </motion.button>
        </div>
      </div>
    );
  }

  // ============================================
  // Main flow
  // ============================================

  const nameValid = name.trim().length >= 2 && name.trim().length <= 20;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "var(--color-accent)" }}>
      <TextureOverlay />

      {/* Back to home — top left */}
      <div className="absolute top-6 left-6 z-20">
        <motion.a
          href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "var(--color-on-accent)" }}
          whileHover={{ x: -2 }}
        >
          <ArrowUp className="w-3.5 h-3.5 rotate-[-90deg]" />
          Home
        </motion.a>
      </div>

      {/* Step counter — top right */}
      <div className="absolute top-6 right-6 z-20">
        <span className="text-xs font-mono" style={{ color: "var(--color-on-accent)" }}>
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 0 — Name & Archetype */}
          {step === 0 && (
            <StepShell key="name" direction={direction}>
              <StepLabel number={1} text="Name your agent" />
              <div className="w-full max-w-md space-y-6">
                <div className="space-y-2">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Agent name..."
                    maxLength={20}
                    className="w-full px-6 py-4 rounded-2xl text-lg focus:outline-none transition-all"
                    style={{
                      background: "color-mix(in srgb, var(--color-on-accent) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-on-accent) 15%, transparent)",
                      color: "var(--color-on-accent)",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nameValid) next();
                    }}
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[11px]" style={{ color: "var(--color-on-accent)" }}>
                      {name.length}/20
                    </span>
                    {name.trim().length > 0 && name.trim().length < 2 && (
                      <span className="text-[11px]" style={{ color: "var(--color-on-accent)" }}>
                        At least 2 characters
                      </span>
                    )}
                  </div>
                </div>

                {/* Archetype grid */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center" style={{ color: "var(--color-on-accent)" }}>
                    Choose an archetype
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ARCHETYPES.map((a) => {
                      const Icon = a.icon;
                      const selected = archetype === a.id;
                      return (
                        <motion.button
                          key={a.id}
                          onClick={() => setArchetype(a.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all duration-200",
                            selected ? "opacity-100" : "opacity-60 hover:opacity-100"
                          )}
                          style={
                            selected
                              ? {
                                  background: "var(--color-on-accent)",
                                  color: "var(--color-accent)",
                                  boxShadow: `0 0 24px ${a.color}40`,
                                }
                              : {
                                  background: "color-mix(in srgb, var(--color-on-accent) 8%, transparent)",
                                  color: "var(--color-on-accent)",
                                  border: "1px solid color-mix(in srgb, var(--color-on-accent) 12%, transparent)",
                                }
                          }
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{a.label}</span>
                          <span className={cn("text-[10px] leading-tight", selected ? "opacity-70" : "opacity-50")}>
                            {a.description}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {/* Step 1 — Personality Sliders */}
          {step === 1 && (
            <StepShell key="sliders" direction={direction}>
              <StepLabel number={2} text="Tune the personality" />
              <div className="w-full max-w-lg space-y-6">
                {SLIDERS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-on-accent)" }}>
                          <Icon className="w-4 h-4" />
                          {s.label}
                        </label>
                        <div
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold min-w-[40px] text-center"
                          style={{
                            background: "color-mix(in srgb, var(--color-on-accent) 10%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent)",
                            color: "var(--color-on-accent)",
                          }}
                        >
                          {sliders[s.key]}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sliders[s.key]}
                        onChange={(e) => setSliders((prev) => ({ ...prev, [s.key]: parseInt(e.target.value) }))}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider"
                        style={{ background: "color-mix(in srgb, var(--color-on-accent) 15%, transparent)" }}
                      />
                      <p className="text-[11px]" style={{ color: "color-mix(in srgb, var(--color-on-accent) 60%, transparent)" }}>
                        {s.description}
                      </p>
                    </div>
                  );
                })}

                <button
                  onClick={() => setSliders({ complexity: 50, abstraction: 50, darkness: 50, temperature: 50 })}
                  className="text-xs transition-colors hover:opacity-80"
                  style={{ color: "var(--color-on-accent)" }}
                >
                  Reset to defaults
                </button>
              </div>
            </StepShell>
          )}

          {/* Step 2 — Minting / Success */}
          {step === 2 && (
            <StepShell key="mint" direction={direction}>
              {mintPhase === "done" && mintResult ? (
                /* Success */
                <div className="flex flex-col items-center gap-6">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-32 h-32 rounded-2xl overflow-hidden"
                    style={{ boxShadow: "0 0 40px color-mix(in srgb, var(--color-on-accent) 25%, transparent)" }}
                  >
                    <img
                      src={mintResult.avatarUrl}
                      alt={mintResult.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="text-center">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold"
                      style={{ color: "var(--color-on-accent)" }}
                    >
                      {mintResult.name}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm mt-1 capitalize"
                      style={{ color: "color-mix(in srgb, var(--color-on-accent) 70%, transparent)" }}
                    >
                      {mintResult.archetype} agent
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--color-on-accent) 10%, transparent)",
                      color: "var(--color-on-accent)",
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Minted on Solana
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => router.push(`/agent/${mintResult.agentId}`)}
                    className="flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
                    style={{
                      background: "var(--color-on-accent)",
                      color: "var(--color-accent)",
                      boxShadow: "0 4px 30px color-mix(in srgb, var(--color-on-accent) 25%, transparent)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Chat with {mintResult.name}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              ) : mintPhase === "error" ? (
                /* Error */
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="rounded-xl p-6 text-sm max-w-md text-center"
                    style={{
                      background: "color-mix(in srgb, var(--color-on-accent) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent)",
                      color: "var(--color-on-accent)",
                    }}
                  >
                    {mintError}
                  </div>
                  <button
                    onClick={() => {
                      setMintPhase("preparing");
                      setMintError(null);
                      goTo(0);
                    }}
                    className="text-sm transition-colors"
                    style={{ color: "var(--color-on-accent)" }}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                /* Loading */
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-28 h-28">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent)" }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent)" }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-10 h-10" style={{ color: "var(--color-on-accent)" }} />
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <motion.p
                      key={whimsicalWord}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-lg font-medium"
                      style={{ color: "var(--color-on-accent)" }}
                    >
                      {whimsicalWord}...
                    </motion.p>
                    <p className="text-xs" style={{ color: "color-mix(in srgb, var(--color-on-accent) 60%, transparent)" }}>
                      {PHASE_LABELS[mintPhase]}
                    </p>
                  </div>
                </div>
              )}
            </StepShell>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {step < 2 && (
        <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-6">
          {step > 0 ? (
            <motion.button
              onClick={prev}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: "var(--color-on-accent)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ x: -2 }}
            >
              <ArrowUp className="w-3.5 h-3.5 rotate-[-90deg]" />
              Previous
            </motion.button>
          ) : (
            <div />
          )}

          {step === 0 && (
            <motion.button
              onClick={next}
              disabled={!nameValid || !archetype}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "color-mix(in srgb, var(--color-on-accent) 10%, transparent)",
                color: "var(--color-on-accent)",
                border: "1px solid color-mix(in srgb, var(--color-on-accent) 20%, transparent)",
              }}
              whileHover={nameValid && archetype ? { scale: 1.02 } : undefined}
              whileTap={nameValid && archetype ? { scale: 0.98 } : undefined}
            >
              Tune Personality
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {step === 1 && (
            <motion.button
              onClick={next}
              disabled={!connected}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "var(--color-on-accent)",
                color: "var(--color-accent)",
                boxShadow: "0 4px 24px color-mix(in srgb, var(--color-on-accent) 25%, transparent)",
              }}
              whileHover={connected ? { scale: 1.02 } : undefined}
              whileTap={connected ? { scale: 0.98 } : undefined}
            >
              <Sparkles className="w-4 h-4" />
              Create Agent
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
