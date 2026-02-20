"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { LogOut, Wallet, Copy, Check } from "lucide-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Header() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyAddress = async () => {
    if (!solanaWallet?.address) return;
    await navigator.clipboard.writeText(solanaWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-gray-4/80 border-b border-gray-a3"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-medium text-gray-12 tracking-tight">
            mint<span className="text-accent">IT</span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                {solanaWallet && (
                  <button
                    onClick={copyAddress}
                    title={solanaWallet.address}
                    className="flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">
                      {shortenAddress(solanaWallet.address)}
                    </span>
                    {copied ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-40" />
                    )}
                  </button>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors duration-300 px-3 py-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-5 py-2 rounded-full text-sm font-medium font-semibold hover:opacity-90 transition-all duration-300"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
