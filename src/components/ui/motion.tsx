"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// Spring configs
export const spring = {
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  snappy: { type: "spring" as const, stiffness: 300, damping: 30 },
  smooth: { type: "spring" as const, stiffness: 100, damping: 25, mass: 0.5 },
};

// Fade up animation for scroll reveals
export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...spring.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children container
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.gentle,
  },
};

// Scale on hover (for cards, buttons)
export function ScaleOnHover({
  children,
  className = "",
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={spring.snappy}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Text reveal — characters animate in
export function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: delay } },
      }}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "100%", opacity: 0 },
              visible: {
                y: "0%",
                opacity: 1,
                transition: { ...spring.gentle },
              },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </motion.span>
  );
}

// Page transition wrapper
export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Rauno Spring Configs ──────────────────────────────────────
export const raunoSpring = {
  hero: { type: "spring" as const, stiffness: 240, damping: 32, mass: 0.1 },
  circle: { type: "spring" as const, stiffness: 600, damping: 80, mass: 0.2 },
  section: { type: "spring" as const, stiffness: 300, damping: 40, mass: 0.15 },
};

// ── ClipReveal — text slides up from below ───────────────────
export function ClipReveal({
  children,
  delay = 0,
  variant,
  className = "",
  as: Tag = "p",
  triggerOnScroll = false,
}: {
  children: ReactNode;
  delay?: number;
  variant?: "offset";
  className?: string;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
  triggerOnScroll?: boolean;
}) {
  const MotionTag = motion.create(Tag);

  const animateProps = triggerOnScroll
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-40px" },
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <MotionTag
      className={`overflow-hidden ${variant === "offset" ? "ml-16" : ""} ${className}`}
      {...animateProps}
    >
      <motion.span
        className="inline-block"
        variants={{
          hidden: { y: "110%" },
          visible: {
            y: "0%",
            transition: {
              y: {
                ...raunoSpring.hero,
                delay: delay + 0.2,
                restSpeed: 0.0001,
                restDelta: 0.0001,
              },
            },
          },
        }}
      >
        {children}
      </motion.span>
    </MotionTag>
  );
}

// ── ScaleInCircle — yellow circle scales in ──────────────────
export function ScaleInCircle({
  className = "",
  delay = 0.4,
  size = 300,
}: {
  className?: string;
  delay?: number;
  size?: number;
}) {
  return (
    <motion.div
      className={`rounded-full bg-accent aspect-square ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        ...raunoSpring.circle,
        delay,
        restSpeed: 0.0001,
        restDelta: 0.0001,
      }}
    />
  );
}

// Re-export motion for direct use
export { motion };
