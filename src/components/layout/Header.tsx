"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { LogOut, Wallet, Copy, Check, Menu, X, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { shortenAddress } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const navLinks = [
    { href: "/create", label: "Create" },
    { href: "/gallery", label: "Gallery" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface-0/90 backdrop-blur-xl border-b border-white/[0.04]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Mint<span className="text-primary">AI</span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-full px-1 py-1 border border-white/[0.04]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === link.href
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                {solanaWallet && (
                  <button
                    onClick={copyAddress}
                    title={solanaWallet.address}
                    className="hidden lg:flex items-center gap-2 bg-white/[0.04] rounded-full px-4 py-2 border border-white/[0.06] text-sm text-gray-400 hover:text-white hover:border-white/[0.1] transition-all duration-300"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">
                      {shortenAddress(solanaWallet.address)}
                    </span>
                    {copied ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-40" />
                    )}
                  </button>
                )}
                <button
                  onClick={logout}
                  className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors duration-300 px-3 py-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="hidden md:flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors duration-300"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </button>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.04] bg-surface-0/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 mt-3 border-t border-white/[0.04]">
                {authenticated && solanaWallet ? (
                  <div className="space-y-2">
                    <button
                      onClick={copyAddress}
                      className="flex w-full items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] text-sm text-gray-400"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        {shortenAddress(solanaWallet.address)}
                      </span>
                      {copied ? (
                        <Check className="w-3 h-3 text-primary ml-auto" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-40 ml-auto" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      login();
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-medium"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
