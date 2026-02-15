"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Sparkles, LogOut, Wallet, Copy, Check, Menu, X } from "lucide-react";
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

  const navLinks = (
    <>
      <Link
        href="/create"
        onClick={() => setMobileOpen(false)}
        className="text-sm text-zinc-400 transition-colors hover:text-white"
      >
        Create
      </Link>
      <Link
        href="/gallery"
        onClick={() => setMobileOpen(false)}
        className="text-sm text-zinc-400 transition-colors hover:text-white"
      >
        Gallery
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          <span className="text-lg font-bold text-white">MintAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {navLinks}
        </nav>

        <div className="flex items-center gap-3">
          {authenticated ? (
            <>
              {solanaWallet && (
                <button
                  onClick={copyAddress}
                  title={solanaWallet.address}
                  className="hidden items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/50 sm:flex"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {shortenAddress(solanaWallet.address)}
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-zinc-500" />
                  )}
                </button>
              )}
              <button
                onClick={logout}
                className="hidden items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white sm:flex"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Connect
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:text-white sm:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 pt-3 sm:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks}
          </nav>
          {authenticated && solanaWallet && (
            <div className="mt-4 space-y-3 border-t border-zinc-800 pt-3">
              <button
                onClick={copyAddress}
                className="flex w-full items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300"
              >
                <Wallet className="h-3.5 w-3.5" />
                {shortenAddress(solanaWallet.address)}
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-500" />
                )}
              </button>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex w-full items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
