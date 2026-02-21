"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  if (days < 30) return `${days}d ago`;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ============================================
// Card components — rauno.me/craft style
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
      className="break-inside-avoid"
    >
      <Link
        href={`/nft/${listing.mintAddress}`}
        className="group block bg-gray-2 rounded-2xl overflow-hidden transition-colors hover:bg-gray-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <span className="text-sm font-medium text-gray-12 truncate pr-3">
            {listing.nftName}
          </span>
          <span className="text-xs text-gray-9 whitespace-nowrap flex-shrink-0">
            {timeAgo(listing.listedAt)}
          </span>
        </div>

        {/* Image */}
        <div className="px-3">
          {listing.nftImageUrl ? (
            <img
              src={listing.nftImageUrl}
              alt={listing.nftName}
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-3 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-7" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pt-3 pb-4">
          <span className="text-xs font-semibold text-accent">
            {listing.priceSol} SOL
          </span>
          <span className="text-xs text-gray-9 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            View NFT
            <ArrowRight className="w-3 h-3" />
          </span>
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
      className="break-inside-avoid"
    >
      <div className="group bg-gray-2 rounded-2xl overflow-hidden transition-colors hover:bg-gray-3">
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <span className="text-sm font-medium text-gray-12 truncate pr-3">
            {asset.name}
          </span>
          <span className="text-xs text-gray-9 font-mono whitespace-nowrap flex-shrink-0">
            {shortenAddress(asset.address, 4)}
          </span>
        </div>

        {/* Image */}
        <Link href={`/nft/${asset.address}`} className="block px-3">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-3 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-7" />
            </div>
          )}
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pt-3 pb-4">
          {asset.isListed ? (
            <>
              <span className="text-[11px] font-medium flex items-center gap-1 text-accent">
                <Tag className="w-3 h-3" />
                Listed
              </span>
              <button
                onClick={onDelist}
                disabled={delisting}
                className="text-xs text-gray-9 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {delisting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delist"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onList}
                className="text-xs text-gray-9 hover:text-accent transition-colors"
              >
                List for sale
              </button>
              <Link
                href={`/nft/${asset.address}`}
                className="text-xs text-gray-9 hover:text-gray-11 transition-colors flex items-center gap-1"
              >
                View NFT
                <ArrowRight className="w-3 h-3" />
              </Link>
            </>
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
      className="break-inside-avoid"
    >
      <div className="group bg-gray-2 rounded-2xl overflow-hidden transition-colors hover:bg-gray-3">
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-3">
          <span className="text-sm font-medium text-gray-12 truncate pr-3">
            {nft.name}
          </span>
          <span className="text-xs text-gray-9 font-mono whitespace-nowrap flex-shrink-0">
            {shortenAddress(nft.mint, 4)}
          </span>
        </div>

        {/* Image */}
        <Link href={`/nft/${nft.mint}`} className="block px-3">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full rounded-xl object-cover"
          />
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pt-3 pb-4">
          <button
            onClick={onRemove}
            className="text-xs text-gray-9 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
          <Link
            href={`/nft/${nft.mint}`}
            className="text-xs text-gray-9 hover:text-gray-11 transition-colors flex items-center gap-1"
          >
            View NFT
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Minimap — scroll-tracking, auto-highlights section
// ============================================

type Section = "listed" | "mine";

const MINIMAP_LINES = [
  { type: "rect" as const, section: "listed" as Section, label: "Listed" },
  { type: "line" as const },
  { type: "line" as const },
  { type: "line" as const },
  { type: "rect" as const, section: "mine" as Section, label: "My NFTs" },
  { type: "line" as const },
  { type: "line" as const },
];

function GalleryMinimap({ activeSection }: { activeSection: Section }) {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? window.scrollY / max : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <div
              key={i}
              className="relative"
              style={{ width: 50, height: 12 }}
            >
              <div
                style={{
                  width: 50,
                  height: 12,
                  border: "1px solid",
                  borderColor:
                    activeSection === line.section
                      ? "var(--color-accent)"
                      : "var(--color-gray-9)",
                  background:
                    activeSection === line.section
                      ? "var(--color-accent)"
                      : "transparent",
                  transition: "background 200ms ease, border-color 200ms ease",
                }}
              />
              <span
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap transition-colors"
                style={{
                  color:
                    activeSection === line.section
                      ? "var(--color-accent)"
                      : "var(--color-gray-8)",
                }}
              >
                {line.label}
              </span>
            </div>
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
  const [activeSection, setActiveSection] = useState<Section>("listed");
  const mySectionRef = useRef<HTMLDivElement>(null);

  const loading = chainLoading || dbLoading;

  // Track which section is in view
  useEffect(() => {
    function onScroll() {
      if (!mySectionRef.current) return;
      const rect = mySectionRef.current.getBoundingClientRect();
      setActiveSection(rect.top < window.innerHeight * 0.5 ? "mine" : "listed");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Listed cards
  const listedCards = useMemo(() => {
    return listings.map((listing, i) => (
      <ListingCard key={`l-${listing.id}`} listing={listing} index={i} />
    ));
  }, [listings]);

  // My NFTs cards (on-chain assets + locally minted)
  const myCards = useMemo(() => {
    const cards: React.ReactNode[] = [];

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

    return cards;
  }, [assets, mintedNFTs, delisting]);

  const hasAny = listedCards.length > 0 || myCards.length > 0;

  return (
    <div className="min-h-screen pt-16 pb-20">
      <GalleryMinimap activeSection={activeSection} />

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

        {/* Listed section */}
        {listedCards.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {listedCards}
          </div>
        )}

        {/* My NFTs section — ref for scroll tracking */}
        <div ref={mySectionRef}>
          {myCards.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
              {myCards}
            </div>
          )}
        </div>

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
