"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import {
  Sparkles,
  LogOut,
  Wallet,
  Copy,
  Check,
  Menu,
  X,
  Plus,
  Search,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { shortenAddress } from "@/lib/utils";

export default function Header() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const copyAddress = async () => {
    if (!solanaWallet?.address) return;
    await navigator.clipboard.writeText(solanaWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-bold text-gradient">
              MintAI
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/create"
                className="flex items-center gap-2 bg-gradient-primary px-4 py-2 rounded-full text-white font-medium hover:shadow-neon transition-all"
              >
                <Plus className="w-4 h-4" />
                Create
              </Link>
              <Link
                href="/gallery"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Gallery
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="hidden lg:flex items-center gap-3 bg-dark-700 rounded-full px-4 py-2.5 border border-white/5">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search NFTs..."
                className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-gray-500"
              />
            </div>

            {/* Notification bell */}
            <button className="p-2.5 rounded-full hover:bg-dark-700 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-pink rounded-full" />
            </button>

            {authenticated ? (
              <>
                {solanaWallet && (
                  <button
                    onClick={copyAddress}
                    title={solanaWallet.address}
                    className="hidden lg:flex items-center gap-2 bg-dark-700 rounded-full px-4 py-2.5 border border-white/5 text-sm text-gray-300 hover:border-primary/30 transition-all"
                  >
                    <Wallet className="w-4 h-4 text-gray-400" />
                    {shortenAddress(solanaWallet.address)}
                    {copied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                )}
                <button
                  onClick={logout}
                  className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2.5 rounded-full text-sm text-gray-300 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={login}
                className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm px-6 py-2.5 rounded-full text-white font-medium border border-white/10 hover:bg-white/10 transition-all"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-full hover:bg-dark-700 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-dark-900/95 backdrop-blur-xl px-6 pb-4 pt-3">
          <nav className="flex flex-col gap-3">
            <Link
              href="/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMobileOpen(false)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Gallery
            </Link>
          </nav>
          {authenticated && solanaWallet && (
            <div className="mt-4 space-y-3 border-t border-white/5 pt-3">
              <button
                onClick={copyAddress}
                className="flex w-full items-center gap-2 bg-dark-700 rounded-full px-4 py-2.5 text-sm text-gray-300 border border-white/5"
              >
                <Wallet className="w-4 h-4 text-gray-400" />
                {shortenAddress(solanaWallet.address)}
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-500" />
                )}
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2 bg-white/5 rounded-full px-4 py-2.5 text-sm text-gray-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          {!authenticated && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <button
                onClick={() => {
                  login();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 bg-white/5 rounded-full px-6 py-2.5 text-white font-medium border border-white/10"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
