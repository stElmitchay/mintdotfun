"use client";

import { type ReactNode } from "react";

interface SheetProps {
  variant?: "default" | "yellow";
  className?: string;
  children: ReactNode;
  noPadding?: boolean;
}

export default function Sheet({
  variant = "default",
  className = "",
  children,
  noPadding = false,
}: SheetProps) {
  const base =
    variant === "yellow"
      ? "sheet-yellow text-gray-1"
      : "sheet";

  const padding = noPadding ? "" : "p-6 md:p-10 lg:p-16";

  return (
    <section className={`${base} ${padding} ${className}`}>
      {children}
    </section>
  );
}
