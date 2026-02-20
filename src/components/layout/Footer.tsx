"use client";

import { Twitter, Send, Github } from "lucide-react";
import Link from "next/link";
import Sheet from "@/components/ui/Sheet";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-8">
      <Sheet className="relative min-h-[300px]">
        <motion.div
          className="relative w-full h-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* ContactFrame — 4-corner layout */}

          {/* Top-left */}
          <div className="absolute top-0 left-0">
            <Link
              href="/create"
              className="text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300"
            >
              Create
            </Link>
          </div>

          {/* Top-right */}
          <div className="absolute top-0 right-0">
            <Link
              href="/gallery"
              className="text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300"
            >
              Gallery
            </Link>
          </div>

          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0">
            <p className="text-xs text-gray-8">
              &copy; {new Date().getFullYear()} mintIT
            </p>
          </div>

          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 flex items-center gap-4">
            {[
              { icon: Twitter, href: "https://x.com/el_saintt", label: "X" },
              { icon: Send, href: "#", label: "Telegram" },
              { icon: Github, href: "https://github.com/stElmitchay/mintdotfun", label: "GitHub" },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                className="text-accent hover:opacity-70 transition-opacity duration-300"
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Center */}
          <div className="flex items-center justify-center min-h-[220px]">
            <Link
              href="/"
              className="text-2xl font-medium text-gray-12 tracking-tight hover:text-accent transition-colors duration-300"
            >
              mint<span className="text-accent">IT</span>
            </Link>
          </div>
        </motion.div>
      </Sheet>
    </div>
  );
}
