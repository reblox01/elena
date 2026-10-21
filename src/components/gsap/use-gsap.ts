"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/components/gsap/gsap-config";
import { prefersReducedMotion } from "@/components/gsap/gsap-config";

/**
 * Builds GSAP work inside a scoped context that is reverted on unmount.
 *
 * This is the only sanctioned way to create animations in this project. A raw
 * useEffect + gsap.to() leaks tweens and ScrollTriggers on every route change
 * and on React StrictMode's deliberate double-mount, which shows up as elements
 * stuck at opacity 0 that never come back.
 *
 * The callback runs inside gsap.context(), so every selector it touches resolves
 * against `scopeRef` rather than the whole document — two sections can both use
 * ".mask" without stealing each other's elements.
 *
 * @param build Receives the scope element. May return a cleanup fn.
 * @param deps  Re-run when these change. Default: once on mount.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  build: (scope: T) => void | (() => void),
  deps: React.DependencyList = [],
) {
  const scopeRef = useRef<T>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    // Reduced motion: skip construction entirely rather than building tweens and
    // neutralising them. Cheaper, and guarantees nothing is left half-applied.
    if (prefersReducedMotion()) return;

    // gsap.context() discards its callback's return value — there is no way to
    // read it back off the context. Capture it in a closure instead.
    let userCleanup: void | (() => void);

    const ctx = gsap.context(() => {
      userCleanup = build(scope);
    }, scope);

    return () => {
      ctx.revert(); // kills tweens + ScrollTriggers + restores inline styles
      if (typeof userCleanup === "function") userCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}

/**
 * Runs `build` under whichever of the given conditions currently match, and
 * tears it down whenever they change.
 *
 * gsap.matchMedia() keeps an internal context for each condition set and reverts
 * it automatically on cleanup, so anything created synchronously inside is
 * collected. Do NOT nest another gsap.context() in here — it would be invisible
 * to the matchMedia cleanup and leak.
 *
 * `build` may return a cleanup function, which runs on every teardown. Anything
 * it owns outside the GSAP world — a window listener, a bare rAF loop, a
 * `pointermove` handler — is invisible to ctx.revert() and leaks without this.
 */
export function useGsapMatchMedia<T extends HTMLElement = HTMLDivElement>(
  build: (scope: T, ctx: { mobile: boolean; desktop: boolean; reduced: boolean }) => void | (() => void),
  deps: React.DependencyList = [],
) {
  const scopeRef = useRef<T>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const mm = gsap.matchMedia();

    // Collected per condition-set and run when that set is torn down, so a
    // listener registered under `desktop` doesn't outlive the desktop layout.
    let cleanups: Array<void | (() => void)> = [];

    mm.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        mobile: "(max-width: 1024px)",
        desktop: "(min-width: 1025px)",
      },
      (context) => {
        const { reduced = false, mobile = false, desktop = false } = context.conditions as Record<string, boolean>;
        cleanups.push(build(scope, { mobile, desktop, reduced }));
      },
    );

    return () => {
      for (const fn of cleanups) if (typeof fn === "function") fn();
      cleanups = [];
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}

export { ScrollTrigger };