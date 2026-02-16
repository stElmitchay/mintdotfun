"use client";

import { useState, useEffect, use } from "react";
import { useUmi } from "@/hooks/useUmi";
import { useListings } from "@/hooks/useListings";
import { buyNFT } from "@/lib/solana/buyNFT";
import { shortenAddress, getCoreAssetUrl } from "@/lib/utils";
import {
  ExternalLink,
  Loader2,
  ArrowLeft,
  Wallet,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/types";
import ListingModal from "@/components/marketplace/ListingModal";

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { umi, connected, walletAddress } = useUmi();
  const { listings } = useListings({ mint: address, status: "active" });

  const [asset, setAsset] = useState<{
    name: string;
    uri: string;
    owner: string;
    imageUrl: string;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [delisting, setDelisting] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [txResult, setTxResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const listing: Listing | undefined = listings[0];
  const isOwner = walletAddress && asset?.owner === walletAddress;
  const isListed = !!listing;

  // Fetch asset data on-chain
  useEffect(() => {
    async function fetchAsset() {
      try {
        const { fetchAsset: fetchAssetFn } = await import(
          "@metaplex-foundation/mpl-core"
        );
        const { publicKey: toPublicKey } = await import(
          "@metaplex-foundation/umi"
        );
        const assetData = await fetchAssetFn(umi, toPublicKey(address));

        // Resolve metadata
        let imageUrl = "";
        let description = "";
        if (assetData.uri) {
          try {
            const resp = await fetch(assetData.uri);
            if (resp.ok) {
              const json = await resp.json();
              imageUrl = json.image || "";
              description = json.description || "";
            }
          } catch {
            // ignore
          }
        }

        setAsset({
          name: assetData.name,
          uri: assetData.uri,
          owner: assetData.owner.toString(),
          imageUrl,
          description,
        });
      } catch (err) {
        console.error("Failed to fetch asset:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [umi, address]);

  const handleBuy = async () => {
    if (!connected || !listing) return;
    setBuying(true);
    setTxResult(null);

    try {
      await buyNFT(umi, listing.id);
      setTxResult({
        type: "success",
        message: "NFT purchased successfully!",
      });
    } catch (err) {
      setTxResult({
        type: "error",
        message: err instanceof Error ? err.message : "Purchase failed",
      });
    } finally {
      setBuying(false);
    }
  };

  const handleDelist = async () => {
    if (!connected || !listing || !walletAddress) return;
    setDelisting(true);
    setTxResult(null);

    try {
      const res = await fetch("/api/marketplace/delist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          sellerWallet: walletAddress,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delist");
      }

      setTxResult({
        type: "success",
        message: "NFT delisted successfully!",
      });
    } catch (err) {
      setTxResult({
        type: "error",
        message: err instanceof Error ? err.message : "Delist failed",
      });
    } finally {
      setDelisting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
          <p className="text-gray-400 mb-6">
            Could not find an NFT with address {shortenAddress(address, 8)}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-dark-800">
            {asset.imageUrl ? (
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center">
                <Tag className="w-16 h-16 text-white/30" />
              </div>
            )}
            {isListed && (
              <div className="absolute top-4 left-4 bg-accent-pink/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium">For Sale</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{asset.name}</h1>
              {asset.description && (
                <p className="text-gray-400 text-lg">{asset.description}</p>
              )}
            </div>

            {/* Owner */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Owner</div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm">
                  {shortenAddress(asset.owner, 6)}
                </span>
                {isOwner && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </div>
            </div>

            {/* Price & Actions */}
            {isListed && listing && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Price</div>
                  <div className="text-3xl font-bold text-gradient">
                    {listing.priceSol} SOL
                  </div>
                </div>

                {isOwner ? (
                  <button
                    onClick={handleDelist}
                    disabled={delisting}
                    className="w-full py-3 rounded-xl font-semibold border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {delisting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Delisting...
                      </>
                    ) : (
                      "Cancel Listing"
                    )}
                  </button>
                ) : connected ? (
                  <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="w-full bg-gradient-primary py-3 rounded-xl font-semibold hover:shadow-neon transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {buying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      `Buy for ${listing.priceSol} SOL`
                    )}
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 text-center">
                    Connect your wallet to purchase this NFT
                  </p>
                )}
              </div>
            )}

            {/* List for Sale (if owned and not listed) */}
            {isOwner && !isListed && (
              <button
                onClick={() => setShowListModal(true)}
                className="w-full bg-gradient-primary py-3 rounded-xl font-semibold hover:shadow-neon transition-all"
              >
                List for Sale
              </button>
            )}

            {/* Transaction Result */}
            {txResult && (
              <div
                className={`rounded-xl p-4 flex items-start gap-3 ${
                  txResult.type === "success"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                {txResult.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    txResult.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {txResult.message}
                </p>
              </div>
            )}

            {/* Explorer Link */}
            <a
              href={getCoreAssetUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Metaplex Explorer
            </a>
          </div>
        </div>
      </div>

      {/* List for Sale Modal */}
      {showListModal && asset && (
        <ListingModal
          mintAddress={address}
          nftName={asset.name}
          nftImageUrl={asset.imageUrl}
          nftDescription={asset.description}
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            setShowListModal(false);
            setTxResult({
              type: "success",
              message: "NFT listed for sale successfully!",
            });
          }}
        />
      )}
    </div>
  );
}
