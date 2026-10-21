"use client";

import Image from "next/image";
import { useRef } from "react";
import { SplitReveal } from "@/components/gsap/split-reveal";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { site, projects } from "@/lib/data";

/* --------------------------------------------------------------------------
   h-[100svh], not h-screen. The reference uses 100vh; on mobile that is the
   *large* viewport height, so it changes when the URL bar retracts — and a
   sticky, scaled box that changes height mid-scroll visibly jumps. svh is the
   small viewport height and does not move. On desktop the three are identical,
   so this costs nothing there.
   ------------------------------------------------------------------------ */
const IMG_TRAVEL = 30;
const TEXT_TRAVEL = 12;
/** Per-frame easing toward the cursor target. Lower = heavier, more laggy. */
const PARALLAX_LERP = 0.08;

/**
 * HERO — 300vh, two full-bleed layers, three behaviours.
 *
 * The layers are siblings, and which one wins is the whole effect:
 *
 *   1. STAGE (z-2, first) — the warm ground, the headline and the artwork.
 *      Pinned, and it scales to 0.5 over the section's scroll.
 *   2. MARQUEE BED (no z-index, second) — the two-column project plates on
 *      near-black. Sits *behind* the stage, so it only becomes visible as the
 *      stage shrinks away from it.
 *
 * The bed starts at `blur(24px)` / 35% opacity and sharpens to fully opaque
 * across the first third of the scroll. Blurred-but-opaque would just be a dark
 * smear; blurred-and-translucent over the shrinking hero reads as depth, and it
 * hands off to the portfolio section that follows immediately.
 *
 * Pointer parallax is a separate rAF loop, not a tween — the cursor is a
 * continuous input, and a scrubbed timeline would lag behind it.
 */
export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const artInner = useRef<HTMLDivElement>(null);
  const textWrap = useRef<HTMLDivElement>(null);
  const marquee = useRef<HTMLDivElement>(null);

  // ---- Intro + scroll scrub + pointer parallax ------------------------------
  //
  // All three live in ONE hook, and the section's ref comes FROM the hook.
  // That is not a stylistic choice: useGsapMatchMedia builds its own internal
  // scope ref and bails immediately if nothing is attached to it. Declaring a
  // separate `const section = useRef()` and putting that on the element instead
  // leaves the hook's ref null, every build returns early, and the section
  // silently renders as a static image with no scroll, mask or pointer
  // behaviour — which is exactly what it looks like from the outside.
  //
  // useGsapMatchMedia rather than useGsap so the reduced-motion branch can pin
  // the artwork visible instead of just standing down: the `.hero-mask-reveal`
  // start state is gated on `html.js`, so something has to undo it.
  const section = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced, desktop }) => {
      const artEl = art.current;
      const stageEl = stage.current;
      const marqueeEl = marquee.current;

      if (!artEl || !stageEl || !marqueeEl) return;

      if (reduced) {
        // Undo the `html.js` pre-animation state rather than standing down.
        gsap.set(artEl, { opacity: 1, "--reveal": "125%" });
        gsap.set(marqueeEl, { filter: "none", opacity: 1 });
        return;
      }

      // -- Intro (once) -------------------------------------------------------
      // The mask band is driven through a plain object rather than tweened
      // directly: `--reveal` is interpolated inside a calc() inside mask-image,
      // which the browser will not tween. Writing the value per frame is the
      // only way to get a smooth sweep.
      const band = { at: -40 };
      artEl.style.setProperty("--reveal", "-40%");

      const intro = gsap.timeline({ defaults: { overwrite: "auto" } });

      intro
        .to(
          band,
          {
            at: 125,
            duration: 3.5,
            ease: "power2.out",
            onUpdate: () => artEl.style.setProperty("--reveal", `${band.at}%`),
          },
          0,
        )
        .fromTo(artEl, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 0)
        // Header drops in from above and lands just after the copy has settled.
        // The reference releases smooth scroll from this onComplete; this project
        // releases from SmoothScrollProvider on fonts-ready with a hard failsafe,
        // which cannot be starved by the hero failing to mount.
        .fromTo(
          ["#header", "#header-logo"],
          { yPercent: -50, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          1.8,
        );

      // -- Scroll scrub -------------------------------------------------------
      gsap.set(marqueeEl, { filter: "blur(24px)", opacity: 0.35 });

      const scrub = gsap.timeline({
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          // Re-measure if the font swaps or a breakpoint moves: the pinned box
          // height is vw-derived, so stale numbers show as a visible jump.
          invalidateOnRefresh: true,
        },
      });

      scrub
        .to(stageEl, { scale: 0.5, ease: "power2.inOut", duration: 1 }, 0)
        // Position .32, duration .18 → sharpens between 32% and 50% of the
        // section, i.e. while the stage is still more than half-size.
        .to(marqueeEl, { filter: "blur(0px)", opacity: 1, ease: "power2.out", duration: 0.18 }, 0.32);

      // ---- Pointer parallax ------------------------------------------------
      // A bare rAF loop rather than a tween: the cursor is a continuous input,
      // and anything scrubbed or timeline-driven lags a frame behind it.
      const artTarget = artInner.current;
      const textTarget = textWrap.current;
      if (!desktop || !artTarget || !textTarget) return;

      // Desktop pointer only. A touch drag fires pointermove as part of the
      // scroll gesture and would yank the hero sideways mid-swipe.
      const state = { imgX: 0, imgY: 0, textX: 0, textY: 0 };
      const goal = { imgX: 0, imgY: 0, textX: 0, textY: 0 };

      const onMove = (e: PointerEvent) => {
        // Normalise to -1..1 across the viewport, then invert: moving the cursor
        // right pushes the artwork left, which reads as looking past it.
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        goal.imgX = -(IMG_TRAVEL * x);
        goal.imgY = -(IMG_TRAVEL * y);
        goal.textX = -(TEXT_TRAVEL * x);
        goal.textY = -(TEXT_TRAVEL * y);
      };

      // Exponential smoothing toward the goal. The artwork carries more travel
      // than the copy, so the two chase the same cursor at visibly different
      // rates — which is what stops it reading as one flat slide.
      let frame = 0;
      const tick = () => {
        state.imgX += (goal.imgX - state.imgX) * PARALLAX_LERP;
        state.imgY += (goal.imgY - state.imgY) * PARALLAX_LERP;
        state.textX += (goal.textX - state.textX) * PARALLAX_LERP;
        state.textY += (goal.textY - state.textY) * PARALLAX_LERP;

        gsap.set(artTarget, { x: state.imgX, y: state.imgY });
        gsap.set(textTarget, { x: state.textX, y: state.textY });

        frame = requestAnimationFrame(tick);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      frame = requestAnimationFrame(tick);

      return () => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(frame);
        // Reset, or a remount inherits a mid-parallax offset.
        gsap.set([artTarget, textTarget], { x: 0, y: 0 });
      };
    },
    [],
  );

  // Two columns of plates, each repeated so the pinned bed never runs out of
  // content while it sharpens.
  /*
    Both columns are a straight repetition of the same four plates.

    That repetition is load-bearing, not filler: the CSS loop translates by one
    period, so element N and element N+period must be identical or the seam
    jumps every cycle. An earlier version offset the second column with a
    reversed set, which reads fine for one still frame and then hitches on the
    wrap. The two columns stay visually distinct because they drift at 10s and
    18s, not because their contents differ.
  */
  const columnA = [...projects, ...projects].map((p) => p.image);
  const columnB = [...projects, ...projects].map((p) => p.image);

  return (
    <section ref={section} id="hero" aria-label="Introduction" className="relative h-[300vh] w-full">
      {/* ---- stage (scales to 0.5) ---------------------------------------- */}
      <div
        ref={stage}
        className="hero-container sticky top-0 z-2 flex h-[100svh] w-full items-center justify-between overflow-hidden px-[4vw] max-[1025px]:items-start max-[1025px]:px-[5vw] max-[1025px]:pt-[30vw]"
        style={{
          backgroundColor: "var(--grad-8)",
          backgroundImage: [
            "radial-gradient(65% 55% at 92% 6%, var(--grad-1) 0%, transparent 65%)",
            "radial-gradient(60% 55% at 4% 82%, var(--grad-2) 0%, transparent 65%)",
            "radial-gradient(75% 80% at 48% 42%, var(--grad-3) 0%, transparent 70%)",
            "linear-gradient(180deg, var(--grad-4) 0%, var(--grad-5) 28%, var(--grad-3) 46%, var(--grad-6) 68%, var(--grad-7) 88%, var(--grad-8) 100%)",
          ].join(","),
        }}
      >
        <div
          ref={textWrap}
          className="flex h-fit w-full justify-between max-[1025px]:flex-col max-[1025px]:gap-8"
        >
          {/* w-[45%] at 7.5vw is the pairing that produces the stepped left
              edge. Neither value is decorative — changing either re-flows the
              break and the shape goes with it. */}
          <h1 className="w-[45%] [font-size:var(--type-hero)] leading-[1.1] text-[var(--fg)] max-[1025px]:w-[62%] max-md:w-full">
            <SplitReveal
              text={site.heroHeadline}
              type="lines"
              trigger="immediate"
              delay={1}
              stagger={0.015}
              from={115}
              className="block"
            />
          </h1>

          {/* Reversed on narrow screens so "Creative / Web Designer" lands under
              the headline rather than above it, and the block stays right-aligned
              on desktop where it sits against the gutter. */}
          <div className="flex w-[10%] flex-col justify-between py-[2vw] text-end [font-size:var(--type-meta)] leading-[1.15] text-[var(--fg)] max-[1025px]:w-[40%] max-[1025px]:flex-col-reverse max-[1025px]:gap-5 max-[1025px]:text-start max-[1025px]:[font-size:clamp(1.25rem,3.5vw,3rem)] max-md:gap-[7vw] max-md:py-0 max-md:[font-size:clamp(1.25rem,4.5vw,3rem)]">
            {site.heroMeta.map((group) => (
              <div key={group.lines.join(" ")}>
                {group.lines.map((line) => (
                  <SplitReveal
                    key={line}
                    text={line}
                    as="p"
                    type="lines"
                    trigger="immediate"
                    delay={1.5}
                    stagger={0.08}
                    className="block"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ---- artwork -------------------------------------------------- */}
        {/* Anchored at bottom -64% in a square 180% box: slightly taller than
            the viewport, so only the figure's upper half reads across the
            headline. Sizing by height instead makes the 1142×1378 plate swallow
            the whole hero.

            No z-index. The plate is the last child of the stage, so it lands in
            the positioned-descendants layer and paints OVER the headline — which
            is the reference's composition, the figure in front of the type. An
            earlier -z-10 here looked tidier in isolation but inverted the whole
            image: the type ended up reading as a caption on a photograph
            instead of the type being the subject with the figure crossing it.

            The inner div is the parallax target and must not carry the mask:
            moving the masked element re-seams the sweep mid-reveal. */}
        <div
          ref={art}
          aria-hidden="true"
          className="hero-mask-reveal pointer-events-none absolute bottom-[-64%] left-1/2 size-[180%] -translate-x-[49.5%] max-[1025px]:h-auto max-[1025px]:w-full max-[1025px]:-translate-x-[40%] max-md:bottom-[-30%] max-md:w-[160%] max-md:-translate-x-[40%]"
        >
          <div ref={artInner} className="h-full w-full">
            <Image
              src="/hero/hero-main.webp"
              alt=""
              width={1142}
              height={1378}
              priority
              fetchPriority="high"
              draggable={false}
              className="pointer-events-none h-full w-full select-none object-contain"
            />
          </div>
        </div>
      </div>

      {/* ---- marquee bed (behind the stage) ------------------------------ */}
      {/* No `overflow-hidden` on this wrapper: it would become a scroll container
          and the sticky child would resolve against its overflow instead of the
          viewport. Clipping lives on the sticky element itself, below.

          `pointer-events-none` because this box covers the viewport for the whole
          300vh. It is decoration; there is no reason for it to be a hit target,
          and leaving it interactive only risks it swallowing clicks meant for
          whatever sits beneath it. */}
      <div
        ref={marquee}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full bg-[var(--paper-deep)]"
      >
        <div className="sticky top-0 flex h-[100svh] w-full gap-[2.5vw] overflow-hidden px-[4vw] max-[1025px]:px-[5vw]">
          {/* Each column holds the plates twice and is driven by an infinite CSS
              loop (see globals.css) — 10s and 18s. GSAP deliberately does not
              touch these; a JS tween here would fight the compositor animation
              and cost a main-thread write per frame for no visual gain. */}
          <div className="marquee-1 flex h-fit w-1/2 flex-col gap-[2.5vw]">
            {columnA.map((src, i) => (
              <div key={i} className="relative h-[27vw] w-full overflow-hidden max-[1025px]:h-[45vw] max-md:h-[55vw]">
                {/* Eager on the first pair: these are what the LCP measures, and
                    a deferred decode here shows as a visible pop. */}
                <Image src={src} alt="" fill sizes="50vw" loading={i < 2 ? "eager" : "lazy"} className="object-cover" />
              </div>
            ))}
          </div>
          <div className="marquee-2 flex h-fit w-1/2 flex-col gap-[2.5vw]">
            {columnB.map((src, i) => (
              <div key={i} className="relative h-[27vw] w-full overflow-hidden max-[1025px]:h-[45vw] max-md:h-[55vw]">
                <Image src={src} alt="" fill sizes="50vw" loading={i < 2 ? "eager" : "lazy"} className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}