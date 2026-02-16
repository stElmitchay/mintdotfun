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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/types";
import ListingModal from "@/components/marketplace/ListingModal";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/motion";

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
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-32">
          <h1 className="text-xl font-bold mb-4">NFT Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">
            Could not find an NFT with address {shortenAddress(address, 8)}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-light transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-300 mb-8 text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <FadeUp>
            <div className="relative rounded-2xl overflow-hidden bg-surface-2">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-surface-3 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10" />
                </div>
              )}
              {isListed && (
                <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-medium text-white">For Sale</span>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Details */}
          <div className="space-y-6">
            <FadeUp delay={0.1}>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {asset.name}
                </h1>
                {asset.description && (
                  <p className="text-gray-500">{asset.description}</p>
                )}
              </div>
            </FadeUp>

            {/* Owner */}
            <FadeUp delay={0.2}>
              <div className="bg-surface-2 rounded-xl p-4 border border-white/[0.04]">
                <div className="text-xs text-gray-600 mb-1.5">Owner</div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-mono text-sm text-gray-300">
                    {shortenAddress(asset.owner, 6)}
                  </span>
                  {isOwner && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
              </div>
            </FadeUp>

            {/* Price & Actions */}
            {isListed && listing && (
              <FadeUp delay={0.3}>
                <div className="bg-surface-2 rounded-xl p-6 border border-white/[0.04] space-y-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Price</div>
                    <div className="text-3xl font-bold text-white">
                      {listing.priceSol} <span className="text-lg text-gray-500">SOL</span>
                    </div>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={handleDelist}
                      disabled={delisting}
                      className="w-full py-3 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {delisting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Delisting...
                        </>
                      ) : (
                        "Cancel Listing"
                      )}
                    </button>
                  ) : connected ? (
                    <motion.button
                      onClick={handleBuy}
                      disabled={buying}
                      className="w-full bg-primary py-3 rounded-xl text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {buying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        `Buy for ${listing.priceSol} SOL`
                      )}
                    </motion.button>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Connect your wallet to purchase
                    </p>
                  )}
                </div>
              </FadeUp>
            )}

            {/* List for Sale */}
            {isOwner && !isListed && (
              <FadeUp delay={0.3}>
                <motion.button
                  onClick={() => setShowListModal(true)}
                  className="w-full bg-primary py-3 rounded-xl text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  List for Sale
                </motion.button>
              </FadeUp>
            )}

            {/* Transaction Result */}
            {txResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 flex items-start gap-3 ${
                  txResult.type === "success"
                    ? "bg-green-500/5 border border-green-500/15"
                    : "bg-red-500/5 border border-red-500/15"
                }`}
              >
                {txResult.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    txResult.type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {txResult.message}
                </p>
              </motion.div>
            )}

            {/* Explorer Link */}
            <FadeUp delay={0.4}>
              <a
                href={getCoreAssetUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors duration-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Metaplex Explorer
              </a>
            </FadeUp>
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
