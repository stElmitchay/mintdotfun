"use client";

import { useState } from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";

interface CityInputProps {
  onGenerate: (city: string, country?: string, theme?: string) => void;
  generating: boolean;
  error: string | null;
}

export default function CityInput({
  onGenerate,
  generating,
  error,
}: CityInputProps) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [theme, setTheme] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    onGenerate(city.trim(), country.trim() || undefined, theme.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-accent mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Create a Mirror
          </span>
        </div>
        <h1 className="text-3xl font-medium text-gray-12 mb-2">
          Bring a city to life
        </h1>
        <p className="text-sm text-gray-9 leading-relaxed">
          Enter a city name and AI will generate a complete living mirror
          configuration — landmarks, art style, cultural events, and data feeds.
        </p>
      </div>

      <div className="space-y-4">
        {/* City name */}
        <div>
          <label className="block text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
            City Name *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-7" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Seoul, Buenos Aires, Cape Town..."
              className="w-full bg-gray-3 border border-gray-a3 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent transition-colors"
              disabled={generating}
            />
          </div>
        </div>

        {/* Country (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
            Country (optional)
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. South Korea"
            className="w-full bg-gray-3 border border-gray-a3 rounded-xl px-4 py-3 text-sm text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent transition-colors"
            disabled={generating}
          />
        </div>

        {/* Theme (optional) */}
        <div>
          <label className="block text-xs font-medium text-gray-8 uppercase tracking-wider mb-2">
            Art Style / Theme (optional)
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. cyberpunk, watercolor, minimalist..."
            className="w-full bg-gray-3 border border-gray-a3 rounded-xl px-4 py-3 text-sm text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent transition-colors"
            disabled={generating}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!city.trim() || generating}
        className="mt-6 w-full bg-accent text-[var(--color-on-accent)] py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating config...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Mirror Config
          </>
        )}
      </button>
    </form>
  );
}
