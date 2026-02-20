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
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// Helpers
// ============================================

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

// ============================================
// Card components — image-forward, minimal chrome
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="mb-4"
    >
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block relative rounded-2xl overflow-hidden"
      >
        {/* Image */}
        {listing.nftImageUrl ? (
          <img
            src={listing.nftImageUrl}
            alt={listing.nftName}
            className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-gray-3 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gray-7" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Price badge — always visible */}
        <div className="absolute top-3 right-3 bg-accent px-2.5 py-1 rounded-full">
          <span className="text-[11px] font-bold text-[var(--color-on-accent)]">
            {listing.priceSol} SOL
          </span>
        </div>

        {/* Bottom info — appears on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-sm font-medium text-white truncate">
            {listing.nftName}
          </p>
          <p className="text-[11px] text-white/50 mt-0.5">
            {timeAgo(listing.listedAt)}
          </p>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="mb-4"
    >
      <div className="group relative rounded-2xl overflow-hidden">
        <Link href={`/nft/${asset.address}`}>
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-gray-3 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-7" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Listed badge */}
          {asset.isListed && (
            <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="text-[10px] font-medium flex items-center gap-1 text-[var(--color-on-accent)]">
                <Tag className="w-2.5 h-2.5" />
                Listed
              </span>
            </div>
          )}

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <p className="text-sm font-medium text-white truncate">
              {asset.name}
            </p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              {shortenAddress(asset.address, 4)}
            </p>
          </div>
        </Link>

        {/* Action button on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {asset.isListed ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelist();
              }}
              disabled={delisting}
              className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-[11px] font-medium text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
            >
              {delisting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delist"}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onList();
              }}
              className="px-3 py-1.5 bg-accent backdrop-blur-sm rounded-full text-[11px] font-medium text-[var(--color-on-accent)] hover:opacity-80 transition-all"
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.5,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="mb-4"
    >
      <div className="group relative rounded-2xl overflow-hidden">
        <Link href={`/nft/${nft.mint}`}>
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <p className="text-sm font-medium text-white truncate">
              {nft.name}
            </p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              {shortenAddress(nft.mint, 4)}
            </p>
          </div>
        </Link>

        {/* Delete button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onRemove()}
            className="p-2 bg-black/60 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-400 transition-all"
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
// Minimap — scroll indicator with tab rectangles
// ============================================

type GalleryTab = "listed" | "mine";

const MINIMAP_LINES = [
  { type: "rect" as const, tab: "listed" as GalleryTab, label: "Listed" },
  { type: "line" as const },
  { type: "line" as const },
  { type: "line" as const },
  { type: "rect" as const, tab: "mine" as GalleryTab, label: "My NFTs" },
  { type: "line" as const },
  { type: "line" as const },
];

function GalleryMinimap({
  activeTab,
  onTabChange,
}: {
  activeTab: GalleryTab;
  onTabChange: (t: GalleryTab) => void;
}) {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? window.scrollY / max : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll indicator position across the line elements
  const lineIndices = MINIMAP_LINES.map((l, i) => (l.type === "line" ? i : -1)).filter((i) => i !== -1);
  const activeLineIdx = Math.min(
    Math.floor(scrollPct * lineIndices.length),
    lineIndices.length - 1
  );
  const activeLineIndex = lineIndices[Math.max(0, activeLineIdx)];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-end gap-[9px]">
        {MINIMAP_LINES.map((line, i) =>
          line.type === "rect" ? (
            <button
              key={i}
              onClick={() => line.tab && onTabChange(line.tab)}
              className="relative group"
              style={{ width: 50, height: 12 }}
            >
              <div
                style={{
                  width: 50,
                  height: 12,
                  border: "1px solid",
                  borderColor:
                    activeTab === line.tab
                      ? "var(--color-accent)"
                      : "var(--color-gray-9)",
                  background:
                    activeTab === line.tab
                      ? "var(--color-accent)"
                      : "transparent",
                  transition: "background 200ms ease, border-color 200ms ease",
                }}
              />
              {/* Tooltip label */}
              <span
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap transition-colors"
                style={{
                  color:
                    activeTab === line.tab
                      ? "var(--color-accent)"
                      : "var(--color-gray-8)",
                }}
              >
                {line.label}
              </span>
            </button>
          ) : (
            <div
              key={i}
              style={{
                width: 1,
                height: 12,
                background:
                  i === activeLineIndex
                    ? "var(--color-accent)"
                    : "var(--color-gray-9)",
                transition: "background 200ms ease",
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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
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

  const [tab, setTab] = useState<GalleryTab>("listed");
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

  const mineCount = assets.length + mintedNFTs.length;

  // Build cards based on active tab
  const tabCards = useMemo(() => {
    const cards: React.ReactNode[] = [];

    if (tab === "listed") {
      listings.forEach((listing, i) => {
        cards.push(
          <ListingCard key={`l-${listing.id}`} listing={listing} index={i} />
        );
      });
    } else {
      assets.forEach((asset, i) => {
        cards.push(
          <AssetCard
            key={`a-${asset.address}`}
            asset={asset}
            index={i}
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
            index={i + assets.length}
            onRemove={() => removeNFT(nft.mint)}
          />
        );
      });
    }

    return cards;
  }, [tab, listings, assets, mintedNFTs, delisting]);

  const hasAny = tabCards.length > 0;

  return (
    <div className="min-h-screen pt-16 pb-20">
      {/* Minimap with tab switching */}
      <GalleryMinimap activeTab={tab} onTabChange={setTab} />

      <div className="max-w-[1100px] mx-auto px-4 mt-10">
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

        {/* Masonry grid */}
        <AnimatePresence mode="wait">
          {hasAny && (
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MasonryGrid>{tabCards}</MasonryGrid>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && !listingsLoading && !hasAny && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center py-32"
          >
            <div className="w-16 h-16 bg-gray-3 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-6 h-6 text-gray-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-11 mb-2">
              {tab === "listed" ? "No Listings" : "No NFTs Yet"}
            </h3>
            <p className="text-gray-8 text-sm max-w-sm mx-auto mb-8">
              {tab === "listed"
                ? "Nothing listed on the marketplace yet."
                : "Create your first AI-powered NFT."}
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
