"use client";

import { useState } from "react";
import {
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
import { useListings } from "@/hooks/useListings";
import { shortenAddress } from "@/lib/utils";
import Link from "next/link";
import ListingModal from "@/components/marketplace/ListingModal";
import { motion } from "framer-motion";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function cardTransition(i: number) {
  return {
    delay: i * 0.06,
    duration: 0.5,
    ease: [0.2, 0.8, 0.2, 1] as const,
  };
}

export default function GalleryPage() {
  const { umi, connected, walletAddress } = useUmi();
  const {
    assets,
    loading: chainLoading,
    error: chainError,
    refetch: refetchChain,
  } = useOwnedAssets(umi, walletAddress);
  const { nfts: mintedNFTs, loading: dbLoading, removeNFT } = useMintedNFTs(walletAddress);
  const { listings, loading: listingsLoading } = useListings({ sort: "newest" });

  const [searchQuery, setSearchQuery] = useState("");
  const [listingAsset, setListingAsset] = useState<{
    address: string;
    name: string;
    imageUrl: string;
  } | null>(null);
  const [delisting, setDelisting] = useState<string | null>(null);

  const loading = chainLoading || dbLoading;

  const filteredListings = listings.filter(
    (l) =>
      !searchQuery ||
      l.nftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.mintAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDelist = async (asset: { address: string }) => {
    if (!walletAddress) return;
    setDelisting(asset.address);

    try {
      const res = await fetch(
        `/api/marketplace/listings?mint=${asset.address}&status=active`
      );
      if (!res.ok) throw new Error("Failed to find listing");
      const { listings: found } = await res.json();
      if (!found || found.length === 0) {
        throw new Error("No active listing found");
      }

      const delistRes = await fetch("/api/marketplace/delist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: found[0].id,
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

  const hasAny =
    filteredListings.length > 0 ||
    filteredAssets.length > 0 ||
    filteredMinted.length > 0;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-[960px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-10 mt-6"
        >
          <h1 className="text-[32px] font-medium tracking-tight text-gray-12 mb-1">
            Gallery
          </h1>
          <p className="text-sm text-gray-9">
            Browse listed NFTs and your collection
          </p>
        </motion.div>

        {/* Search + Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-12"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-8" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-2 border border-gray-a3 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-12 placeholder-gray-8 focus:outline-none focus:border-accent/40 transition-all duration-300"
            />
          </div>

          <div className="flex items-center gap-3">
            {connected && walletAddress && (
              <div className="flex items-center gap-2 text-xs text-gray-8">
                <Wallet className="w-3 h-3" />
                <span className="font-mono">{shortenAddress(walletAddress)}</span>
              </div>
            )}
            {connected && (
              <button
                onClick={refetchChain}
                disabled={chainLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-9 hover:text-gray-12 bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300"
              >
                <RefreshCw className={`w-3 h-3 ${chainLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {(loading || listingsLoading) && !hasAny && (
          <div className="flex items-center justify-center gap-3 py-32 text-gray-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {chainError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 mb-8">
            {chainError}
          </div>
        )}

        {/* Marketplace Listings — vertical feed */}
        {filteredListings.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-gray-9 uppercase tracking-wider">
                Listed
              </h2>
              <span className="text-xs text-gray-8">{filteredListings.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredListings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={cardTransition(i)}
                >
                  <Link
                    href={`/nft/${listing.mintAddress}`}
                    className="group block rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {listing.nftImageUrl ? (
                        <img
                          src={listing.nftImageUrl}
                          alt={listing.nftName}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-3 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-gray-7" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors duration-300">
                          {listing.nftName}
                        </h3>
                        <span className="text-xs text-gray-8 font-mono">
                          {shortenAddress(listing.sellerWallet)} &middot; {timeAgo(listing.listedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-sm font-semibold text-accent">
                          {listing.priceSol} SOL
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1 group-hover:translate-x-0" style={{ transition: "opacity 0.3s, transform 0.3s" }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* On-chain assets — vertical feed */}
        {filteredAssets.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-gray-9 uppercase tracking-wider">
                Your Collection
              </h2>
              <span className="text-xs text-gray-8">{filteredAssets.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredAssets.map((asset, i) => (
                <motion.div
                  key={asset.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={cardTransition(i)}
                >
                  <div className="group relative rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300">
                    <Link href={`/nft/${asset.address}`}>
                      {/* Image */}
                      <div className="relative aspect-[16/9] overflow-hidden">
                        {asset.imageUrl ? (
                          <img
                            src={asset.imageUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-3 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-gray-7" />
                          </div>
                        )}

                        {/* Listed badge */}
                        {asset.isListed && (
                          <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
                            <span className="text-[10px] font-medium flex items-center gap-1 text-[var(--color-on-accent)]">
                              <Tag className="w-2.5 h-2.5" />
                              Listed
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors duration-300">
                            {asset.name}
                          </h3>
                          <span className="text-xs text-gray-8 font-mono">
                            {shortenAddress(asset.address, 4)}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-8 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 ml-4 flex-shrink-0" style={{ transition: "opacity 0.3s, transform 0.3s" }} />
                      </div>
                    </Link>

                    {/* Action button */}
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
                          className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-accent hover:opacity-80 transition-all"
                        >
                          List
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Mint History — vertical feed */}
        {filteredMinted.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-gray-9 uppercase tracking-wider">
                Mint History
              </h2>
              <span className="text-xs text-gray-8">{filteredMinted.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredMinted.map((nft, i) => (
                <motion.div
                  key={nft.mint}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={cardTransition(i)}
                >
                  <div className="group relative rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300">
                    <Link href={`/nft/${nft.mint}`}>
                      {/* Image */}
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        />
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors duration-300">
                            {nft.name}
                          </h3>
                          <span className="text-xs text-gray-8 font-mono">
                            {shortenAddress(nft.mint, 4)}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-8 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 ml-4 flex-shrink-0" style={{ transition: "opacity 0.3s, transform 0.3s" }} />
                      </div>
                    </Link>

                    {/* Delete button */}
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
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && !listingsLoading && !hasAny && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center py-32"
          >
            <div className="w-16 h-16 bg-gray-3 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? (
                <Search className="w-6 h-6 text-gray-8" />
              ) : (
                <Sparkles className="w-6 h-6 text-gray-8" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-11 mb-2">
              {searchQuery ? "No NFTs Found" : "No NFTs Yet"}
            </h3>
            <p className="text-gray-8 text-sm max-w-sm mx-auto mb-8">
              {searchQuery
                ? "Try adjusting your search."
                : "Create your first AI-powered NFT."}
            </p>
            {!searchQuery && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all duration-300"
              >
                Create an NFT
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </motion.div>
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
