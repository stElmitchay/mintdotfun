"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/effects/SmoothScroll";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

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
