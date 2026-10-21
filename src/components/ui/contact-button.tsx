"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText, EASE, prefersReducedMotion } from "@/components/gsap/gsap-config";
import { cn } from "@/lib/utils";

/**
 * The reference's signature CTA.
 *
 * Anatomy matters here — this is not a button with a colour swap:
 *
 *   [dot]  [invisible sizer]  [absolutely-positioned clipped label]  [pad]
 *
 * The invisible sizer reserves the label's width so the pill never resizes.
 * The real label sits in an absolutely-centred, `overflow-hidden` window the
 * height of one line, so when the glyphs translate upward they appear to roll
 * out of a slot rather than simply move.
 *
 * The roll trick: every glyph carries `text-shadow: currentcolor 0 1.3em` — an
 * identical copy parked exactly one line below. Translating the glyph up by
 * 1.3em (100% of the line box) swaps it for its own copy, which is why the
 * effect can reverse mid-flight without the text ever disappearing.
 */
export function ContactButton({
  label,
  href,
  className,
}: {
  label: string;
  href: string;
  className?: string;
}) {
  const root = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rootEl = root.current;
    const labelEl = labelRef.current;
    if (!rootEl || !labelEl) return;

    // Under reduced motion the label must simply read as static text.
    if (prefersReducedMotion()) return;

    // Reverting any prior split first makes StrictMode's double-invoke safe:
    // without it the second pass splits already-split DOM and doubles the glyphs.
    SplitText.create(labelEl, { type: "chars", aria: "hidden" }).revert();

    const split = SplitText.create(labelEl, { type: "chars", aria: "hidden" });
    const chars = split.chars as Element[];
    if (!chars.length) {
      return () => split.revert();
    }

    const ctx = gsap.context(() => {
      // yPercent 0 sits on the real glyph; the shadow copy is parked one line
      // below, so no entry animation is needed.
      gsap.set(chars, {
        yPercent: 0,
        textShadow: "currentcolor 0 1.3em",
        willChange: "transform",
      });

      // One paused timeline instead of enter/leave tweens: reversing a
      // staggered tween mid-flight leaves glyphs at different offsets, so the
      // word comes back ragged.
      const tl = gsap.timeline({ paused: true });
      tl.to(chars, {
        yPercent: -100,
        duration: 0.45,
        stagger: { each: 0.028, from: "start" },
        ease: EASE.mask,
      });

      const onEnter = () => tl.play();
      const onLeave = () => tl.reverse();

      rootEl.addEventListener("pointerenter", onEnter);
      rootEl.addEventListener("pointerleave", onLeave);
      // Keyboard parity — focusing is equivalent to hovering here.
      rootEl.addEventListener("focus", onEnter);

      return () => {
        rootEl.removeEventListener("pointerenter", onEnter);
        rootEl.removeEventListener("pointerleave", onLeave);
        rootEl.removeEventListener("focus", onEnter);
      };
    }, rootEl);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [label]);

  return (
    <a
      ref={root}
      href={href}
      className={cn(
        "group relative flex h-[3.5vw] w-fit items-center justify-center gap-[0.9vw] overflow-hidden whitespace-nowrap rounded-full border border-white/20 bg-white px-[2vw] font-medium text-ink no-underline transition-colors duration-500 ease-out hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)] motion-reduce:transition-none",
        "max-[1025px]:h-[8vw] max-[1025px]:gap-[1.6vw] max-[1025px]:px-[3.5vw] max-[1025px]:font-normal",
        "max-md:h-[12vw] max-md:gap-[2.4vw] max-md:px-[5vw] max-md:font-normal",
        className,
      )}
    >
      {/* Dot. This is the hover fill.
          The reference scales it by 120, not 2.4: the dot is 0.5vw across, so
          120x is a 60vw disc — far larger than the ~8vw pill, which is how a
          pill-sized dot ends up flooding the whole button with the dark
          background colour and the label ends up sitting on top of it. A modest
          2.4x just makes a slightly bigger dot and nothing else happens.
          Over-the-top on purpose: the pill has overflow-hidden, so the disc is
          clipped to the button's own rounded rectangle. */}
      <span
        aria-hidden="true"
        className="relative z-10 flex size-[0.5vw] shrink-0 items-center justify-center max-[1025px]:size-[1.5vw] max-md:size-[2.3vw]"
        style={{ marginTop: "0.08em" }}
      >
        <span className="absolute inset-0 rounded-full bg-ink transition-transform duration-[400ms] ease-in-out [transition-timing-function:cubic-bezier(0.785,0.135,0.15,0.86)] group-hover:scale-[120] motion-reduce:transition-none" />
      </span>

      {/* Invisible sizer — reserves the label width so the pill never reflows. */}
      <span
        aria-hidden="true"
        className="invisible block h-[1.3em] leading-[1.3] font-normal [font-size:1.15vw] max-[1025px]:text-[3vw] max-md:text-[4.2vw]"
      >
        {label}
      </span>

      {/* The live label, inside a clipped one-line window. */}
      <span
        className="absolute left-1/2 top-1/2 z-20 block h-[1.3em] -translate-x-1/2 -translate-y-1/2 overflow-hidden font-normal [font-size:1.15vw] max-[1025px]:text-[3vw] max-md:text-[4.2vw]"
        style={{ marginTop: "0.08em" }}
      >
        <span ref={labelRef} className="block leading-[1.3]">
          {label}
        </span>
      </span>

      {/* Right-hand spacer so the dot sits optically centred. */}
      <span
        aria-hidden="true"
        className="block w-[0.5vw] shrink-0 max-[1025px]:w-[1.5vw] max-md:w-[2.3vw]"
      />
    </a>
  );
}