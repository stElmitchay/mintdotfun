"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/effects/SmoothScroll";

const ACCENT_PALETTES = [
  { accent: "#ffff02", dim: "rgba(255, 255, 2, 0.12)" },   // Yellow
  { accent: "#00ff88", dim: "rgba(0, 255, 136, 0.12)" },    // Green
  { accent: "#4d9fff", dim: "rgba(77, 159, 255, 0.12)" },   // Blue
  { accent: "#ff2d95", dim: "rgba(255, 45, 149, 0.12)" },   // Pink
  { accent: "#ff6100", dim: "rgba(255, 97, 0, 0.12)" },     // Orange
  { accent: "#00e5ff", dim: "rgba(0, 229, 255, 0.12)" },    // Cyan
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const palette = ACCENT_PALETTES[Math.floor(Math.random() * ACCENT_PALETTES.length)];
    document.documentElement.style.setProperty("--color-accent", palette.accent);
    document.documentElement.style.setProperty("--color-accent-dim", palette.dim);
  }, []);

  const content = (
    <div
      className={`min-h-screen text-gray-12 ${isHome ? "bg-gray-4" : "bg-gray-4 overflow-x-hidden"}`}
      data-page={isHome ? "home" : undefined}
    >
      <div className="relative z-10">
        <Header />
        <main>{children}</main>
        {!isHome && <Footer />}
      </div>
    </div>
  );

  if (isHome) return content;
  return <SmoothScroll>{content}</SmoothScroll>;
}
