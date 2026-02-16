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
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Connect to Start Creating
          </h2>
          <p className="text-gray-500 text-sm text-center max-w-md">
            Sign in with your email or wallet to create AI-generated NFTs on Solana.
          </p>
          <motion.button
            onClick={login}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
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
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Create Your <span className="text-primary">AI NFT</span>
            </h1>
            <p className="text-gray-500 text-sm">
              Describe your vision and let AI generate unique artwork.
            </p>
          </div>
        </FadeUp>

        {/* Main form */}
        <div className="space-y-8">
          <FadeUp delay={0.2}>
            <div className="bg-surface-1 rounded-2xl border border-white/[0.04] p-8 space-y-8">
              {/* Prompt */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Describe Your Artwork
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell us your vision..."
                  rows={5}
                  className="w-full px-5 py-4 bg-surface-2 border border-white/[0.06] rounded-xl text-white text-sm placeholder-gray-600 focus:border-primary/40 focus:outline-none transition-all resize-none"
                  disabled={status === "generating"}
                  maxLength={2000}
                />
              </div>

              {/* Style Preset */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Sparkles className="w-4 h-4 text-primary" />
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
                          ? "bg-primary text-white"
                          : "bg-surface-2 text-gray-400 hover:text-white border border-white/[0.06] hover:border-white/[0.1]"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variations */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Layers className="w-4 h-4 text-primary" />
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
                    className="flex-1 h-1.5 bg-surface-3 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm font-semibold min-w-[48px] text-center">
                    {count}
                  </div>
                </div>
              </div>

              {/* Reference Image */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Inspiration Image
                  <span className="text-gray-600 font-normal">(Optional)</span>
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
                  <label className="flex flex-col items-center justify-center w-full max-w-xs h-40 border border-dashed border-white/[0.1] rounded-xl cursor-pointer hover:border-primary/30 transition-all group bg-surface-2">
                    <Upload className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-2" />
                    <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
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
              className="w-full flex items-center justify-center gap-3 bg-primary px-8 py-5 rounded-xl text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <FadeUp>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Pick Your <span className="text-primary">Favorite</span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleClearImages}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={status === "generating"}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {generatedImages.map((img) => (
                    <motion.button
                      key={img.id}
                      onClick={() => selectImage(img.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border-2 transition-all",
                        img.selected
                          ? "border-primary"
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
                            ? "bg-primary text-white"
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
                    className="w-full flex items-center justify-center gap-3 bg-primary px-8 py-5 rounded-xl text-white font-semibold hover:bg-primary-dark transition-colors text-sm"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Mint as NFT
                  </motion.button>
                )}
              </div>
            </FadeUp>
          )}

          {/* Empty state */}
          {generatedImages.length === 0 && status !== "generating" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-surface-1/50 py-20">
              <ImagePlus className="mb-3 h-10 w-10 text-gray-700" />
              <p className="text-gray-600 text-sm">
                Generated artwork will appear here
              </p>
            </div>
          )}
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
