"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap, Flip } from "@/components/gsap/gsap-config";
import { buildCopyReveals } from "@/components/gsap/copy-reveal";
import { testimonials, testimonialsHeading } from "@/lib/data";

/**
 * TESTIMONIALS — rebuilt 1:1 from the reference's module (2m2cyqvl-o39e.js).
 *
 * Structure: heading wrap at 65% riding the Copy reveal (chars, stagger
 * .015), the 30vw card (white/5, white/10 hairline), the avatar ring
 * overlapping the card's top edge (-top-2vw), and prev/next arrows at
 * mt-3vw. Card, ring and arrows all rise out of the shared `.testimonial-fade`
 * state (y 40 → 0, duration .8, stagger .12, power2.out, once at "top 70%").
 *
 * Behaviours copied from the reference:
 * - The active avatar is 1.6×, lifted to z-10, and the ring RE-ORDERS around
 *   it (flex order −2..2 computed from the circular distance to the active
 *   index). The reference animates the re-order with framer-motion's
 *   `layout`; the FLIP mechanism here is the same math (0.6s, its
 *   cubic-bezier(.22,1,.36,1) ≈ power3.out).
 * - The card body swaps with a 0.25s exit → 0.25s rise-in (the reference's
 *   AnimatePresence mode:"wait"), keyed on the name. Horizontal swipes past
 *   100px drive prev/next, like the reference's drag:"x".
 * - aria-current marks the active avatar; the name is a polite live region so
 *   the swap is announced (an a11y add-on the reference lacks — no visual
 *   impact).
 */

/** Spring-like ease the reference hands to framer for the ring: [.22,1,.36,1]. */
const RING_EASE = "power3.out";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  /** Read once at first client render. Never used in JSX, so this stays
   * hydration-safe; only selection callbacks and effects consult it. */
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  /** Flip state captured before the index commit; replayed on commit. */
  const flipState = useRef<Flip.FlipState | null>(null);
  const indexRef = useRef(0);

  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced: rm }) => {
      const cleanup = [buildCopyReveals(scope, rm)];

      const fades = Array.from(scope.querySelectorAll<HTMLElement>(".testimonial-fade"));
      if (rm) {
        gsap.set(fades, { opacity: 1, y: 0 });
        return () => cleanup.forEach((fn) => fn());
      }

      // Reference: y40 → 0, duration .8, stagger .12, once at "top 70%".
      gsap.fromTo(
        fades,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: scope, start: "top 70%", once: true },
        },
      );

      return () => cleanup.forEach((fn) => fn());
    },
    [],
  );

  /** Circular order offset the reference uses: active = 0, neighbours −2..2. */
  const orderOf = (i: number) => {
    const n = testimonials.length;
    let h = (i - index + n) % n;
    if (h > Math.floor(n / 2)) h -= n;
    return h;
  };

  const select = useCallback(
    (next: number) => {
      const target = ((next % testimonials.length) + testimonials.length) % testimonials.length;
      if (target === indexRef.current) return;
      const body = bodyRef.current;

      const commit = () => {
        // Capture before React commits the new order, replay after paint.
        if (!reduced && ringRef.current) {
          flipState.current = Flip.getState(ringRef.current.querySelectorAll("button"));
        }
        setIndex(target);
      };

      if (!body || reduced) {
        commit();
        return;
      }
      // mode:"wait": exit first (drops opacity, stays in place), then the new
      // body rises in from y20 — both 0.25s like the reference.
      gsap.killTweensOf(body);
      gsap.to(body, { opacity: 0, y: 0, duration: 0.25, ease: "power1.out", overwrite: true, onComplete: commit });
    },
    [reduced],
  );

  // After each commit: replay the ring FLIP + rise the swapped body in.
  useLayoutEffect(() => {
    if (flipState.current) {
      Flip.from(flipState.current, { duration: 0.6, ease: RING_EASE, absolute: true, scale: true });
      flipState.current = null;
    }
    if (bodyRef.current && !reduced) {
      gsap.fromTo(
        bodyRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out", overwrite: true },
      );
    }
  }, [index, reduced]);

  /** The reference's drag:"x"": ±100px horizontal flick switches. */
  const pointerStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const dx = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 100) select(dx < 0 ? index + 1 : index - 1);
  };

  const t = testimonials[index];

  return (
    <section ref={root} id="testimonials" className="w-screen bg-[#070707] py-[7vw] px-[4vw] max-[1025px]:px-[5vw] max-[1025px]:py-[12vw]">
      <div className="w-full flex flex-col gap-[6vw] max-[1025px]:gap-[12vw]">
        <div className="w-[65%] mx-auto max-[1025px]:w-full">
          <div data-copy-wrapper="true" data-copy="chars" className="opacity-0">
            <h2
              className="text-center text-[5.2vw] max-[1025px]:text-[7vw] max-md:text-[9vw]"
              /* Unlayered heading identity loses to these inline values. */
              style={{ lineHeight: 1.2, letterSpacing: "normal", fontWeight: 400 }}
            >
              {testimonialsHeading}
            </h2>
          </div>
        </div>

        <div className="relative max-md:mt-10">
          {/* ---- card ------------------------------------------------ */}
          <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            className="testimonial-fade opacity-0 relative w-3/5 mx-auto rounded-[2vw] border border-white/10 bg-white/5 overflow-hidden h-[30vw] max-[1025px]:w-full max-[1025px]:rounded-[5vw] max-[1025px]:h-[52vw] max-md:h-[95vw] touch-pan-y"
          >
            <div
              ref={bodyRef}
              key={t.name}
              className="pt-[8vw] pb-[4vw] px-[6vw] w-full h-full flex flex-col items-center justify-center gap-[2.5vw] text-center max-[1025px]:pt-[14vw] max-[1025px]:px-[8vw] max-[1025px]:gap-[4vw] max-md:pt-[22vw] max-md:px-[7vw] max-md:pb-[8vw] max-md:gap-[6vw]"
            >
              <div className="flex flex-col gap-[0.4vw] max-md:gap-2">
                <p aria-live="polite" className="text-[2.6vw] text-[#ff6b00] max-[1025px]:text-[4vw] max-md:text-[6vw]">
                  {t.name}
                </p>
                <p className="text-[1.145vw] text-white max-[1025px]:text-[2.2vw] max-md:text-[3.6vw]">{t.role}</p>
              </div>
              <p className="text-[1.145vw] leading-[1.6] text-white/70 w-[82%] max-[1025px]:text-[2.2vw] max-[1025px]:w-full max-md:text-[3.6vw]">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>
          </div>

          {/* ---- avatar ring ----------------------------------------- */}
          {/* Overlaps the card's top edge; order/z lift the active one and
              Flip animates the re-order. */}
          <div
            ref={ringRef}
            className="testimonial-fade opacity-0 flex w-full justify-center items-center absolute -top-[2vw] left-1/2 -translate-x-1/2 max-md:-top-[6vw]"
          >
            {testimonials.map((item, i) => {
              const h = orderOf(i);
              const active = h === 0;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`Show testimonial from ${item.name}`}
                  aria-current={active ? "true" : undefined}
                  style={{
                    order: h,
                    zIndex: active ? 10 : testimonials.length - Math.abs(h),
                    // The reference's 1.6× on the active avatar; Flip's
                    // scale:true interpolates the delta with the re-order.
                    transform: `scale(${active ? 1.6 : 1})`,
                  }}
                  className={`w-[5vw] h-[5vw] rounded-full overflow-hidden [clip-path:circle(50%)] cursor-pointer max-[1025px]:w-[9vw] max-[1025px]:h-[9vw] max-md:w-[12vw] max-md:h-[12vw] ${
                    active
                      ? "bg-linear-to-r from-[#F16B0D] to-[#E61416] p-[0.3vw] mx-[2vw] max-md:mx-[4vw]"
                      : `opacity-60 hover:opacity-100 ${h < 0 ? "-mr-[1vw]" : "-ml-[1vw]"}`
                  }`}
                >
                  <Image
                    src={item.avatar}
                    alt={item.name}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover object-top rounded-full"
                  />
                </button>
              );
            })}
          </div>

          {/* ---- prev / next ----------------------------------------- */}
          <div ref={prevRef} className="testimonial-fade opacity-0 flex justify-center gap-3 mt-[3vw] max-md:mt-[8vw]">
            <button
              type="button"
              onClick={() => select(index - 1)}
              aria-label="Previous testimonial"
              className="size-12 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer relative group overflow-hidden max-md:size-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="relative z-2">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-[#F16B0D] to-[#E61416] group-hover:scale-100 scale-0 ease-in-out origin-center rounded-full duration-300" />
            </button>
            <button
              type="button"
              onClick={() => select(index + 1)}
              aria-label="Next testimonial"
              className="size-12 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer relative group overflow-hidden max-md:size-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="relative z-2">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-[#F16B0D] to-[#E61416] group-hover:scale-100 scale-0 ease-in-out origin-center rounded-full duration-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
