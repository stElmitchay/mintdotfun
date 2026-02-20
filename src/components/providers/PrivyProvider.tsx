"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const wsUrl = rpcUrl.replace("https://", "wss://");

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0 text-gray-400">
        <p>
          Missing NEXT_PUBLIC_PRIVY_APP_ID. Add it to your .env.local file.
        </p>
      </div>
    );
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#0D9488",
          logo: undefined,
          walletList: ["phantom", "solflare", "backpack"],
          walletChainType: "solana-only",
        },
        loginMethods: ["wallet"],
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc("https://api.mainnet-beta.solana.com"),
              rpcSubscriptions: createSolanaRpcSubscriptions(
                "wss://api.mainnet-beta.solana.com"
              ),
            },
            "solana:devnet": {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(wsUrl),
            },
          },
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
