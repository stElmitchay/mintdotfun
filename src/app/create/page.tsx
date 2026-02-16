"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Sparkles,
  Upload,
  ImagePlus,
  X,
  Check,
  RefreshCw,
  Trash2,
  Rocket,
  ArrowLeft,
  Layers,
  BookOpen,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedImage, GenerationStatus } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS, GENERATION } from "@/lib/constants";
import MintPanel from "@/components/create/MintPanel";
import Link from "next/link";

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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Connect to Start Creating
          </h2>
          <p className="text-gray-400 text-lg text-center max-w-md">
            Sign in with your email or wallet to create AI-generated NFTs on Solana.
          </p>
          <button
            onClick={login}
            className="flex items-center gap-3 bg-gradient-primary px-8 py-4 rounded-full text-white font-semibold hover:shadow-neon-lg transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back link */}
        <div className="mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Create Your <span className="text-gradient">AI NFT</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Describe your vision and let AI generate unique artwork. Pick your
            favorite and mint it as a 1-of-1 NFT on Solana.
          </p>
        </div>

        {/* Main form area */}
        <div className="space-y-8">
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-neon">
            {/* Prompt */}
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="w-5 h-5 text-primary" />
                Describe Your Artwork
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell us your vision. What style, theme, and mood should the AI capture? Be as detailed as you like..."
                rows={6}
                className="w-full px-6 py-4 bg-dark-700/50 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                disabled={status === "generating"}
                maxLength={2000}
              />
              <p className="text-sm text-gray-400">
                Describe your vision in detail to help AI generate better artwork
              </p>
            </div>

            {/* Style Preset */}
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="w-5 h-5 text-primary" />
                Art Style
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStyle(preset.id)}
                    disabled={status === "generating"}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      style === preset.id
                        ? "bg-primary text-white shadow-neon"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:border-white/20"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Variations Count */}
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-2 text-lg font-semibold">
                <Layers className="w-5 h-5 text-primary" />
                Number of Variations
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={GENERATION.MIN_COUNT}
                  max={GENERATION.MAX_COUNT}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  disabled={status === "generating"}
                  className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary font-semibold min-w-[60px] text-center">
                  {count}
                </div>
              </div>
              <p className="text-sm text-gray-400">
                More variations give you more options to choose from
              </p>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="w-5 h-5 text-primary" />
                Inspiration Image (Optional)
              </label>
              <p className="text-sm text-gray-400 mb-4">
                Upload an image to inspire the AI generation. This can be an art
                style, color palette, or concept you like.
              </p>
              {referenceImage ? (
                <div className="relative group inline-block">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full max-w-xs h-48 object-cover rounded-2xl border border-white/10"
                  />
                  <button
                    onClick={removeReferenceImage}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full max-w-xs h-48 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-primary/50 transition-all group">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-sm text-gray-400 group-hover:text-primary transition-colors">
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

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === "generating"}
            className="w-full flex items-center justify-center gap-3 bg-gradient-primary px-8 py-6 rounded-2xl text-white font-semibold hover:shadow-neon-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-lg"
          >
            {status === "generating" ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Artwork...
              </>
            ) : (
              <>
                <Rocket className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {generatedImages.length > 0
                  ? "Generate New Variations"
                  : "Generate Artwork"}
              </>
            )}
          </button>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  Pick Your <span className="text-gradient">Favorite</span>
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleClearImages}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={status === "generating"}
                    className="flex items-center gap-2 text-sm text-primary-light hover:text-primary transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => selectImage(img.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border-2 transition-all card-hover",
                      img.selected
                        ? "border-primary shadow-neon"
                        : "border-white/5 opacity-70 hover:opacity-100 hover:border-white/20"
                    )}
                  >
                    <img
                      src={img.url}
                      alt="Generated NFT"
                      className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className={cn(
                        "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                        img.selected
                          ? "bg-gradient-primary text-white shadow-neon"
                          : "bg-dark-700/80 backdrop-blur-sm text-gray-500"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>

              {selectedImage && (
                <button
                  onClick={() => setShowMintPanel(true)}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-primary px-8 py-6 rounded-2xl text-white font-semibold hover:shadow-neon-lg transition-all group text-lg"
                >
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Mint as NFT
                </button>
              )}
            </div>
          )}

          {/* Empty state for generated images */}
          {generatedImages.length === 0 && status !== "generating" && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-dark-800/30 py-20">
              <ImagePlus className="mb-4 h-16 w-16 text-gray-600" />
              <p className="text-gray-500 text-lg">
                Your generated artwork will appear here
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
