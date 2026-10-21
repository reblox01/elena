"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, SplitText, EASE, prefersReducedMotion } from "@/components/gsap/gsap-config";
import { cn } from "@/lib/utils";

type Props = {
  /** Text content. Newlines split lines when `type` includes "lines". */
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Which units SplitText produces. "lines" needs word wrapping to have run. */
  type?: "lines" | "words" | "chars" | "words,chars";
  className?: string;
  /**
   * "immediate" — plays as soon as it mounts (entrance).
   * "scroll"     — plays when the element scrolls into view.
   * "drift"      — starts in place and is carried downward by scroll progress.
   *                This is what the reference hero does: its glyph transforms
   *                read ~0% at load and grow as you scroll. A "reveal" variant
   *                would leave the headline invisible at scroll 0, which is the
   *                one thing a portfolio's first screen must never do.
   */
  trigger?: "immediate" | "scroll" | "drift";
  /** Seconds of stagger between units. */
  stagger?: number;
  /** Seconds before playback. */
  delay?: number;
  /** For scrub: the element that owns the scroll distance (the tall wrapper). */
  scrubTarget?: React.RefObject<HTMLElement | null>;
  /** Per-character distance, as a percentage of line height. */
  from?: number;
};

export function SplitReveal({
  text,
  as: Tag = "div",
  type = "lines",
  className,
  trigger = "immediate",
  stagger = 0.045,
  delay = 0,
  scrubTarget,
  from = 110,
}: Props) {
  const elRef = useRef<HTMLElement>(null);
  const splitRef = useRef<SplitText | null>(null);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Under reduced motion the text must be plainly visible. Any transform or
    // opacity set below is deliberately skipped, so nothing is left hidden.
    if (prefersReducedMotion()) return;

    // Fonts decide line breaks. Splitting before metrics settle means the
    // masks wrap at the wrong place and stay there.
    let ready: Promise<unknown> = Promise.resolve();
    if ("fonts" in document) ready = document.fonts.ready;

    let disposed = false;

    ready.then(() => {
      if (disposed || !el.isConnected) return;

      // Reverting any prior split first — StrictMode's double-invoke would
      // otherwise split already-split DOM and double every unit.
      splitRef.current?.revert();

      const wantsLines = type.includes("lines");

      const split = SplitText.create(el, {
        type,
        mask: wantsLines ? "lines" : "words",
        // Leaves the full string on an aria-label and hides the generated
        // spans, so a screen reader announces a sentence rather than letters.
        aria: "auto",
        // Words carry their trailing space, which is otherwise trimmed and
        // visibly collapses gaps between masked words.
        wordDelimiter: " ",
      });
      splitRef.current = split;

      const units = (wantsLines ? split.lines : split.words) as Element[];
      if (!units.length) return;

      const ctx = gsap.context(() => {
        if (trigger === "drift") {
          // Start fully in place so the headline is readable at scroll 0, then
          // let scroll carry it down behind its own mask. Opacity is never
          // touched — this is movement, not a reveal.
          gsap.fromTo(
            units,
            { yPercent: 0 },
            {
              yPercent: from,
              ease: "none",
              stagger,
              scrollTrigger: {
                trigger: scrubTarget?.current ?? el,
                start: "top top",
                end: "bottom center",
                scrub: true,
              },
            },
          );
          return;
        }

        // Start below the mask; the mask clips the movement, so glyphs read as
        // pushed up into view rather than sliding.
        gsap.set(units, { yPercent: from, opacity: 0 });

        // ctx.revert() below kills every tween created in here, so no explicit
        // per-tween teardown is needed (and gsap.context discards a returned
        // cleanup fn anyway).
        gsap.to(units, {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          delay,
          stagger,
          ease: EASE.mask,
          ...(trigger === "scroll"
            ? {
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }
            : {}),
        });
      }, el);

      // Parked on the element so unmount can tear both halves down together.
      (el as HTMLElement & { __gsapCtx?: gsap.Context }).__gsapCtx = ctx;
    });

    return () => {
      disposed = true;
      // Use `el` (captured once at the top of this effect), not elRef.current.
      // By cleanup time the ref may already point at a replacement node, which
      // would leave the real context and split instance orphaned.
      const target = el as HTMLElement & { __gsapCtx?: gsap.Context };
      target.__gsapCtx?.revert();
      delete target.__gsapCtx;
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [text, type, trigger, stagger, delay, from, scrubTarget]);

  return (
    <Tag ref={elRef as never} className={cn(className)}>
      {text}
    </Tag>
  );
}