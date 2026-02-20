"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Upload,
  ImagePlus,
  X,
  Check,
  RefreshCw,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Layers,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
  Loader2,
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
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/motion";

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

// Texture icons for background pattern
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

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (
        !(GENERATION.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)
      ) {
        setError(
          `Invalid image type. Allowed: ${GENERATION.ALLOWED_IMAGE_TYPES.join(", ")}`
        );
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

  if (!authenticated) {
    return (
      <div className="min-h-screen pt-24 pb-12 relative overflow-hidden">
        {/* Texture */}
        <TextureOverlay />
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh] gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-accent-dim flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Connect to Start Creating
          </h2>
          <p className="text-gray-500 text-sm text-center max-w-md">
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

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden">
      {/* Background texture */}
      <TextureOverlay />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Back link */}
        <FadeUp>
          <div className="mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-300 mb-6 text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>
        </FadeUp>

        {/* Header */}
        <FadeUp delay={0.1}>
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Create Your{" "}
              <span className="text-accent">NFT</span>
            </h1>
            <p className="text-gray-500 text-sm">
              Describe your vision and let AI generate unique artwork.
            </p>
          </div>
        </FadeUp>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Left — form */}
          <div className="space-y-6">
            <FadeUp delay={0.2}>
              <div className="bg-gray-2 rounded-2xl border border-gray-a3 p-8 space-y-8">
                {/* Prompt */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-11">
                    <BookOpen className="w-4 h-4 text-accent" />
                    Describe Your Artwork
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A cosmic whale swimming through neon galaxies..."
                    rows={5}
                    className="w-full px-5 py-4 bg-gray-3 border border-gray-a3 rounded-xl text-gray-12 text-sm placeholder-gray-8 focus:border-accent/40 focus:outline-none transition-all resize-none"
                    disabled={status === "generating"}
                    maxLength={2000}
                  />
                  <div className="flex justify-end">
                    <span className="text-[11px] text-gray-8">
                      {prompt.length}/2000
                    </span>
                  </div>
                </div>

                {/* Style Presets */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-11">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Art Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setStyle(preset.id)}
                        disabled={status === "generating"}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-medium transition-all duration-300",
                          style === preset.id
                            ? "bg-accent text-[var(--color-on-accent)]"
                            : "bg-gray-3 text-gray-11 hover:text-gray-12 border border-gray-a4 hover:border-gray-a6"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variations */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-11">
                    <Layers className="w-4 h-4 text-accent" />
                    Variations
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={GENERATION.MIN_COUNT}
                      max={GENERATION.MAX_COUNT}
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      disabled={status === "generating"}
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
                    Inspiration Image
                    <span className="text-gray-8 font-normal">(Optional)</span>
                  </label>
                  {referenceImage ? (
                    <div className="relative group inline-block">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-full max-w-xs h-40 object-cover rounded-xl"
                      />
                      <button
                        onClick={removeReferenceImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full max-w-xs h-40 border border-dashed border-gray-a4 rounded-xl cursor-pointer hover:border-accent/30 transition-all group bg-gray-3">
                      <Upload className="w-5 h-5 text-gray-8 group-hover:text-accent transition-colors mb-2" />
                      <span className="text-xs text-gray-8 group-hover:text-gray-11 transition-colors">
                        Upload Image
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
            </FadeUp>

            {/* Generate Button */}
            <FadeUp delay={0.3}>
              <motion.button
                onClick={handleGenerate}
                disabled={!prompt.trim() || status === "generating"}
                className="w-full flex items-center justify-center gap-3 bg-accent px-8 py-5 rounded-xl text-[var(--color-on-accent)] font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                {status === "generating" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Artwork...
                  </>
                ) : (
                  <>
                    {generatedImages.length > 0
                      ? "Generate New Variations"
                      : "Generate Artwork"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </FadeUp>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right — preview / results */}
          <div className="space-y-6">
            {/* Generated Images */}
            {generatedImages.length > 0 ? (
              <FadeUp>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-11">
                      Pick Your <span className="text-accent">Favorite</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleClearImages}
                        className="flex items-center gap-1.5 text-[11px] text-gray-8 hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={status === "generating"}
                        className="flex items-center gap-1.5 text-[11px] text-accent hover:opacity-70 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Redo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {generatedImages.map((img) => (
                      <motion.button
                        key={img.id}
                        onClick={() => selectImage(img.id)}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border-2 transition-all",
                          img.selected
                            ? "border-accent"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                      className="w-full flex items-center justify-center gap-3 bg-accent px-6 py-4 rounded-xl text-[var(--color-on-accent)] font-semibold hover:opacity-90 transition-colors text-sm"
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Mint as NFT
                    </motion.button>
                  )}
                </div>
              </FadeUp>
            ) : (
              <FadeUp delay={0.3}>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-a3 bg-gray-2/50 py-20 min-h-[380px]">
                  <ImagePlus className="mb-3 h-10 w-10 text-gray-7" />
                  <p className="text-gray-8 text-sm">
                    Generated artwork will appear here
                  </p>
                </div>
              </FadeUp>
            )}
          </div>
        </div>
      </div>

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

// Scattered vector icon texture overlay
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
