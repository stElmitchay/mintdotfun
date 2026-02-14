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
 * Parses a data URI (base64-encoded JSON) to extract the image URL.
 * Returns null if the URI isn't a data URI or can't be parsed.
 */
function parseImageFromDataUri(uri: string): string | null {
  if (!uri.startsWith("data:application/json;base64,")) return null;
  try {
    const base64 = uri.slice("data:application/json;base64,".length);
    const json = JSON.parse(atob(base64));
    return typeof json.image === "string" ? json.image : null;
  } catch {
    return null;
  }
}

/**
 * Fetches all mpl-core assets owned by the connected wallet directly
 * from the Solana blockchain. This proves on-chain ownership regardless
 * of localStorage state.
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

      const parsed: OwnedAsset[] = onChainAssets.map((asset) => ({
        address: asset.publicKey.toString(),
        name: asset.name,
        imageUrl: parseImageFromDataUri(asset.uri) || "",
        explorerUrl: getCoreAssetUrl(asset.publicKey.toString()),
      }));

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
