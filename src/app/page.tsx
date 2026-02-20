"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import {
  motion,
  useSpring,
  useScroll,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { useWheel } from "@use-gesture/react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Orbit,
  Zap,
  Waves,
  Bug,
  Grid3X3,
  Flame,
  Sparkles,
  Hexagon,
  Star,
  Diamond,
  Pentagon,
  Triangle,
  Circle,
  Square,
  ArrowRight,
  Twitter,
  Send,
  Github,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useListings } from "@/hooks/useListings";
import { clamp } from "@/lib/clamp";
import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  FRAME_GAP,
  STEP_SIZE,
  MINIMAP_TOTAL_WIDTH,
  PARALLAX_OFFSETS,
  TOTAL_WIDTH,
  LINE_WIDTH,
  LINE_GAP,
} from "@/lib/frameConstants";
import styles from "./page.module.css";

// ============================================
// Texture icons — scattered across hero frame
// ============================================

const TEXTURE_ICONS = [
  Orbit, Zap, Waves, Bug, Grid3X3, Flame,
  Sparkles, Hexagon, Star, Diamond, Pentagon, Triangle,
  Circle, Square,
];

// Pre-computed positions for texture icons (deterministic so no hydration mismatch)
const TEXTURE_POSITIONS = [
  { x: 8, y: 12, size: 18, rotate: 15, opacity: 0.06 },
  { x: 22, y: 68, size: 14, rotate: -30, opacity: 0.05 },
  { x: 35, y: 25, size: 20, rotate: 45, opacity: 0.07 },
  { x: 5, y: 45, size: 16, rotate: -15, opacity: 0.05 },
  { x: 48, y: 8, size: 12, rotate: 60, opacity: 0.04 },
  { x: 15, y: 85, size: 22, rotate: -45, opacity: 0.06 },
  { x: 42, y: 55, size: 15, rotate: 30, opacity: 0.05 },
  { x: 28, y: 40, size: 18, rotate: -60, opacity: 0.06 },
  { x: 55, y: 75, size: 14, rotate: 20, opacity: 0.04 },
  { x: 10, y: 30, size: 16, rotate: -25, opacity: 0.05 },
  { x: 38, y: 90, size: 20, rotate: 50, opacity: 0.06 },
  { x: 50, y: 35, size: 13, rotate: -40, opacity: 0.04 },
  { x: 18, y: 55, size: 17, rotate: 35, opacity: 0.05 },
  { x: 45, y: 15, size: 15, rotate: -10, opacity: 0.05 },
  { x: 30, y: 75, size: 19, rotate: 70, opacity: 0.06 },
  { x: 3, y: 60, size: 14, rotate: -55, opacity: 0.04 },
  { x: 52, y: 50, size: 16, rotate: 25, opacity: 0.05 },
  { x: 25, y: 5, size: 18, rotate: -35, opacity: 0.06 },
  { x: 40, y: 65, size: 13, rotate: 40, opacity: 0.04 },
  { x: 12, y: 75, size: 20, rotate: -20, opacity: 0.07 },
  { x: 55, y: 25, size: 15, rotate: 55, opacity: 0.05 },
  { x: 33, y: 50, size: 17, rotate: -50, opacity: 0.05 },
  { x: 7, y: 92, size: 14, rotate: 15, opacity: 0.04 },
  { x: 47, y: 42, size: 16, rotate: -65, opacity: 0.05 },
];

// ============================================
// ClipReveal — text slides up from below
// ============================================

function ClipReveal({
  children,
  delay,
  y = 100,
  variant,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  variant?: "offset";
}) {
  return (
    <motion.p
      className={variant === "offset" ? styles.clipRevealOffset : styles.clipReveal}
    >
      <motion.span
        initial={{ y }}
        animate={{ y: 0 }}
        transition={{
          y: {
            type: "spring",
            stiffness: 240,
            damping: 32,
            mass: 0.1,
            restSpeed: 0.0001,
            restDelta: 0.0001,
            delay: delay ? delay + 0.2 : 0.2,
          },
        }}
      >
        {children}
      </motion.span>
    </motion.p>
  );
}

// ============================================
// Frame component
// ============================================

function Frame({
  children,
  className,
  variant = "default",
  index,
  scale,
  translateX,
  onFocus,
  step,
  sheetClass,
}: {
  children: ReactNode;
  className?: string;
  variant?: "main" | "slide" | "default";
  index: number;
  scale: MotionValue<number>;
  translateX?: MotionValue<number>;
  onFocus?: (index: number) => void;
  step: number;
  sheetClass?: string;
}) {
  const frameIndex = index + 1;
  const parallaxX = useSpring(0, { stiffness: 500, damping: 40 });
  const fallbackMotion = useMotionValue(0);
  const motionSource = translateX ?? fallbackMotion;
  const stepOffset = step * frameIndex;

  useMotionValueEvent(motionSource, "change", (val) => {
    if (!PARALLAX_OFFSETS[index]) return;
    const scrolled = -1 * val;
    if (scrolled === 0) {
      parallaxX.set(0);
      return;
    }
    if (scrolled > stepOffset) {
      let offset = scrolled - stepOffset;
      offset = clamp(offset, [0, PARALLAX_OFFSETS[index]]);
      parallaxX.set(-1 * offset);
    }
  });

  const inverseScale = useTransform(scale, (s) => 1 / s);
  const labelTop = useTransform(scale, (s) => -28 / s);

  return (
    <div
      className={`${styles.frame} ${className || ""}`}
      data-variant={variant}
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        ...(variant !== "main" && {
          position: "absolute" as const,
          left: 1240 * frameIndex,
        }),
      }}
      onFocus={() => onFocus?.(frameIndex)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        data-sheet
        className={sheetClass || styles.sheet}
      >
        {variant === "slide" ? (
          <motion.div style={{ x: parallaxX }} className={styles.contents}>
            {children}
          </motion.div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ============================================
// Minimap
// ============================================

function Minimap() {
  const lineCount = 16;
  const lines = Array.from({ length: lineCount });

  return (
    <div
      aria-hidden
      className={styles.minimap}
      style={
        {
          "--line-width": `${LINE_WIDTH}px`,
          "--line-gap": `${LINE_GAP}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.minimapInner}>
        {lines.map((_, i) => (
          <div
            key={i}
            className={styles.minimapLine}
            style={{ opacity: i < 3 ? 0 : 1 }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

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

function shortenAddr(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

// ============================================
// Frame content: Marketplace
// ============================================

function MarketplaceFrame() {
  const { listings, loading } = useListings({ limit: 4, sort: "newest" });

  // Featured card (first listing)
  const featured = listings[0];
  const rest = listings.slice(1, 4);

  return (
    <div style={{ padding: 40, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: 24, fontWeight: 500, color: "var(--color-gray-11)" }}>
          {listings.length > 0 ? "Trending" : "Marketplace"}
        </p>
        <Link
          href="/gallery"
          style={{
            fontSize: 14,
            color: "var(--color-gray-9)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          View all <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--color-gray-9)",
              fontSize: 14,
            }}
          >
            Loading...
          </div>
        ) : listings.length > 0 ? (
          <div className={styles.marketplaceGrid}>
            {/* Featured card — left column, full height */}
            {featured && (
              <Link
                href={`/nft/${featured.mintAddress}`}
                className={`${styles.nftCard} ${styles.nftCardFeatured}`}
              >
                {featured.nftImageUrl ? (
                  <img
                    src={featured.nftImageUrl}
                    alt={featured.nftName}
                    className={styles.nftCardImage}
                  />
                ) : (
                  <div className={styles.nftCardPlaceholder}>
                    <Sparkles style={{ width: 32, height: 32, color: "var(--color-gray-7)" }} />
                  </div>
                )}
                <div className={styles.nftCardOverlay} />
                <div className={styles.nftCardInfo}>
                  <div className={styles.nftCardName}>{featured.nftName}</div>
                  <div className={styles.nftCardMeta}>
                    <span className={styles.nftCardPrice}>
                      {featured.priceSol} SOL
                    </span>
                    <span className={styles.nftCardSeller}>
                      {shortenAddr(featured.sellerWallet)} &middot; {timeAgo(featured.listedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Right column — stacked cards */}
            {rest.map((listing) => (
              <Link
                key={listing.id}
                href={`/nft/${listing.mintAddress}`}
                className={styles.nftCard}
              >
                {listing.nftImageUrl ? (
                  <img
                    src={listing.nftImageUrl}
                    alt={listing.nftName}
                    className={styles.nftCardImage}
                  />
                ) : (
                  <div className={styles.nftCardPlaceholder}>
                    <Sparkles style={{ width: 20, height: 20, color: "var(--color-gray-7)" }} />
                  </div>
                )}
                <div className={styles.nftCardOverlay} />
                <div className={styles.nftCardInfoCompact}>
                  <div className={styles.nftCardNameCompact}>{listing.nftName}</div>
                  <div className={styles.nftCardMeta}>
                    <span className={styles.nftCardPriceCompact}>
                      {listing.priceSol} SOL
                    </span>
                    <span className={styles.nftCardSeller}>
                      {timeAgo(listing.listedAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Fill empty slots if fewer than 3 rest items */}
            {rest.length < 3 &&
              Array.from({ length: 3 - rest.length }).map((_, i) => (
                <Link
                  key={`empty-${i}`}
                  href="/create"
                  className={styles.nftCard}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.nftCardPlaceholder}>
                    <div style={{ textAlign: "center" }}>
                      <Sparkles style={{ width: 24, height: 24, color: "var(--color-gray-6)", marginBottom: 8 }} />
                      <div style={{ fontSize: 12, color: "var(--color-gray-7)" }}>Mint yours</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          /* Empty state — full frame invitation */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 20,
            }}
          >
            <Sparkles style={{ width: 48, height: 48, color: "var(--color-gray-6)" }} />
            <p style={{ fontSize: 20, color: "var(--color-gray-9)", fontWeight: 500 }}>
              No listings yet
            </p>
            <p style={{ fontSize: 14, color: "var(--color-gray-7)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>
              Create AI-powered art and be the first to list on the marketplace.
            </p>
            <Link
              href="/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--color-accent)",
                color: "var(--color-on-accent)",
                padding: "12px 28px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Start Creating <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Frame content: QuoteFrame
// ============================================

function QuoteFrame({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <div className={styles.contentsYellow}>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 65,
            fontWeight: 400,
            color: "var(--color-gray-1)",
            lineHeight: 1.15,
            marginBottom: 40,
          }}
        >
          Turn ideas into art.
          <br />
          Mint it. Own it.
          <br />
          Make it unique.
          <br />
          Make it yours.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "var(--color-gray-1)",
            color: "var(--color-accent)",
            padding: "14px 32px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Get Started
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Frame content: ContactFrame
// ============================================

function ContactFrame() {
  return (
    <div className={styles.contact}>
      <a href="/create" className={styles.contactTopLeft}>
        Create
      </a>
      <a href="/gallery" className={styles.contactTopRight}>
        Gallery
      </a>
      <div className={styles.contactBottomLeft}>
        <span
          style={{
            fontSize: 14,
            color: "var(--color-gray-8)",
            fontWeight: 400,
          }}
        >
          &copy; {new Date().getFullYear()} MintAI
        </span>
      </div>
      <div className={styles.contactBottomRight} style={{ display: "flex", gap: 24 }}>
        <a href="#" style={{ fontSize: 14 }} aria-label="Twitter">
          <Twitter style={{ width: 20, height: 20, color: "var(--color-gray-9)" }} />
        </a>
        <a href="#" style={{ fontSize: 14 }} aria-label="Telegram">
          <Send style={{ width: 20, height: 20, color: "var(--color-gray-9)" }} />
        </a>
        <a href="#" style={{ fontSize: 14 }} aria-label="GitHub">
          <Github style={{ width: 20, height: 20, color: "var(--color-gray-9)" }} />
        </a>
      </div>

      {/* Center logo */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            fontSize: 85,
            fontWeight: 400,
            color: "var(--color-gray-12)",
          }}
        >
          Mint
        </span>
        <span
          style={{
            fontSize: 85,
            fontWeight: 400,
            color: "var(--color-accent)",
          }}
        >
          AI
        </span>
      </div>
    </div>
  );
}

// ============================================
// Frame definitions (styles removed — now 3 content frames)
// ============================================

const CONTENT_FRAMES = [
  { id: "marketplace", variant: "slide" as const },
  { id: "quote", variant: "default" as const, color: "var(--color-accent)" },
  { id: "contact", variant: "slide" as const },
];

// ============================================
// Main page component
// ============================================

const TOTAL_FRAMES = CONTENT_FRAMES.length + 1;

export default function HomePage() {
  const isTouch = useMediaQuery("(pointer: coarse)");
  const step = 1240 / (isTouch ? 5 : 3);

  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const mainRef = useRef<HTMLElement>(null);
  const isWheeling = useRef(false);
  const scrollDirection = useRef<"x" | "y" | null>(null);
  const maxScaleRef = useRef(1);

  const [ghostExtra, setGhostExtra] = useState(0);
  const [cancelAnimation, setCancelAnimation] = useState(false);

  // Motion values
  const scrollTranslateX = useMotionValue(0);
  const scaleSpring = useSpring(1, { stiffness: 500, damping: 50 });
  const { scrollY, scrollX, scrollXProgress } = useScroll();
  const translateZ = useMotionValue(0);

  const handleGetStarted = useCallback(() => {
    if (authenticated) {
      router.push("/create");
    } else {
      login();
    }
  }, [authenticated, router, login]);

  // Handle scroll input to move frames horizontally
  const handleScroll = useCallback(
    (scrollAmount: number) => {
      if (isWheeling.current) scrollY.stop();
      if (!cancelAnimation) setCancelAnimation(true);

      let newScale = maxScaleRef.current;
      if (scrollAmount > 0) {
        newScale = clamp(scaleSpring.get() + -(0.01 * scrollAmount * 0.01), [
          0.6,
          maxScaleRef.current,
        ]);
      }
      scaleSpring.set(newScale);

      const frameWidth = FRAME_WIDTH * newScale;
      const frameGap = FRAME_GAP * newScale;
      const totalSteps = CONTENT_FRAMES.length * STEP_SIZE;
      const maxTranslate = totalSteps * CONTENT_FRAMES.length;
      scrollTranslateX.set(
        clamp((totalSteps / (frameWidth + frameGap)) * scrollAmount, [
          0,
          maxTranslate,
        ])
      );
    },
    [cancelAnimation, scaleSpring, scrollTranslateX, scrollY]
  );

  // Smooth scroll to a specific frame index
  function scrollToFrame(index: number) {
    const target = 744 * index;
    const startScroll = document.documentElement.scrollTop;
    const diff = target - startScroll;
    const duration = 400;
    const startTime = performance.now();

    function animStep(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      document.documentElement.scrollTop = startScroll + diff * eased;
      if (progress < 1) {
        requestAnimationFrame(animStep);
      }
    }

    requestAnimationFrame(animStep);
  }

  // Wheel gesture
  useWheel(
    (state) => {
      const { first, last } = state;
      if (first) isWheeling.current = true;
      if (last) isWheeling.current = false;
    },
    { target: typeof window !== "undefined" ? window : undefined }
  );

  // Track scrollXProgress for touch devices
  useMotionValueEvent(scrollXProgress, "change", (progress) => {
    if (isTouch) {
      scrollTranslateX.set(progress * MINIMAP_TOTAL_WIDTH);
    }
  });

  // Track scrollX
  useMotionValueEvent(scrollX, "change", (val) => {
    if (!scrollDirection.current) {
      document.body.style.overflowY = "hidden";
      scrollDirection.current = "x";
    }
    if (scrollDirection.current === "x") {
      translateZ.set(-1 * val);
      handleScroll(val);
    }
  });

  // Track scrollY
  useMotionValueEvent(scrollY, "change", (val) => {
    if (!scrollDirection.current) {
      document.body.style.overflowX = "hidden";
      scrollDirection.current = "y";
    }
    if (scrollDirection.current === "y") {
      translateZ.set(-1 * val);
      handleScroll(val);
    }
  });

  // Initialize scale and ghost size
  useEffect(() => {
    function updateSize() {
      if (!mainRef.current) return;

      const computedScale = clamp(
        Math.min(window.innerWidth / 1300, window.innerHeight / 1020),
        [0.2, 1]
      );

      if (scaleSpring.get() !== 0.6) {
        scaleSpring.jump(computedScale);
      }
      maxScaleRef.current = computedScale;

      const minScale = computedScale < 0.6 ? computedScale : 0.6;
      const clientWidth = mainRef.current.clientWidth * minScale;
      const extra =
        TOTAL_WIDTH * minScale -
        clientWidth +
        2 * ((window.innerWidth - FRAME_WIDTH) / 2) * minScale;
      setGhostExtra(extra);
    }

    window.history.scrollRestoration = "manual";
    document.documentElement.scrollTo(0, 0);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [scaleSpring]);

  // Render frame content based on ID
  function renderFrameContent(id: string) {
    switch (id) {
      case "marketplace":
        return <MarketplaceFrame />;
      case "quote":
        return <QuoteFrame onGetStarted={handleGetStarted} />;
      case "contact":
        return <ContactFrame />;
      default:
        return null;
    }
  }

  return (
    <>
      <main
        ref={mainRef}
        data-sheet="index"
        data-cancel-animation={cancelAnimation}
        style={
          {
            "--frame-width": `${FRAME_WIDTH}px`,
            "--frame-height": `${FRAME_HEIGHT}px`,
          } as React.CSSProperties
        }
        className={styles.root}
      >
        {/* Ghost element for scroll sizing */}
        <div
          aria-hidden
          className={styles.ghost}
          style={{
            width: `calc(100vw + ${ghostExtra}px)`,
            height: `calc(100vh + ${ghostExtra}px)`,
          }}
        />

        {/* Center container */}
        <div className={styles.center}>
          <motion.div
            style={{
              x: isTouch ? undefined : translateZ,
              scale: scaleSpring,
              opacity: ghostExtra ? 1 : 0,
            }}
            className={styles.frames}
          >
            {/* Main hero frame */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 60,
                mass: 0.2,
                restSpeed: 0.0001,
                restDelta: 0.0001,
              }}
              className={styles.mainContainer}
            >
              <div
                className={styles.frame}
                data-variant="main"
                style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
              >
                <div data-sheet className={`${styles.sheet} ${styles.main}`}>
                  {/* Vector texture — scattered style icons */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    {TEXTURE_POSITIONS.map((pos, i) => {
                      const Icon = TEXTURE_ICONS[i % TEXTURE_ICONS.length];
                      return (
                        <Icon
                          key={i}
                          style={{
                            position: "absolute",
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            width: pos.size,
                            height: pos.size,
                            opacity: pos.opacity,
                            transform: `rotate(${pos.rotate}deg)`,
                            color: "var(--color-accent)",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Text reveals */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <ClipReveal>Create</ClipReveal>
                    <ClipReveal delay={0.1} variant="offset">
                      Unique
                    </ClipReveal>
                    <ClipReveal delay={0.2}>AI Art</ClipReveal>
                    <ClipReveal delay={0.3} variant="offset">
                      As NFTs
                    </ClipReveal>

                    {/* CTA */}
                    <motion.button
                      onClick={handleGetStarted}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        background: "var(--color-accent)",
                        color: "var(--color-on-accent)",
                        padding: "14px 32px",
                        borderRadius: 999,
                        fontSize: 16,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        marginTop: 32,
                      }}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 30,
                        delay: 1.0,
                      }}
                    >
                      Start Creating
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </motion.button>
                  </div>

                  {/* Statue + accent circle behind it */}
                  <motion.div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: "100%",
                      aspectRatio: "1/1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 30,
                      delay: 0.8,
                    }}
                  >
                    {/* Accent circle — centered on sculpture, ~72% its size */}
                    <motion.div
                      style={{
                        position: "absolute",
                        width: "72%",
                        aspectRatio: "1/1",
                        borderRadius: "9999px",
                        background: "var(--color-accent)",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 600,
                        damping: 80,
                        mass: 0.2,
                        delay: 0.4,
                        restSpeed: 0.0001,
                        restDelta: 0.0001,
                      }}
                    />
                    <img
                      src="/images/hero-statue.webp"
                      alt="NFT Statue"
                      className={styles.statue}
                    />
                  </motion.div>

                </div>
              </div>
            </motion.div>

            {/* Content frames */}
            {CONTENT_FRAMES.map((frame, i) => (
              <Frame
                key={frame.id}
                index={i}
                scale={scaleSpring}
                translateX={translateZ}
                onFocus={scrollToFrame}
                step={step}
                variant={frame.variant}
                sheetClass={
                  frame.id === "quote" ? styles.sheetYellow : styles.sheet
                }
              >
                {renderFrameContent(frame.id)}
              </Frame>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Minimap */}
      <Minimap />
    </>
  );
}
