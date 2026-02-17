"use client";

import { Twitter, Send, Github } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useScrollReveal } from "@/hooks/useGSAP";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useScrollReveal(footerRef, { y: 30, duration: 0.8 });

  return (
    <footer ref={footerRef} className="border-t border-white/[0.04] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + copy */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-bold text-white tracking-tight"
            >
              Mint<span className="text-primary">AI</span>
            </Link>
            <span className="text-xs text-gray-600">
              AI-powered NFTs on Solana
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/create"
              className="text-xs text-gray-500 hover:text-white transition-colors duration-300"
            >
              Create
            </Link>
            <Link
              href="/gallery"
              className="text-xs text-gray-500 hover:text-white transition-colors duration-300"
            >
              Gallery
            </Link>
            <div className="w-px h-3 bg-white/[0.06]" />
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: "#" },
                { icon: Send, href: "#" },
                { icon: Github, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="text-gray-600 hover:text-white transition-colors duration-300"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-700">
            &copy; {new Date().getFullYear()} MintAI
          </p>
        </div>
      </div>
    </footer>
  );
}
