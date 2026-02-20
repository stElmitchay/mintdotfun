"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Upload,
  X,
  Check,
  RefreshCw,
  Trash2,
  ArrowRight,
  ArrowUp,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Orbit,
  Zap,
  Waves,
  Grid3X3,
  Flame,
  Hexagon,
  Star,
  Diamond,
  Pentagon,
  Triangle,
  Circle,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedImage, GenerationStatus } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS, GENERATION } from "@/lib/constants";
import MintPanel from "@/components/create/MintPanel";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// Style presets
// ============================================

const STYLE_PRESETS = GENERATION.ALLOWED_STYLES.map((id) => ({
  id,
  label:
    id === "none"
      ? "No style"
      : id
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
}));

// ============================================
// Texture
// ============================================

const TEXTURE_ICONS = [
  Orbit, Zap, Waves, Grid3X3, Flame,
  Sparkles, Hexagon, Star, Diamond, Pentagon, Triangle,
  Circle, Square,
];

const TEXTURE_POSITIONS = [
  { x: 5, y: 8, size: 16, rotate: 15, opacity: 0.04 },
  { x: 20, y: 65, size: 12, rotate: -30, opacity: 0.03 },
  { x: 38, y: 20, size: 18, rotate: 45, opacity: 0.05 },
  { x: 8, y: 42, size: 14, rotate: -15, opacity: 0.03 },
  { x: 52, y: 10, size: 11, rotate: 60, opacity: 0.03 },
  { x: 15, y: 82, size: 20, rotate: -45, opacity: 0.04 },
  { x: 45, y: 52, size: 13, rotate: 30, opacity: 0.03 },
  { x: 28, y: 35, size: 16, rotate: -60, opacity: 0.04 },
  { x: 60, y: 72, size: 12, rotate: 20, opacity: 0.03 },
  { x: 72, y: 25, size: 14, rotate: -25, opacity: 0.03 },
  { x: 85, y: 55, size: 18, rotate: 50, opacity: 0.04 },
  { x: 78, y: 85, size: 11, rotate: -40, opacity: 0.03 },
  { x: 90, y: 15, size: 15, rotate: 35, opacity: 0.03 },
  { x: 65, y: 45, size: 13, rotate: -10, opacity: 0.03 },
  { x: 35, y: 75, size: 17, rotate: 70, opacity: 0.04 },
  { x: 55, y: 90, size: 12, rotate: -55, opacity: 0.03 },
];

// ============================================
// Step animation variants
// ============================================

const stepVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// ============================================
// Main component
// ============================================

export default function CreatePage() {
  const { authenticated, login } = usePrivy();

  const [prompt, setPrompt] = useLocalStorage(STORAGE_KEYS.PROMPT, "");
  const [style, setStyle] = useLocalStorage(STORAGE_KEYS.STYLE, "none");
  const [count, setCount] = useState(4);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const [generatedImages, setGeneratedImages, { clear: clearImages }] =
    useLocalStorage<GeneratedImage[]>(STORAGE_KEYS.GENERATED_IMAGES, []);
  const [status, setStatus] = useState<GenerationStatus>(
    () => (generatedImages.length > 0 ? "complete" : "idle") as GenerationStatus
  );
  const [error, setError] = useState<string | null>(null);
  const [showMintPanel, setShowMintPanel] = useState(false);

  // Step management: 0=prompt, 1=style, 2=settings, 3=results
  const [step, setStep] = useState(() => (generatedImages.length > 0 ? 3 : 0));
  const [direction, setDirection] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const next = () => goTo(step + 1);
  const prev = () => goTo(step - 1);

  // Auto-focus textarea when entering step 0
  useEffect(() => {
    if (step === 0 && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [step]);

  // Keyboard: Enter to advance (except in textarea), Escape to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (step === 0 && prompt.trim()) next();
        else if (step === 1) next();
        else if (step === 2) handleGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (
        !(GENERATION.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)
      ) {
        setError(`Invalid image type.`);
        return;
      }
      if (file.size > GENERATION.MAX_REFERENCE_IMAGE_SIZE) {
        setError("Reference image must be under 5MB");
        return;
      }
      setError(null);
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setReferenceImage(ev.target?.result as string);
      reader.onerror = () => {
        setError("Failed to read image file");
        setReferenceFile(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceFile(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus("generating");
    setError(null);
    goTo(3);
    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("count", count.toString());
      if (style !== "none") formData.append("style", style);
      if (referenceFile) formData.append("referenceImage", referenceFile);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new Error("No images returned from generation");
      }
      const newImages: GeneratedImage[] = data.images.map(
        (url: string, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          url,
          prompt: data.prompt,
          selected: false,
        })
      );
      setGeneratedImages(newImages);
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleClearImages = () => {
    clearImages();
    setStatus("idle");
    goTo(0);
  };

  const selectImage = (id: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) => ({
        ...img,
        selected: img.id === id ? !img.selected : false,
      }))
    );
  };

  const selectedImage = generatedImages.find((img) => img.selected) ?? null;

  // Total steps for the progress indicator
  const TOTAL_STEPS = 4;

  // ============================================
  // Not authenticated
  // ============================================

  if (!authenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gray-4">
        <TextureOverlay />
        <div className="flex flex-col items-center gap-6 relative z-10 px-6">
          <motion.div
            className="w-20 h-20 rounded-full bg-accent-dim flex items-center justify-center"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-8 h-8 text-accent" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white text-center">
            Connect to Start Creating
          </h2>
          <p className="text-gray-8 text-sm text-center max-w-md">
            Sign in with your email or wallet to create AI-generated NFTs on Solana.
          </p>
          <motion.button
            onClick={login}
            className="flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
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

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gray-4">
      <TextureOverlay />

      {/* Back to home — top left */}
      <div className="absolute top-6 left-6 z-20">
        <motion.a
          href="/"
          className="flex items-center gap-2 text-sm text-gray-8 hover:text-white transition-colors"
          whileHover={{ x: -2 }}
        >
          <ArrowUp className="w-3.5 h-3.5 rotate-[-90deg]" />
          Home
        </motion.a>
      </div>

      {/* Step counter — top right */}
      <div className="absolute top-6 right-6 z-20">
        <span className="text-xs text-gray-7 font-mono">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Step content — full height, centered */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <StepShell key="prompt" direction={direction}>
              <StepLabel number={1} text="What do you want to create?" />
              <div className="w-full max-w-2xl space-y-4">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cosmic whale swimming through neon galaxies..."
                  rows={4}
                  className="w-full px-6 py-5 bg-gray-2 border border-gray-a3 rounded-2xl text-gray-12 text-lg placeholder-gray-7 focus:border-accent/40 focus:outline-none transition-all resize-none"
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      next();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-8">
                    {prompt.length}/2000
                  </span>
                  <span className="text-[11px] text-gray-7">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-3 rounded text-gray-9 text-[10px] font-mono">Enter ↵</kbd> to continue
                  </span>
                </div>
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell key="style" direction={direction}>
              <StepLabel number={2} text="Pick an art style" />
              <div className="w-full max-w-3xl">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {STYLE_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      onClick={() => {
                        setStyle(preset.id);
                        // Auto-advance after picking
                        setTimeout(next, 300);
                      }}
                      className={cn(
                        "px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-center",
                        style === preset.id
                          ? "bg-accent text-[var(--color-on-accent)] ring-2 ring-accent/30 ring-offset-2 ring-offset-gray-4"
                          : "bg-gray-2 text-gray-11 hover:text-gray-12 border border-gray-a3 hover:border-accent/30"
                      )}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell key="settings" direction={direction}>
              <StepLabel number={3} text="Fine-tune your creation" />
              <div className="w-full max-w-lg space-y-8">
                {/* Variations */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-11">
                    <Layers className="w-4 h-4 text-accent" />
                    How many variations?
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={GENERATION.MIN_COUNT}
                      max={GENERATION.MAX_COUNT}
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-4 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="px-3 py-1.5 bg-accent-dim border border-accent/20 rounded-lg text-accent text-sm font-semibold min-w-[48px] text-center">
                      {count}
                    </div>
                  </div>
                </div>

                {/* Reference Image */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-11">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    Reference image
                    <span className="text-gray-7 font-normal text-xs">(optional)</span>
                  </label>
                  {referenceImage ? (
                    <div className="relative group inline-block">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-40 h-40 object-cover rounded-xl border border-gray-a3"
                      />
                      <button
                        onClick={removeReferenceImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-40 h-40 border border-dashed border-gray-a4 rounded-xl cursor-pointer hover:border-accent/30 transition-all group bg-gray-2">
                      <Upload className="w-5 h-5 text-gray-7 group-hover:text-accent transition-colors mb-2" />
                      <span className="text-xs text-gray-7 group-hover:text-gray-11 transition-colors">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept={GENERATION.ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell key="results" direction={direction}>
              {status === "generating" ? (
                /* Generating animation */
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-28 h-28">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent/20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-10 h-10 text-accent" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-gray-12 font-medium mb-1">
                      Creating your artwork
                    </p>
                    <p className="text-sm text-gray-8">
                      Generating {count} variation{count > 1 ? "s" : ""}...
                    </p>
                  </div>
                </div>
              ) : error ? (
                /* Error state */
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-400 max-w-md text-center">
                    {error}
                  </div>
                  <button
                    onClick={() => goTo(0)}
                    className="text-sm text-gray-8 hover:text-white transition-colors"
                  >
                    Start over
                  </button>
                </div>
              ) : (
                /* Results grid */
                <div className="w-full max-w-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-12">
                      Pick your <span className="text-accent">favorite</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleClearImages}
                        className="flex items-center gap-1.5 text-xs text-gray-8 hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          goTo(0);
                        }}
                        className="flex items-center gap-1.5 text-xs text-accent hover:opacity-70 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Redo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generatedImages.map((img, i) => (
                      <motion.button
                        key={img.id}
                        onClick={() => selectImage(img.id)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border-2 transition-all",
                          img.selected
                            ? "border-accent"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={
                          img.selected
                            ? { boxShadow: "0 0 30px color-mix(in srgb, var(--color-accent) 20%, transparent)" }
                            : undefined
                        }
                      >
                        <img
                          src={img.url}
                          alt="Generated NFT"
                          className="aspect-square w-full object-cover"
                        />
                        <div
                          className={cn(
                            "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-all",
                            img.selected
                              ? "bg-accent text-[var(--color-on-accent)]"
                              : "bg-black/40 backdrop-blur-sm text-gray-500"
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {selectedImage && (
                    <motion.button
                      onClick={() => setShowMintPanel(true)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full flex items-center justify-center gap-3 bg-accent px-8 py-5 rounded-xl text-[var(--color-on-accent)] font-semibold hover:opacity-90 transition-colors text-sm"
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      style={{ boxShadow: "0 4px 30px color-mix(in srgb, var(--color-accent) 25%, transparent)" }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Mint as NFT
                    </motion.button>
                  )}
                </div>
              )}
            </StepShell>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation — prev / next */}
      {status !== "generating" && (
        <div className="relative z-20 flex items-center justify-between px-8 py-6">
          {/* Previous */}
          {step > 0 && step < 3 ? (
            <motion.button
              onClick={prev}
              className="flex items-center gap-2 text-sm text-gray-8 hover:text-white transition-colors"
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

          {/* Next / Generate */}
          {step === 0 && (
            <motion.button
              onClick={next}
              disabled={!prompt.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-gray-2 text-gray-12 border border-gray-a3 hover:border-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={prompt.trim() ? { scale: 1.02 } : undefined}
              whileTap={prompt.trim() ? { scale: 0.98 } : undefined}
            >
              Choose Style
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
          {step === 1 && (
            <motion.button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-gray-2 text-gray-12 border border-gray-a3 hover:border-accent/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Settings
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
          {step === 2 && (
            <motion.button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-accent text-[var(--color-on-accent)] hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              whileHover={prompt.trim() ? { scale: 1.02 } : undefined}
              whileTap={prompt.trim() ? { scale: 0.98 } : undefined}
              style={{ boxShadow: "0 4px 24px color-mix(in srgb, var(--color-accent) 25%, transparent)" }}
            >
              <Sparkles className="w-4 h-4" />
              Generate Artwork
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
          {step === 3 && <div />}
        </div>
      )}

      {/* Mint Panel Modal */}
      {showMintPanel && selectedImage && (
        <MintPanel
          image={selectedImage}
          onClose={() => setShowMintPanel(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Step shell — centers content, handles animation
// ============================================

function StepShell({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: number;
}) {
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

// ============================================
// Step label — question number + text
// ============================================

function StepLabel({ number, text }: { number: number; text: string }) {
  return (
    <div className="text-center">
      <span className="text-xs text-accent font-mono mb-2 block">
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-12 tracking-tight">
        {text}
      </h2>
    </div>
  );
}


// ============================================
// Texture overlay
// ============================================

function TextureOverlay() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden
    >
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
              color: "var(--color-accent)",
            }}
          />
        );
      })}
    </div>
  );
}
