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
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import type { Listing } from "@/types";
import ListingModal from "@/components/marketplace/ListingModal";
import { motion } from "framer-motion";

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
  const [copiedMint, setCopiedMint] = useState(false);

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

  const copyMint = () => {
    navigator.clipboard.writeText(address);
    setCopiedMint(true);
    setTimeout(() => setCopiedMint(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-8" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-32">
          <h1 className="text-xl font-bold text-gray-12 mb-4">NFT Not Found</h1>
          <p className="text-gray-8 text-sm mb-6">
            Could not find an NFT with address {shortenAddress(address, 8)}
          </p>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm text-gray-9 hover:text-gray-12 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-gray-9 hover:text-gray-12 transition-colors text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
          {/* ── Left: Image ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-2">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-3 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-5" />
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right: Details ── */}
          <div className="space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-12 tracking-tight">
                {asset.name}
              </h1>
              {asset.description && (
                <p className="text-gray-9 text-sm mt-3 leading-relaxed">
                  {asset.description}
                </p>
              )}
            </motion.div>

            {/* Price & Buy section */}
            {isListed && listing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="bg-gray-2 rounded-2xl p-5"
              >
                <div className="text-[11px] uppercase tracking-wider text-gray-8 mb-2">
                  Price
                </div>
                <div className="text-3xl font-bold text-gray-12 mb-5">
                  {listing.priceSol}{" "}
                  <span className="text-lg text-gray-8">SOL</span>
                </div>

                {isOwner ? (
                  <button
                    onClick={handleDelist}
                    disabled={delisting}
                    className="w-full py-3.5 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                    className="w-full bg-accent py-3.5 rounded-xl text-sm font-semibold text-[var(--color-on-accent)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
                  <p className="text-sm text-gray-8 text-center py-2">
                    Connect your wallet to purchase
                  </p>
                )}
              </motion.div>
            )}

            {/* List for Sale (owner, not listed) */}
            {isOwner && !isListed && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <motion.button
                  onClick={() => setShowListModal(true)}
                  className="w-full bg-accent py-3.5 rounded-xl text-sm font-semibold text-[var(--color-on-accent)] hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  List for Sale
                </motion.button>
              </motion.div>
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

            {/* Details section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="bg-gray-2 rounded-2xl divide-y divide-gray-a3"
            >
              {/* Owner */}
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-xs text-gray-8">Owner</span>
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-gray-8" />
                  <span className="font-mono text-xs text-gray-11">
                    {shortenAddress(asset.owner, 6)}
                  </span>
                  {isOwner && (
                    <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Mint address */}
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-xs text-gray-8">Mint</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-11">
                    {shortenAddress(address, 6)}
                  </span>
                  <button
                    onClick={copyMint}
                    className="p-1 rounded text-gray-8 hover:text-gray-11 transition-colors"
                  >
                    {copiedMint ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Token standard */}
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-xs text-gray-8">Standard</span>
                <span className="text-xs text-gray-11">Metaplex Core</span>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-xs text-gray-8">Network</span>
                <span className="text-xs text-gray-11">Solana Devnet</span>
              </div>
            </motion.div>

            {/* Explorer link */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <a
                href={getCoreAssetUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-gray-8 hover:text-gray-11 transition-colors py-3"
              >
                <ExternalLink className="w-3 h-3" />
                View on Metaplex Explorer
              </a>
            </motion.div>
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
