"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/effects/SmoothScroll";

// 50 accent colors — all high-saturation, bright enough for dark backgrounds.
// Spread across the full hue wheel so every reload feels distinct.
const ACCENTS = [
  "#ffff02", // Yellow
  "#ffe600", // Gold
  "#ffcc00", // Amber
  "#ffb300", // Honey
  "#ff9900", // Tangerine
  "#ff8000", // Orange
  "#ff6100", // Burnt Orange
  "#ff4400", // Red-Orange
  "#ff2a00", // Vermilion
  "#ff003c", // Crimson
  "#ff0055", // Ruby
  "#ff006e", // Raspberry
  "#ff0088", // Magenta
  "#ff00aa", // Hot Pink
  "#ff00cc", // Fuchsia
  "#ee00ff", // Purple-Pink
  "#cc00ff", // Violet
  "#aa00ff", // Purple
  "#8800ff", // Indigo
  "#6600ff", // Deep Indigo
  "#4400ff", // Blue-Violet
  "#2200ff", // Royal Blue
  "#0033ff", // Cobalt
  "#0055ff", // Azure
  "#0077ff", // Dodger Blue
  "#0099ff", // Sky Blue
  "#00aaff", // Cerulean
  "#00bbff", // Light Blue
  "#00ccff", // Cyan-Blue
  "#00ddff", // Bright Cyan
  "#00eeff", // Cyan
  "#00ffee", // Turquoise
  "#00ffcc", // Aquamarine
  "#00ffaa", // Mint
  "#00ff88", // Spring Green
  "#00ff66", // Emerald
  "#00ff44", // Green
  "#00ff22", // Lime Green
  "#22ff00", // Chartreuse
  "#44ff00", // Yellow-Green
  "#66ff00", // Lawn Green
  "#88ff00", // Lime
  "#aaff00", // Green-Yellow
  "#ccff00", // Pear
  "#eeff00", // Lemon
  "#f0e040", // Warm Yellow
  "#e8c840", // Marigold
  "#d4a040", // Goldenrod
  "#ff7744", // Coral
  "#44ffcc", // Seafoam
];

// Original lightning color in the statue image is purple (~280°)
const STATUE_BASE_HUE = 280;

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return hue;
}

function pickAccent() {
  const hex = ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Hue rotation to shift statue lightning from purple to accent color
  const targetHue = hexToHue(hex);
  let hueRotate = targetHue - STATUE_BASE_HUE;
  if (hueRotate < -180) hueRotate += 360;
  if (hueRotate > 180) hueRotate -= 360;
  return {
    accent: hex,
    dim: `rgba(${r}, ${g}, ${b}, 0.12)`,
    onAccent: luminance > 0.55 ? "#000" : "#fff",
    hueRotate: `${hueRotate}deg`,
  };
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const { accent, dim, onAccent, hueRotate } = pickAccent();
    document.documentElement.style.setProperty("--color-accent", accent);
    document.documentElement.style.setProperty("--color-accent-dim", dim);
    document.documentElement.style.setProperty("--color-on-accent", onAccent);
    document.documentElement.style.setProperty("--statue-hue-rotate", hueRotate);
  }, []);

  const isCreate = pathname === "/create";

  const content = (
    <div
      className={`min-h-screen text-gray-12 ${isHome ? "bg-gray-4" : "bg-gray-4 overflow-x-hidden"}`}
      data-page={isHome ? "home" : undefined}
    >
      <div className="relative z-10">
        {!isCreate && <Header />}
        <main>{children}</main>
        {!isHome && !isCreate && <Footer />}
      </div>
    </div>
  );

  if (isHome) return content;
  return <SmoothScroll>{content}</SmoothScroll>;
}
