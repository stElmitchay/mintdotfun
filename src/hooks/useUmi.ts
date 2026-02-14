"use client";

import { useMemo, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth/solana";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { signerIdentity } from "@metaplex-foundation/umi";
import {
  createSignerFromPrivyWallet,
  isPrivySolanaWallet,
} from "@/lib/solana/privySigner";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

const SOLANA_CHAIN =
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
    ? "solana:mainnet"
    : "solana:devnet";

export function useUmi() {
  const { wallets, ready } = useWallets();
  const wallet = wallets.length > 0 ? wallets[0] : null;

  // Switch the wallet to the correct chain (devnet) on connect
  useEffect(() => {
    if (!wallet || !("switchChain" in wallet)) return;
    const w = wallet as { switchChain: (chain: string) => Promise<void> };
    w.switchChain(SOLANA_CHAIN).catch(() => {
      // Ignore — external wallets may not support switchChain
    });
  }, [wallet]);

  const umi = useMemo(() => {
    const instance = createUmi(rpcUrl).use(mplCore());

    if (wallet && isPrivySolanaWallet(wallet)) {
      const signer = createSignerFromPrivyWallet(
        instance.transactions,
        wallet,
        SOLANA_CHAIN
      );
      instance.use(signerIdentity(signer));
    }

    return instance;
  }, [wallet]);

  return {
    umi,
    connected: ready && wallet !== null && !!wallet.address,
    walletAddress: wallet?.address ?? null,
  };
}
