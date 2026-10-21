"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, refreshOnFontsReady } from "@/components/gsap/gsap-config";

/**
 * Lenis smooth scroll, driven by GSAP's ticker.
 *
 * The wiring matters: two independent rAF loops (Lenis's own plus GSAP's) will
 * drift against each other and produce visible stutter on long pinned sections.
 * Running Lenis from gsap.ticker keeps one clock for both, and forwarding its
 * scroll event to ScrollTrigger.update is what keeps pinned/scrubbed sections
 * aligned to the visual position.
 *
 * Disabled under prefers-reduced-motion — forced smooth scrolling is a known
 * vestibular trigger and the OS setting is an explicit request not to do it.
 */
export function SmoothScrollProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      // Exponential ease-out. Matches the --ease-out token used in CSS.
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Native momentum on touch. Lenis's synthetic touch handling fights iOS
      // Safari's own, and the result feels broken rather than smooth.
      syncTouch: false,
    });
    // Debug/verification handle: scripted positioning (lenis.scrollTo with
    // immediate:true) is the only reliable way to anchor a scroll position
    // deterministically — window.scrollTo fights this instance's rAF loop, and
    // `window.lenis` is just a version marker set by the package itself.
    (window as unknown as { __lenis: Lenis }).__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // ScrollTrigger drives from the same tick; lagging can desync pinned pins.
    gsap.ticker.lagSmoothing(0);

    /**
     * Scroll is held until the hero intro resolves, so the visitor can't
     * scroll straight past the one animation the page exists to show. The
     * reference does this by starting Lenis in the `stopped` state.
     *
     * The timeout is not optional. If the hero tween never fires — font
     * failure, JS error, a browser that skips the intro — an un-released
     * `stop()` makes the entire page unscrollable, which is far worse than
     * losing the effect. The release is idempotent so whichever runs first wins.
     */
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      lenis.start();
      document.documentElement.classList.remove("lenis-stopped");
      ScrollTrigger.refresh();
    };

    lenis.stop();
    document.documentElement.classList.add("lenis-stopped");

    // Released on the frame after fonts settle — close enough to the intro's
    // own start, and independent of it, so it can't be starved.
    const ready = "fonts" in document ? document.fonts.ready : Promise.resolve();
    void ready.then(() => requestAnimationFrame(release));
    // Hard ceiling in case the promise never settles.
    const failsafe = window.setTimeout(release, 2500);

    // Anchor links and any programmatic scroll go through Lenis so the easing
    // matches manual scrolling instead of jumping.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0 });
      history.replaceState(null, "", id);
    };

    document.addEventListener("click", onClick);
    refreshOnFontsReady();

    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(failsafe);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, []);

  return null;
}