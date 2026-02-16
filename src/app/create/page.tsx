"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Sparkles,
  Upload,
  ImagePlus,
  Loader2,
  X,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedImage, GenerationStatus } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS, GENERATION } from "@/lib/constants";
import MintPanel from "@/components/create/MintPanel";

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

      // Validate file type
      if (
        !(GENERATION.ALLOWED_IMAGE_TYPES as readonly string[]).includes(
          file.type
        )
      ) {
        setError(
          `Invalid image type. Allowed: ${GENERATION.ALLOWED_IMAGE_TYPES.join(", ")}`
        );
        return;
      }

      // Validate file size
      if (file.size > GENERATION.MAX_REFERENCE_IMAGE_SIZE) {
        setError("Reference image must be under 5MB");
        return;
      }

      setError(null);
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
      };
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

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

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

  // Single-select: clicking an image selects it and deselects all others
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-2xl font-bold text-white">
          Connect to Start Creating
        </h2>
        <p className="text-zinc-400">
          Sign in with your email or wallet to create your NFT.
        </p>
        <button
          onClick={login}
          className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Your NFT</h1>
        <p className="mt-2 text-zinc-400">
          Describe your artwork and let AI generate variations. Pick your favorite to mint.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Input Panel */}
        <div className="space-y-6">
          {/* Prompt */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Describe your artwork
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A mystical forest creature with bioluminescent features in a dreamlike environment..."
              className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-violet-500"
              disabled={status === "generating"}
              maxLength={2000}
            />
          </div>

          {/* Style Preset */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setStyle(preset.id)}
                  disabled={status === "generating"}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    style === preset.id
                      ? "border-violet-500 bg-violet-500/20 text-violet-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Reference / Inspiration Image (optional)
            </label>
            {referenceImage ? (
              <div className="relative inline-block">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="h-32 w-32 rounded-xl border border-zinc-800 object-cover"
                />
                <button
                  onClick={removeReferenceImage}
                  className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400">
                <Upload className="mb-2 h-6 w-6" />
                <span className="text-xs">Click to upload (max 5MB)</span>
                <input
                  type="file"
                  accept={GENERATION.ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Count */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Number of variations: {count}
            </label>
            <input
              type="range"
              min={GENERATION.MIN_COUNT}
              max={GENERATION.MAX_COUNT}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              disabled={status === "generating"}
              className="w-full accent-violet-500"
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-600">
              <span>{GENERATION.MIN_COUNT}</span>
              <span>{GENERATION.MAX_COUNT}</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || status === "generating"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "generating" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {generatedImages.length > 0
                  ? "Generate New Variations"
                  : "Generate Variations"}
              </>
            )}
          </button>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Right: Generated Images / Preview */}
        <div>
          {generatedImages.length === 0 ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
              <ImagePlus className="mb-3 h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-600">
                Your generated artwork will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Pick your favorite
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearImages}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={status === "generating"}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {generatedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => selectImage(img.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 transition-all",
                      img.selected
                        ? "border-violet-500 shadow-lg shadow-violet-500/10"
                        : "border-zinc-800 opacity-60 hover:opacity-80"
                    )}
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
                          ? "bg-violet-500 text-white"
                          : "bg-zinc-800/80 text-zinc-500"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              {selectedImage && (
                <button
                  onClick={() => setShowMintPanel(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-medium text-white transition-all hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Mint as NFT
                </button>
              )}
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
