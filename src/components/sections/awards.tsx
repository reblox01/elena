"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef } from "react";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap, SplitText } from "@/components/gsap/gsap-config";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { pluck } from "@/lib/string-pluck";
import { awards, projects } from "@/lib/data";

/**
 * The reference's divider is a physical string, and the interaction is not a
 * hover-pluck:
 *
 *   - `mousemove` accumulates `movementY / 2` into an amplitude and redraws —
 *     the string bends under the pointer and follows the drag while you are on
 *     it (unclamped, as in the reference);
 *   - release happens on `mouseleave`: the accumulated bend snaps back with a
 *     damped sine decay (amplitude ×0.95 per frame, phase +0.5) until flat.
 *
 * Geometry is pixel-based, not a stretched viewBox: the reference draws
 * `M 0 50 Q w/2 50±bow w 50` with `w` read from `offsetWidth` and redrawn on
 * resize, on an SVG whose attribute height is a plain 100px. That 100px panel
 * hangs absolutely over the 1px layout row (top −50px), centred on the row
 * boundary — the bow gets room to grow without spending a pixel of page
 * height, which is exactly where this section's height budget differs from a
 * plain-hairline variant.
 *
 * Sound: while the pointer is on a string a keep-alive frame resets the release
 * phase to its peak; on release the accumulated bow is handed to `pluck()` (the
 * reference's Karplus-Strong voice, see @/lib/string-pluck) and the damped
 * decay animates it flat. `sound={false}` silences a string; the reference
 * defaults it on. Reduced motion drops the interactive layer entirely — no
 * listeners, no sound, a static line — matching the reference's
 * `reduced ? undefined : handler` guards.
 */
function StringLine({ reduced, sound = true }: { reduced: boolean; sound?: boolean }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const amp = useRef(0);
  const phase = useRef(Math.PI / 2);
  // One rAF id carries both the hover keep-alive chain and the release decay —
  // entering a string cancels whatever the other state left pending, exactly as
  // the reference's single `o.current` slot does.
  const frame = useRef<number | null>(null);

  const draw = useCallback((bow: number) => {
    const w = wrapRef.current?.offsetWidth;
    if (w == null) return;
    pathRef.current?.setAttribute("d", `M 0 50 Q ${0.5 * w} ${50 + bow} ${w} 50`);
  }, []);

  // Initial paint + resize. The rule wrapper starts at scale-x-0 (invisible),
  // so there is no flash between SSR and this first draw.
  useEffect(() => {
    draw(0);
    const onResize = () => draw(amp.current);
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame.current != null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [draw, reduced]);

  const drawAmp = () => {
    const w = wrapRef.current?.offsetWidth;
    if (w != null) pathRef.current?.setAttribute("d", `M 0 50 Q ${0.5 * w} ${50 + amp.current} ${w} 50`);
  };

  // Hover keep-alive: while the pointer is on the string, every frame cancels
  // the pending release rAF and re-arms the sine at its peak, so a release
  // always starts from the maximum bow.
  const keepAlive = () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    phase.current = Math.PI / 2;
    frame.current = requestAnimationFrame(keepAlive);
  };

  const release = () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (sound) pluck(amp.current);
    // Freeze the dragged shape for one frame, then let the damped sine run.
    drawAmp();
    const settle = () => {
      draw(amp.current * Math.sin(phase.current));
      amp.current *= 0.95;
      phase.current += 0.5;
      if (Math.abs(amp.current) > 0.1) {
        frame.current = requestAnimationFrame(settle);
      } else {
        phase.current = Math.PI / 2;
        amp.current = 0;
        draw(0);
        frame.current = null;
      }
    };
    settle();
  };

  return (
    <span ref={wrapRef} className="relative block h-px w-full">
      {reduced ? null : (
        // Interaction layer above the drawing, same 100px box: `movementY`
        // accumulates on a target covering the whole bow area, not the hairline.
        <span
          ref={boxRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-[-50px] block h-[100px] cursor-grab active:cursor-grabbing"
          onMouseEnter={keepAlive}
          onMouseMove={(e) => {
            amp.current += e.movementY / 2;
            drawAmp();
          }}
          onMouseLeave={release}
        />
      )}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[-50px] h-[100px] w-full">
        <path ref={pathRef} d="M 0 50" strokeWidth={2} fill="none" stroke="rgba(255, 255, 255, 0.4)" />
      </svg>
    </span>
  );
}

/**
 * AWARDS — mirrored from the reference module, structure and behaviour:
 *
 * - 4 rows + 4 drag-strings: 3 between rows plus a trailing one; every rule is
 *   a 1px `scale-x-0` layout line that draws open on its own scroll trigger.
 * - Copy treatment per the reference's Copy component: the h2 splits into
 *   CHARACTERS (stagger 0.015, the cascade), each row's h3/p into LINES
 *   (stagger 0.1), all SplitText masks, `duration .5 / power3.out`, from
 *   yPercent 100, triggered at `top 85%`. Splitting waits for the block's own
 *   font (300 ms cap) so line breaks aren't measured with fallback metrics.
 *   Under reduced motion the reference skips SplitText entirely and just fades
 *   the wrapper in with a small rise — mirrored here.
 * - The plate is pinned to the right edge (`absolute right-[10%]`): its X never
 *   moves. A window-level hit-test picks the row under the pointer and a
 *   back.out(1.6) tween aligns the plate's centre to that row's centre; the
 *   hovered image is punched in with a zIndex bump + scale 0→1.05 rather than
 *   an opacity crossfade, so each new image arrives "in front".
 */
export function Awards() {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const plateRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced: rm, desktop }) => {
      const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];
      const host = plateRef.current;
      const card = cardRef.current;
      const imgs = imgRefs.current.filter(Boolean) as HTMLDivElement[];
      const list = listRef.current;
      const cleanups: Array<() => void> = [];

      // ---- rules: each draws open on its own trigger ----------------------
      const rules = Array.from(scope.querySelectorAll<HTMLElement>("[data-rule]"));
      if (rm) {
        gsap.set(rules, { scaleX: 1 });
      } else {
        for (const r of rules) {
          gsap.to(r, {
            scaleX: 1,
            duration: 0.8,
            ease: "power2.inOut",
            scrollTrigger: { trigger: r, start: "top 85%", toggleActions: "play none none none" },
          });
        }
      }

      // ---- copy reveals (SplitText per the reference's Copy component) ----
      const copyWrappers = Array.from(scope.querySelectorAll<HTMLElement>("[data-copy-wrapper]"));
      const splits: SplitText[] = [];
      let fontTimer: number | undefined;

      if (copyWrappers.length) {
        if (rm) {
          // Reference Copy's reduced path: no splitting at all — fade the whole
          // wrapper in with a small rise, triggered like everything else.
          for (const wrap of copyWrappers) {
            gsap.set(wrap, { opacity: 0, y: 24 });
            gsap.to(wrap, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
            });
          }
        } else {
          const build = () => {
            for (const wrap of copyWrappers) {
              const child = wrap.firstElementChild as HTMLElement | null;
              if (!child) continue;
              const chars = wrap.dataset.copy === "chars";
              const st = chars
                ? SplitText.create(child, {
                    type: "lines,chars",
                    mask: "chars",
                    charsClass: "char++",
                    reduceWhiteSpace: false,
                  })
                : SplitText.create(child, { type: "lines", mask: "lines", reduceWhiteSpace: false });
              splits.push(st);

              if (chars) {
                // The per-char masks clip the glyphs' side bearings; the padding
                // trick reinstates them without pushing the layout.
                st.masks?.forEach((m) => {
                  const el = m as HTMLElement;
                  el.style.paddingInline = "0.04em";
                  el.style.marginInline = "-0.04em";
                  el.style.boxSizing = "content-box";
                });
              }

              gsap.set(wrap, { opacity: 1 });
              gsap.fromTo(
                chars ? (st.chars ?? []) : (st.lines ?? []),
                { yPercent: 100, xPercent: 0, rotate: 0, opacity: 1 },
                {
                  yPercent: 0,
                  xPercent: 0,
                  rotate: 0,
                  opacity: 1,
                  duration: 0.5,
                  stagger: chars ? 0.015 : 0.1,
                  ease: "power3.out",
                  scrollTrigger: { trigger: wrap, start: "top 85%" },
                },
              );
            }
          };

          // Split after the font settles — 300 ms cap, matching the reference.
          let ran = false;
          const go = () => {
            if (ran) return;
            ran = true;
            window.clearTimeout(fontTimer);
            build();
          };
          fontTimer = window.setTimeout(go, 300);
          void document.fonts?.ready.then(go, go);
          cleanups.push(() => {
            ran = true;
            window.clearTimeout(fontTimer);
            splits.forEach((s) => s.revert());
          });
        }
      }

      // ---- preview plate ---------------------------------------------------
      if (desktop && rows.length === awards.length && host && card && imgs.length === awards.length && list) {
        gsap.set(card, { y: 0 });
        gsap.set(imgs, { opacity: 1 });
        imgs.forEach((img, i) => gsap.set(img, { zIndex: i + 1 }));
        gsap.set(imgs[0], { scale: 1.05 });
        imgs.slice(1).forEach((img) => gsap.set(img, { scale: 0 }));

        let z = imgs.length;
        let activeIndex = -1;
        let shown = false;
        let last: { x: number; y: number } | null = null;

        const show = () => {
          if (shown) return;
          shown = true;
          gsap.to(host, { opacity: 1, duration: rm ? 0 : 0.4, ease: "power2.out" });
        };

        const hide = () => {
          if (!shown) return;
          shown = false;
          activeIndex = -1;
          gsap.to(host, { opacity: 0, duration: rm ? 0 : 0.4, ease: "power2.out" });
        };

        const showIndex = (t: number) => {
          const row = rows[t];
          if (row) {
            // Align the plate's centre to the hovered row's centre. The plate's
            // UNTRANSFORMED centre is its rect minus whatever y it currently
            // carries — recomputed every call so consecutive hovers compound
            // correctly instead of drifting.
            const cardY = gsap.getProperty(card, "y") as number;
            const cr = card.getBoundingClientRect();
            const cardStaticCenterY = cr.top + cr.height / 2 - cardY;
            const rr = row.getBoundingClientRect();
            const targetY = rr.top + rr.height / 2 - cardStaticCenterY;
            if (rm) gsap.set(card, { y: targetY });
            else gsap.to(card, { y: targetY, duration: 0.65, ease: "back.out(1.6)" });
          }
          const img = imgs[t];
          if (img) {
            z += 1;
            gsap.set(img, { zIndex: z });
            gsap.killTweensOf(img);
            if (rm) gsap.set(img, { scale: 1.05 });
            else {
              gsap.set(img, { scale: 0 });
              gsap.to(img, { scale: 1.05, duration: 0.45, ease: "power2.out" });
            }
          }
          activeIndex = t;
        };

        const hit = (x: number, y: number): number | null => {
          for (let i = 0; i < rows.length; i += 1) {
            const r = rows[i]?.getBoundingClientRect();
            if (r && y >= r.top && y < r.bottom && x >= r.left && x < r.right) return i;
          }
          return null;
        };

        // Visibility is a pure function of the pointer's relation to the list:
        // on a row or inside the list bounds → visible; off the list → hidden.
        // This reproduces the reference's list enter/leave contract without
        // needing synthetic mouseenter (which the DOM does not compute).
        const insideList = (e: MouseEvent) => {
          const r = list.getBoundingClientRect();
          return e.clientY >= r.top && e.clientY <= r.bottom;
        };

        const onMove = (e: MouseEvent) => {
          last = { x: e.clientX, y: e.clientY };
          const i = hit(e.clientX, e.clientY);
          if (i !== null) {
            show();
            if (i !== activeIndex) showIndex(i);
          } else if (insideList(e)) {
            show(); // entering between rows: plate shows, unaligned
          } else {
            hide();
          }
        };

        // The reference re-runs its hit-test on scroll with the last pointer
        // position; it never hides the plate from scroll alone.
        const onScroll = () => {
          if (!last) return;
          const i = hit(last.x, last.y);
          if (i !== null && i !== activeIndex) showIndex(i);
        };

        // Real-cursor fidelity: the actual mouseleave hides even if no move
        // event ever fires outside the list (parked cursor + wheel scroll).
        const onListLeave = () => hide();

        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        list.addEventListener("mouseleave", onListLeave, { passive: true });

        cleanups.push(() => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("scroll", onScroll);
          list.removeEventListener("mouseleave", onListLeave);
          gsap.killTweensOf([card, host, ...imgs]);
        });
      }

      if (cleanups.length === 0) return undefined;
      return () => cleanups.forEach((fn) => fn());
    },
    [reduced],
  );

  return (
    <section ref={root} id="awards" className="relative w-screen bg-[#070707] py-[7vw] text-white">
      <div className="flex w-screen items-center gap-[4vw] px-[4vw] max-[1025px]:px-[5vw]">
        <div className="w-full">
          <div data-copy="chars" data-copy-wrapper className="opacity-0">
            {/* Inline, not utilities: this project's globals are unlayered, and
                unlayered declarations outrank everything in @layer utilities —
                the global display-type identity (1.02 / -0.035em / 500) would
                otherwise beat leading-[1.2] at any specificity. The reference's
                computed copy here is lh 1.2, ls normal, fw 400. */}
            <h2
              className="mb-[4vw] text-[5.5vw] leading-[1.2] max-[1025px]:text-[7vw] max-md:text-[9vw]"
              style={{ lineHeight: 1.2, letterSpacing: "normal", fontWeight: 400 }}
            >
              Awards and Industry
              <br />
              Recognition
            </h2>
          </div>

          <div ref={listRef} data-list className="w-full">
            {awards.map((a, i) => (
              <Fragment key={a.title}>
                {i > 0 && (
                  <div data-rule className="relative h-px w-full origin-left scale-x-0">
                    <StringLine reduced={reduced} />
                  </div>
                )}
                <div
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  data-award-row
                  className="awards-container relative py-8"
                >
                  <div data-copy="lines" data-copy-wrapper className="opacity-0">
                    <h3
                      className="font-normal text-[1.8vw] max-[1025px]:text-[3.4vw] max-md:text-[5.5vw]"
                      style={{ lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400 }}
                    >
                      {a.title}
                    </h3>
                  </div>
                  <div data-copy="lines" data-copy-wrapper className="opacity-0">
                    <p
                      className="mt-3 text-[1.25vw] tracking-wide text-white/30 max-[1025px]:text-[2.2vw] max-md:text-[3.6vw]"
                      style={{ lineHeight: 1.5 }}
                    >
                      {a.meta}
                    </p>
                  </div>
                </div>
              </Fragment>
            ))}
            <div data-rule className="relative h-px w-full origin-left scale-x-0">
              <StringLine reduced={reduced} />
            </div>
          </div>
        </div>

        {/* ---- preview plate (desktop only) -------------------------------- */}
        <div
          ref={plateRef}
          aria-hidden="true"
          className="image-container pointer-events-none absolute right-[10%] flex w-[40vw] justify-center opacity-0 max-[1025px]:hidden"
        >
          <div
            ref={cardRef}
            className="relative h-[22vw] w-[40vw] overflow-hidden rounded-lg bg-[#070707] shadow-2xl will-change-transform"
          >
            {awards.map((a, i) => (
              <div
                key={a.title}
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                className="absolute inset-0"
              >
                <Image
                  src={projects[i % projects.length].image}
                  alt="awards-image"
                  fill
                  sizes="40vw"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
