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
  Share2,
  ArrowRight,
  Sparkles,
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
  const { listings: moreListings } = useListings({ sort: "newest", limit: 4 });

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
  const [copiedShare, setCopiedShare] = useState(false);

  const listing: Listing | undefined = listings[0];
  const isOwner = walletAddress && asset?.owner === walletAddress;
  const isListed = !!listing;

  // Filter out the current NFT from "more" section
  const relatedListings = moreListings.filter(
    (l) => l.mintAddress !== address
  ).slice(0, 3);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
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
    <>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
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

          {/* ── Hero Image ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex justify-center mb-10"
          >
            <div className="rounded-2xl overflow-hidden bg-gray-2 max-w-[720px] w-full">
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

          {/* ── Two Column: Info + Price ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* ── Left: Title, Description, Details ── */}
            <div>
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                className="mb-8"
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-12 tracking-tight mb-1">
                  {asset.name}
                </h1>
                {isListed && (
                  <span className="text-xs text-accent font-medium">Listed</span>
                )}
              </motion.div>

              {/* Owner pill */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="flex items-center gap-2 bg-gray-2 rounded-full pl-1.5 pr-3.5 py-1.5">
                  <div className="w-6 h-6 rounded-full bg-gray-5 flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-gray-9" />
                  </div>
                  <span className="font-mono text-xs text-gray-11">
                    {shortenAddress(asset.owner, 4)}
                  </span>
                  {isOwner && (
                    <span className="text-[10px] font-medium text-accent">
                      (you)
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Description */}
              {asset.description && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className="mb-10"
                >
                  <h2 className="text-lg font-semibold text-gray-12 mb-3">
                    Description
                  </h2>
                  <p className="text-sm text-gray-9 leading-relaxed">
                    {asset.description}
                  </p>
                </motion.div>
              )}

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h2 className="text-lg font-semibold text-gray-12 mb-4">
                  Details
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-8">Mint address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-11">
                        {shortenAddress(address, 6)}
                      </span>
                      <button
                        onClick={copyMint}
                        className="p-1 rounded text-gray-8 hover:text-gray-11 transition-colors"
                      >
                        {copiedMint ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-8">Token standard</span>
                    <span className="text-sm text-gray-11">Metaplex Core</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-8">Network</span>
                    <span className="text-sm text-gray-11">Solana Devnet</span>
                  </div>
                </div>

                {/* Metadata & Share links */}
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-a3">
                  <a
                    href={getCoreAssetUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-8 hover:text-gray-11 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Metadata
                  </a>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs text-gray-8 hover:text-gray-11 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedShare ? "Copied!" : "Share"}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* ── Right: Price Card + Actions ── */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="lg:sticky lg:top-24"
              >
                {/* Price card */}
                {isListed && listing && (
                  <div className="rounded-2xl border border-gray-a3 p-5 mb-4">
                    <div className="text-xs text-gray-8 mb-2">Price</div>
                    <div className="text-3xl font-bold text-gray-12 mb-6">
                      {listing.priceSol}{" "}
                      <span className="text-base font-medium text-gray-8">SOL</span>
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
                          "Buy now"
                        )}
                      </motion.button>
                    ) : (
                      <p className="text-sm text-gray-8 text-center py-2">
                        Connect your wallet to purchase
                      </p>
                    )}
                  </div>
                )}

                {/* List for Sale (owner, not listed) */}
                {isOwner && !isListed && (
                  <div className="rounded-2xl border border-gray-a3 p-5 mb-4">
                    <div className="text-xs text-gray-8 mb-3">
                      This NFT is not listed
                    </div>
                    <motion.button
                      onClick={() => setShowListModal(true)}
                      className="w-full bg-accent py-3.5 rounded-xl text-sm font-semibold text-[var(--color-on-accent)] hover:opacity-90 transition-opacity"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      List for Sale
                    </motion.button>
                  </div>
                )}

                {/* Transaction Result */}
                {txResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 flex items-start gap-3 mb-4 ${
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
                        txResult.type === "success"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {txResult.message}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── More from Marketplace ── */}
      {relatedListings.length > 0 && (
        <div className="bg-gray-2 py-16 px-4 sm:px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-12">
                More from the marketplace
              </h2>
              <Link
                href="/gallery"
                className="text-sm text-gray-9 hover:text-gray-12 transition-colors flex items-center gap-1"
              >
                View more
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/nft/${item.mintAddress}`}
                  className="group bg-gray-3 rounded-2xl overflow-hidden transition-colors hover:bg-gray-4"
                >
                  <div className="p-3 pb-0">
                    {item.nftImageUrl ? (
                      <img
                        src={item.nftImageUrl}
                        alt={item.nftName}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-gray-5 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-gray-7" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium text-gray-12 truncate mb-1">
                      {item.nftName}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full bg-gray-5 flex items-center justify-center">
                        <Wallet className="w-2 h-2 text-gray-8" />
                      </div>
                      <span className="text-xs text-gray-9 font-mono">
                        {shortenAddress(item.sellerWallet, 4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-a3">
                      <div>
                        <div className="text-[10px] text-gray-8">Price</div>
                        <div className="text-sm font-semibold text-gray-12">
                          {item.priceSol} SOL
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
