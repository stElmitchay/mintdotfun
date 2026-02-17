"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Scroll Reveal ─────────────────────────────────────────────── */
export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  options: {
    y?: number;
    x?: number;
    duration?: number;
    delay?: number;
    ease?: string;
    start?: string;
    scrub?: boolean | number;
  } = {}
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      y = 60,
      x = 0,
      duration = 1,
      delay = 0,
      ease = "power3.out",
      start = "top 85%",
      scrub = false,
    } = options;

    gsap.set(el, { y, x, opacity: 0 });

    const tween = gsap.to(el, {
      y: 0,
      x: 0,
      opacity: 1,
      duration,
      delay,
      ease,
      scrollTrigger: {
        trigger: el,
        start,
        scrub,
        toggleActions: scrub ? undefined : "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Parallax ──────────────────────────────────────────────────── */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  speed: number = 0.5
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tween = gsap.to(el, {
      y: () => speed * 120,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Magnetic Cursor Effect ────────────────────────────────────── */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  strength: number = 0.3
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && "ontouchstart" in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      gsap.to(el, {
        x: deltaX * strength,
        y: deltaY * strength,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Stagger Children Reveal ───────────────────────────────────── */
export function useStaggerReveal(
  containerRef: RefObject<HTMLElement | null>,
  childSelector: string,
  options: {
    y?: number;
    stagger?: number;
    duration?: number;
    ease?: string;
    start?: string;
  } = {}
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      y = 40,
      stagger = 0.1,
      duration = 0.8,
      ease = "power3.out",
      start = "top 85%",
    } = options;

    const children = container.querySelectorAll(childSelector);
    gsap.set(children, { y, opacity: 0 });

    const tween = gsap.to(children, {
      y: 0,
      opacity: 1,
      duration,
      stagger,
      ease,
      scrollTrigger: {
        trigger: container,
        start,
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Clip-Path Reveal ──────────────────────────────────────────── */
export function useClipReveal(
  ref: RefObject<HTMLElement | null>,
  options: {
    direction?: "up" | "down" | "left" | "right";
    duration?: number;
    delay?: number;
    ease?: string;
    start?: string;
  } = {}
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      direction = "up",
      duration = 1.2,
      delay = 0,
      ease = "power4.out",
      start = "top 88%",
    } = options;

    const clipFrom: Record<string, string> = {
      up: "inset(100% 0 0 0)",
      down: "inset(0 0 100% 0)",
      left: "inset(0 100% 0 0)",
      right: "inset(0 0 0 100%)",
    };

    gsap.set(el, {
      clipPath: clipFrom[direction],
      y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
    });

    const tween = gsap.to(el, {
      clipPath: "inset(0% 0% 0% 0%)",
      y: 0,
      duration,
      delay,
      ease,
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Line Draw (SVG) ───────────────────────────────────────────── */
export function useLineDraw(
  ref: RefObject<SVGPathElement | SVGLineElement | null>,
  options: {
    start?: string;
    end?: string;
  } = {}
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { start = "top 80%", end = "bottom 40%" } = options;

    const length = (el as SVGGeometryElement).getTotalLength?.() ?? 0;
    if (!length) return;

    gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });

    const tween = gsap.to(el, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start,
        end,
        scrub: 1,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export { gsap, ScrollTrigger };
