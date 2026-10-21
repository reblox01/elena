"use client";

/**
 * Single place where GSAP plugins get registered, ever.
 *
 * Registration is module-scope so it happens exactly once per bundle. Registering
 * inside a component body would re-register on every render.
 *
 * GSAP 3.13+ ships every plugin — SplitText and ScrollSmoother included — in the
 * public `gsap` package under MIT. No Club membership, no private registry.
 */
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Registering twice is harmless but noisy in dev, so it is guarded. A module
// boolean is the only reliable guard here: `gsap.core.globals()` is not part of
// the public typings.
let registered = false;
if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
  registered = true;
}

export { gsap, ScrollTrigger, SplitText, Flip };

/** Shared easing curves, matching the tokens in globals.css. */
export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  /** The reference's signature text-mask curve: slow settle, decisive arrival. */
  mask: "expo.out",
} as const;

/**
 * Whether the visitor has asked for less motion.
 * Read at animation-build time, not render time — a mid-session change requires
 * a reload to take effect, which is the documented behaviour.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Refreshes ScrollTrigger after the webfont lands.
 *
 * Fonts change text metrics, which changes where every trigger's start/end
 * sits. Without this, reveals fire at the wrong scroll position. Next/font
 * preloads, so this usually only matters for the display fallback.
 */
export function refreshOnFontsReady() {
  if (typeof document === "undefined") return;
  if (!("fonts" in document)) return;
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}