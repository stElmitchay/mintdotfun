"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Trash2,
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
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Varying aspect ratios for masonry effect
const ASPECTS = [
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[3/5]",
];

// ============================================
// Card components
// ============================================

function ListingCard({
  listing,
  index,
}: {
  listing: {
    id: string;
    mintAddress: string;
    nftName: string;
    nftImageUrl: string;
    priceSol: number;
    sellerWallet: string;
    listedAt: string;
  };
  index: number;
}) {
  const aspectClass = ASPECTS[index % ASPECTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="break-inside-avoid mb-4"
    >
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300"
      >
        {/* Header — name + date */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors">
            {listing.nftName}
          </h3>
          <span className="text-xs text-gray-8 flex-shrink-0 ml-3">
            {timeAgo(listing.listedAt)}
          </span>
        </div>

        {/* Image */}
        <div className={`relative ${aspectClass} overflow-hidden mx-2`}>
          {listing.nftImageUrl ? (
            <img
              src={listing.nftImageUrl}
              alt={listing.nftName}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gray-3 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-7" />
            </div>
          )}

          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="text-xs font-semibold text-accent">
              {listing.priceSol} SOL
            </span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-gray-9 group-hover:text-accent transition-colors">
          View NFT
        </div>
      </Link>
    </motion.div>
  );
}

function AssetCard({
  asset,
  index,
  onList,
  onDelist,
  delisting,
}: {
  asset: {
    address: string;
    name: string;
    imageUrl: string;
    isListed: boolean;
  };
  index: number;
  onList: () => void;
  onDelist: () => void;
  delisting: boolean;
}) {
  const aspectClass = ASPECTS[(index + 2) % ASPECTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="break-inside-avoid mb-4"
    >
      <div className="group relative rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300">
        <Link href={`/nft/${asset.address}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors">
              {asset.name}
            </h3>
            <span className="text-xs text-gray-8 font-mono flex-shrink-0 ml-3">
              {shortenAddress(asset.address, 4)}
            </span>
          </div>

          {/* Image */}
          <div className={`relative ${aspectClass} overflow-hidden mx-2`}>
            {asset.imageUrl ? (
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-full h-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full bg-gray-3 rounded-xl flex items-center justify-center">
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

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-gray-9 group-hover:text-accent transition-colors">
            {asset.isListed ? "View Listing" : "View NFT"}
          </div>
        </Link>

        {/* Action button on hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {asset.isListed ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelist();
              }}
              disabled={delisting}
              className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
            >
              {delisting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delist"}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onList();
              }}
              className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[11px] font-medium text-accent hover:opacity-80 transition-all"
            >
              List
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MintedCard({
  nft,
  index,
  onRemove,
}: {
  nft: { mint: string; name: string; imageUrl: string };
  index: number;
  onRemove: () => void;
}) {
  const aspectClass = ASPECTS[(index + 4) % ASPECTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="break-inside-avoid mb-4"
    >
      <div className="group relative rounded-2xl overflow-hidden bg-gray-2 border border-gray-a3 hover:border-gray-a5 transition-all duration-300">
        <Link href={`/nft/${nft.mint}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-medium text-gray-11 truncate group-hover:text-gray-12 transition-colors">
              {nft.name}
            </h3>
            <span className="text-xs text-gray-8 font-mono flex-shrink-0 ml-3">
              {shortenAddress(nft.mint, 4)}
            </span>
          </div>

          {/* Image */}
          <div className={`relative ${aspectClass} overflow-hidden mx-2`}>
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-gray-9 group-hover:text-accent transition-colors">
            View NFT
          </div>
        </Link>

        {/* Delete button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onRemove()}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-gray-400 hover:text-red-400 transition-all"
            title="Remove from gallery"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Minimap — scroll-position indicator (matches rauno.me/craft)
// ============================================

const MINIMAP_LINES = [
  { type: "rect" as const },
  { type: "line" as const },
  { type: "line" as const },
  { type: "line" as const },
  { type: "rect" as const },
  { type: "line" as const },
  { type: "line" as const },
  { type: "rect" as const },
  { type: "line" as const },
  { type: "line" as const },
];

function GalleryMinimap() {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? window.scrollY / max : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Map scroll % to which rect index is active (0, 1, or 2)
  const rectIndices = MINIMAP_LINES
    .map((l, i) => (l.type === "rect" ? i : -1))
    .filter((i) => i !== -1);
  const activeRectIdx =
    scrollPct < 0.33 ? 0 : scrollPct < 0.66 ? 1 : 2;
  const activeLineIndex = rectIndices[activeRectIdx];

  return (
    <div
      aria-hidden
      className="fixed top-5 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-end gap-[9px]">
        {MINIMAP_LINES.map((line, i) =>
          line.type === "rect" ? (
            <div
              key={i}
              className="relative"
              style={{ width: 30, height: 12 }}
            >
              <div
                style={{
                  width: 30,
                  height: 12,
                  border: "1px solid var(--color-gray-9)",
                  background:
                    i === activeLineIndex
                      ? "var(--color-accent)"
                      : "transparent",
                  borderColor:
                    i === activeLineIndex
                      ? "var(--color-accent)"
                      : "var(--color-gray-9)",
                  transition:
                    "background 200ms ease-in-out 200ms, border-color 200ms ease-in-out 200ms",
                }}
              />
            </div>
          ) : (
            <div
              key={i}
              style={{
                width: 1,
                height: 12,
                background: "var(--color-gray-9)",
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// Masonry helper — distribute items across 3 columns
// ============================================

function MasonryGrid({ children }: { children: React.ReactNode[] }) {
  const cols: React.ReactNode[][] = [[], [], []];
  children.forEach((child, i) => {
    cols[i % 3].push(child);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col">
          {col}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Page
// ============================================

export default function GalleryPage() {
  const { umi, walletAddress } = useUmi();
  const {
    assets,
    loading: chainLoading,
    error: chainError,
    refetch: refetchChain,
  } = useOwnedAssets(umi, walletAddress);
  const {
    nfts: mintedNFTs,
    loading: dbLoading,
    removeNFT,
  } = useMintedNFTs(walletAddress);
  const { listings, loading: listingsLoading } = useListings({
    sort: "newest",
  });

  const [listingAsset, setListingAsset] = useState<{
    address: string;
    name: string;
    imageUrl: string;
  } | null>(null);
  const [delisting, setDelisting] = useState<string | null>(null);

  const loading = chainLoading || dbLoading;

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
    listings.length > 0 || assets.length > 0 || mintedNFTs.length > 0;

  // Build all cards into one flat array for masonry
  const allCards = useMemo(() => {
    const cards: React.ReactNode[] = [];

    listings.forEach((listing, i) => {
      cards.push(
        <ListingCard key={`l-${listing.id}`} listing={listing} index={i} />
      );
    });

    assets.forEach((asset, i) => {
      cards.push(
        <AssetCard
          key={`a-${asset.address}`}
          asset={asset}
          index={i + listings.length}
          onList={() =>
            setListingAsset({
              address: asset.address,
              name: asset.name,
              imageUrl: asset.imageUrl,
            })
          }
          onDelist={() => handleDelist(asset)}
          delisting={delisting === asset.address}
        />
      );
    });

    mintedNFTs.forEach((nft, i) => {
      cards.push(
        <MintedCard
          key={`m-${nft.mint}`}
          nft={nft}
          index={i + listings.length + assets.length}
          onRemove={() => removeNFT(nft.mint)}
        />
      );
    });

    return cards;
  }, [listings, assets, mintedNFTs, delisting]);

  return (
    <div className="min-h-screen pt-16 pb-20">
      {/* Minimap */}
      <GalleryMinimap />

      <div className="max-w-[1100px] mx-auto px-6 mt-10">
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

        {/* Masonry grid — all cards mixed */}
        {hasAny && <MasonryGrid>{allCards}</MasonryGrid>}

        {/* Empty state */}
        {!loading && !listingsLoading && !hasAny && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center py-32"
          >
            <div className="w-16 h-16 bg-gray-3 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-6 h-6 text-gray-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-11 mb-2">
              No NFTs Yet
            </h3>
            <p className="text-gray-8 text-sm max-w-sm mx-auto mb-8">
              Create your first AI-powered NFT.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all duration-300"
            >
              Create an NFT
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
