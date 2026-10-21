"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to `prefers-reduced-motion` and re-renders when it changes.
 *
 * For components that must *choose a different shape* under reduced motion
 * rather than merely skip a tween — a plucked string has to render as a flat
 * rule, not as a rule with its animation suppressed. GSAP timelines are handled
 * by `prefersReducedMotion()` inside gsap-config; this is for the markup.
 *
 * Starts `false` so server and first client render agree. The first effect pass
 * corrects it before paint of anything animated, and anything genuinely
 * motion-gated renders its static form for one frame — which is the safe
 * direction to be wrong in.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}