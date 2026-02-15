"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAssetsByOwner } from "@metaplex-foundation/mpl-core";
import { publicKey as toPublicKey } from "@metaplex-foundation/umi";
import type { Umi } from "@metaplex-foundation/umi";
import { getCoreAssetUrl } from "@/lib/utils";

export interface OwnedAsset {
  address: string;
  name: string;
  imageUrl: string;
  explorerUrl: string;
}

/**
 * Resolves an NFT metadata URI to extract the image URL.
 * Handles both data URIs (legacy) and Arweave/HTTP URIs.
 */
async function resolveImageUrl(uri: string): Promise<string> {
  // Data URI — decode inline
  if (uri.startsWith("data:application/json;base64,")) {
    try {
      const base64 = uri.slice("data:application/json;base64,".length);
      const json = JSON.parse(atob(base64));
      return typeof json.image === "string" ? json.image : "";
    } catch {
      return "";
    }
  }

  // HTTP/Arweave URI — fetch the JSON metadata
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    try {
      const resp = await fetch(uri);
      if (!resp.ok) return "";
      const json = await resp.json();
      return typeof json.image === "string" ? json.image : "";
    } catch {
      return "";
    }
  }

  return "";
}

/**
 * Fetches all mpl-core assets owned by the connected wallet directly
 * from the Solana blockchain. Resolves metadata URIs (Arweave or data URIs)
 * to display images. This proves on-chain ownership regardless of localStorage.
 */
export function useOwnedAssets(umi: Umi, walletAddress: string | null) {
  const [assets, setAssets] = useState<OwnedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setAssets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const owner = toPublicKey(walletAddress);
      const onChainAssets = await fetchAssetsByOwner(umi, owner, {
        skipDerivePlugins: true,
      });

      // Resolve metadata URIs in parallel to extract image URLs
      const parsed = await Promise.all(
        onChainAssets.map(async (asset) => ({
          address: asset.publicKey.toString(),
          name: asset.name,
          imageUrl: await resolveImageUrl(asset.uri),
          explorerUrl: getCoreAssetUrl(asset.publicKey.toString()),
        }))
      );

      setAssets(parsed);
    } catch (err) {
      console.error("Failed to fetch on-chain assets:", err);
      setError("Could not load on-chain assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [umi, walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}
