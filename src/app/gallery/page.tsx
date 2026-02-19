"use client";

import { useState } from "react";
import {
  ExternalLink,
  Sparkles,
  Loader2,
  RefreshCw,
  Wallet,
  Trash2,
  Search,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { useOwnedAssets } from "@/hooks/useOwnedAssets";
import { useMintedNFTs } from "@/hooks/useMintedNFTs";
import { shortenAddress } from "@/lib/utils";
import Link from "next/link";
import ListingModal from "@/components/marketplace/ListingModal";
import { motion } from "framer-motion";
import { FadeUp, StaggerContainer, staggerItem } from "@/components/ui/motion";

export default function GalleryPage() {
  const { umi, connected, walletAddress } = useUmi();
  const {
    assets,
    loading: chainLoading,
    error: chainError,
    refetch: refetchChain,
  } = useOwnedAssets(umi, walletAddress);
  const { nfts: mintedNFTs, loading: dbLoading, removeNFT } = useMintedNFTs(walletAddress);

  const [searchQuery, setSearchQuery] = useState("");
  const [listingAsset, setListingAsset] = useState<{
    address: string;
    name: string;
    imageUrl: string;
  } | null>(null);
  const [delisting, setDelisting] = useState<string | null>(null);

  const hasMintedNFTs = mintedNFTs.length > 0;
  const hasOnChainAssets = assets.length > 0;
  const loading = chainLoading || dbLoading;

  const filteredAssets = assets.filter(
    (a) =>
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMinted = mintedNFTs.filter(
    (n) =>
      !searchQuery ||
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.mint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResults = filteredAssets.length + filteredMinted.length;

  const handleDelist = async (asset: { address: string }) => {
    if (!walletAddress) return;
    setDelisting(asset.address);

    try {
      const res = await fetch(
        `/api/marketplace/listings?mint=${asset.address}&status=active`
      );
      if (!res.ok) throw new Error("Failed to find listing");
      const { listings } = await res.json();
      if (!listings || listings.length === 0) {
        throw new Error("No active listing found");
      }

      const delistRes = await fetch("/api/marketplace/delist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listings[0].id,
          sellerWallet: walletAddress,
        }),
      });

      if (!delistRes.ok) {
        const data = await delistRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delist");
      }

      refetchChain();
    } catch (err) {
      console.error("Delist failed:", err);
    } finally {
      setDelisting(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <FadeUp>
          <div className="mb-10 mt-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Gallery</h1>
            <p className="text-gray-500 text-sm">
              Your minted NFTs and on-chain assets
            </p>
          </div>
        </FadeUp>

        {/* Search + Controls */}
        <FadeUp delay={0.1}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-10">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-2 border border-white/[0.06] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all duration-300"
              />
            </div>

            <div className="flex items-center gap-3">
              {connected && walletAddress && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Wallet className="w-3 h-3" />
                  <span className="font-mono">{shortenAddress(walletAddress)}</span>
                </div>
              )}
              {connected && (
                <button
                  onClick={refetchChain}
                  disabled={chainLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white bg-surface-2 border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
                >
                  <RefreshCw className={`w-3 h-3 ${chainLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Loading */}
        {loading && !hasOnChainAssets && !hasMintedNFTs && (
          <div className="flex items-center justify-center gap-3 py-32 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your NFTs...</span>
          </div>
        )}

        {chainError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 mb-6">
            {chainError}
          </div>
        )}

        {/* On-chain assets — Masonry grid */}
        {filteredAssets.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold text-white">On-Chain Assets</h2>
              <span className="text-xs text-gray-600">{filteredAssets.length}</span>
            </div>

            <StaggerContainer className="masonry-grid">
              {filteredAssets.map((asset, i) => {
                const aspects = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"];
                const aspectClass = aspects[i % aspects.length];

                return (
                  <motion.div key={asset.address} variants={staggerItem}>
                    <div className="group relative rounded-xl overflow-hidden bg-surface-2">
                      <Link href={`/nft/${asset.address}`}>
                        <div className={`relative ${aspectClass} overflow-hidden`}>
                          {asset.imageUrl ? (
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-gray-700" />
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Listed badge */}
                          {asset.isListed && (
                            <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
                              <span className="text-[10px] font-medium flex items-center gap-1 text-white">
                                <Tag className="w-2.5 h-2.5" />
                                Listed
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="px-3 py-3">
                          <h3 className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-300">
                            {asset.name}
                          </h3>
                          <span className="text-[11px] text-gray-600 font-mono">
                            {shortenAddress(asset.address, 4)}
                          </span>
                        </div>
                      </Link>

                      {/* Action button on hover */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {asset.isListed ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelist(asset);
                            }}
                            disabled={delisting === asset.address}
                            className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                          >
                            {delisting === asset.address ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Delist"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setListingAsset({
                                address: asset.address,
                                name: asset.name,
                                imageUrl: asset.imageUrl,
                              });
                            }}
                            className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-primary hover:text-primary-light transition-all"
                          >
                            List
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </StaggerContainer>
          </div>
        )}

        {/* Minted NFTs from database */}
        {filteredMinted.length > 0 && (
          <div className="mb-12">
            {filteredAssets.length > 0 && (
              <h2 className="text-lg font-semibold text-white mb-6">
                Mint History
              </h2>
            )}

            <StaggerContainer className="masonry-grid">
              {filteredMinted.map((nft, i) => {
                const aspects = ["aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]", "aspect-square"];
                const aspectClass = aspects[i % aspects.length];

                return (
                  <motion.div key={nft.mint} variants={staggerItem}>
                    <div className="group relative rounded-xl overflow-hidden bg-surface-2">
                      <Link href={`/nft/${nft.mint}`}>
                        <div className={`relative ${aspectClass} overflow-hidden`}>
                          <img
                            src={nft.imageUrl}
                            alt={nft.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="px-3 py-3">
                          <h3 className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-300">
                            {nft.name}
                          </h3>
                          <span className="text-[11px] text-gray-600 font-mono">
                            {shortenAddress(nft.mint, 4)}
                          </span>
                        </div>
                      </Link>

                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => removeNFT(nft.mint)}
                          className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-gray-400 hover:text-red-400 transition-all"
                          title="Remove from gallery"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </StaggerContainer>
          </div>
        )}

        {/* Empty state */}
        {!loading && totalResults === 0 && (
          <FadeUp>
            <div className="text-center py-32">
              <div className="w-16 h-16 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-6">
                {searchQuery ? (
                  <Search className="w-6 h-6 text-gray-600" />
                ) : (
                  <Sparkles className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {searchQuery ? "No NFTs Found" : "No NFTs Yet"}
              </h3>
              <p className="text-gray-600 text-sm max-w-sm mx-auto mb-8">
                {searchQuery
                  ? "Try adjusting your search."
                  : "Create your first AI-powered NFT."}
              </p>
              {!searchQuery && (
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300"
                >
                  Create an NFT
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </FadeUp>
        )}
      </div>

      {/* Listing Modal */}
      {listingAsset && (
        <ListingModal
          mintAddress={listingAsset.address}
          nftName={listingAsset.name}
          nftImageUrl={listingAsset.imageUrl}
          nftDescription=""
          onClose={() => setListingAsset(null)}
          onSuccess={() => {
            setListingAsset(null);
            refetchChain();
          }}
        />
      )}
    </div>
  );
}
