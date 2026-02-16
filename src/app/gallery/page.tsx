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
  Filter,
  Grid,
  List,
  Tag,
} from "lucide-react";
import { useUmi } from "@/hooks/useUmi";
import { useOwnedAssets } from "@/hooks/useOwnedAssets";
import { useMintedNFTs } from "@/hooks/useMintedNFTs";
import { shortenAddress } from "@/lib/utils";
import Link from "next/link";
import ListingModal from "@/components/marketplace/ListingModal";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [listingAsset, setListingAsset] = useState<{
    address: string;
    name: string;
    imageUrl: string;
  } | null>(null);
  const [delisting, setDelisting] = useState<string | null>(null);

  const hasMintedNFTs = mintedNFTs.length > 0;
  const hasOnChainAssets = assets.length > 0;
  const loading = chainLoading || dbLoading;

  // Filter on-chain assets by search
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
  const totalAll = assets.length + mintedNFTs.length;

  const handleDelist = async (asset: { address: string }) => {
    if (!walletAddress) return;
    setDelisting(asset.address);

    try {
      // First find the active listing for this mint
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
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 mt-10">
          <p className="text-gray-400 text-lg max-w-2xl">
            Browse your minted NFTs and on-chain assets. List them for sale on
            the marketplace.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300/80 group-focus-within:text-primary/80 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search NFTs, addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary/60 focus:bg-white/10 hover:bg-white/8 transition-all duration-300 shadow-lg focus:shadow-primary/20 focus:shadow-xl"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-accent-pink/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {connected && (
                <button
                  onClick={refetchChain}
                  disabled={chainLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/5 border-white/20 text-gray-300 hover:border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${chainLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                  showFilters
                    ? "bg-primary/20 border-primary/50 text-primary backdrop-blur-sm"
                    : "bg-white/5 border-white/20 text-gray-300 hover:border-white/30 hover:bg-white/10 backdrop-blur-sm"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Source
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["All", "On-Chain", "Mint History"].map((source) => (
                      <button
                        key={source}
                        className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
                {connected && walletAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Wallet
                    </label>
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-mono text-gray-300">
                        {shortenAddress(walletAddress)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {(hasOnChainAssets || hasMintedNFTs) && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              Showing {totalResults} of {totalAll} NFTs
            </p>
            {searchQuery && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Search:</span>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  {searchQuery}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && !hasOnChainAssets && !hasMintedNFTs && (
          <div className="flex items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-dark-800/30 py-20 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading your NFTs...
          </div>
        )}

        {chainError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
            {chainError}
          </div>
        )}

        {/* On-chain assets */}
        {filteredAssets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">On-Chain Assets</h2>
              <span className="text-sm text-gray-500 font-mono">
                {connected && walletAddress
                  ? shortenAddress(walletAddress)
                  : ""}
              </span>
            </div>

            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {filteredAssets.map((asset) => (
                <div
                  key={asset.address}
                  className="group relative bg-dark-800 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 card-hover"
                >
                  <Link href={`/nft/${asset.address}`}>
                    <div className="relative h-64 overflow-hidden">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Listed badge */}
                      {asset.isListed && (
                        <div className="absolute top-4 left-4 bg-accent-pink/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-xs font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Listed
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1 group-hover:text-gradient transition-colors truncate">
                          {asset.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-primary" />
                          <span className="text-sm text-gray-400 font-mono">
                            {shortenAddress(asset.address, 4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-xs">On-chain</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {asset.isListed ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelist(asset);
                        }}
                        disabled={delisting === asset.address}
                        className="px-3 py-1.5 bg-dark-700/80 backdrop-blur-sm rounded-full text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        {delisting === asset.address ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Cancel Listing"
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
                        className="px-3 py-1.5 bg-dark-700/80 backdrop-blur-sm rounded-full text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                      >
                        List for Sale
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minted NFTs from database */}
        {filteredMinted.length > 0 && (
          <div className="mb-10">
            {filteredAssets.length > 0 && (
              <h2 className="mb-6 text-xl font-bold text-white">
                Mint History
              </h2>
            )}
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {filteredMinted.map((nft) => (
                <div
                  key={nft.mint}
                  className="group relative bg-dark-800 rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 card-hover"
                >
                  <Link href={`/nft/${nft.mint}`}>
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1 group-hover:text-gradient transition-colors truncate">
                          {nft.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-primary" />
                          <span className="text-sm text-gray-400 font-mono">
                            {shortenAddress(nft.mint, 4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-xs">Minted</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Delete button on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeNFT(nft.mint)}
                      className="p-2 bg-dark-700/80 backdrop-blur-sm rounded-full hover:bg-red-500/80 text-gray-400 hover:text-white transition-all"
                      title="Remove from gallery"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && totalResults === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? (
                <Search className="w-10 h-10 text-gray-400" />
              ) : (
                <Sparkles className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchQuery ? "No NFTs Found" : "No NFTs Yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchQuery
                ? "Try adjusting your search to find more NFTs."
                : "Create your first AI-powered NFT and it will appear here."}
            </p>
            {!searchQuery && (
              <Link
                href="/create"
                className="inline-flex items-center gap-3 bg-gradient-primary px-8 py-4 rounded-full text-white font-semibold hover:shadow-neon-lg transition-all group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Create Your First NFT
              </Link>
            )}
          </div>
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
