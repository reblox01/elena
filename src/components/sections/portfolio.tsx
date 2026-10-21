"use client";

import Image from "next/image";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { projects, workHeading } from "@/lib/data";

/** Plate count - 1: one scrub segment per transition, not per project. */
const SEGMENTS = projects.length - 1;

/**
 * PORTFOLIO — 360vh, sticky stage, scrubbed + snapped.
 *
 * Two orange layers, and the gap between them is the whole entrance:
 *
 *   1. CLIP LAYER (z-2) — a 50vh gradient slab behind the stage, clipped to an
 *      ellipse. It RISES (yPercent -70) while its ellipse SHRINKS 150% → 60%,
 *      both scrubbed from when the section's top hits the viewport bottom to
 *      30%. The stage meanwhile slides up through it, so the slab reads as a
 *      disc opening behind the stage rather than a wipe.
 *   2. STAGE (z-3) — the sticky viewport: heading, timeline, image stack.
 *
 * Image stack behaviour, which is not the obvious one:
 *
 * The outgoing plate is NOT removed. It gets `filter: brightness(0.3)` and
 * stays exactly where it is; the incoming plate rises from yPercent 100 over
 * the top of it. So at any point two plates are on screen and the older one is
 * a dark ghost of the project you just passed. Crossfading to opacity 0 or
 * sliding the old one away would leave a single hard-edged image and lose the
 * sense of a stack you are moving through.
 *
 * The timeline SNAPS to 1/SEGMENTS. Without it, a fast flick skips projects and
 * the whole thing reads as a slideshow nobody can steer; with it, scroll
 * settles on a project and the dots and bar agree about which one.
 */
export function Portfolio() {
  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced }) => {
      const plates = Array.from(scope.querySelectorAll<HTMLElement>("[data-plate]"));
      const dots = Array.from(scope.querySelectorAll<HTMLElement>("[data-dot]"));
      const bar = scope.querySelector<HTMLElement>("[data-bar-fill]");
      const clip = scope.querySelector<HTMLElement>("[data-clip]");
      const rows = Array.from(scope.querySelectorAll<HTMLElement>("[data-row]"));
      if (!bar || !clip || !plates.length) return;

      // ---- clip-layer entrance ------------------------------------------
      gsap.set(clip, { clipPath: "ellipse(150% 100% at 50% 100%)" });

      const clipWindow = { start: "top bottom", end: "30% bottom" };

      gsap.to(clip, {
        clipPath: "ellipse(60% 100% at 50% 100%)",
        ease: "power2.out",
        scrollTrigger: { trigger: scope, ...clipWindow, scrub: true },
      });

      if (!reduced) {
        // Tall rise on desktop, shorter on narrow screens — a 70% travel on a
        // short viewport pulls the slab off the top before the ellipse has
        // finished opening.
        gsap.to(clip, {
          yPercent: window.innerWidth > 1024 ? -70 : -50,
          ease: "none",
          scrollTrigger: { trigger: scope, ...clipWindow, scrub: true },
        });
      }

      // ---- scrubbed timeline --------------------------------------------
      gsap.set(bar, { scaleY: 0 });

      // First dot starts active; the rest sit at the inactive orange until the
      // timeline promotes them.
      gsap.set(dots[0], { backgroundColor: "#ffffff", borderColor: "#ffffff" });
      for (const dot of dots.slice(1)) {
        gsap.set(dot, { backgroundColor: "#F06A0E", borderColor: "rgba(255,255,255,0.5)" });
      }

      // The reference sets brightness on every plate (not just the first), so
      // mid-transition computed styles agree plate-for-plate with it.
      gsap.set(plates, { filter: "brightness(1)" });

      if (reduced) {
        // No sliding and no dimming — just hand the stack an opacity crossfade.
        for (const plate of plates.slice(1)) gsap.set(plate, { opacity: 0 });
      } else {
        // y: 0 is load-bearing. The pre-animation park in globals.css leaves
        // plates 2..n with a resolved PIXEL translate (~one plate height), and
        // getComputedStyle flattens percentage transforms to pixels before GSAP
        // ever sees them. A plain `yPercent: 100` would therefore park each
        // plate at 200% (percent on top of the parsed pixel residue), and the
        // tween — which only drives the percent channel — would end with every
        // plate still sitting one full height below the frame. Zeroing `y`
        // swallows the residue so the park is exactly 100%.
        gsap.set(plates.slice(1), { yPercent: 100, y: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scope,
          start: "10% top",
          end: "bottom bottom",
          scrub: true,
          ...(reduced
            ? {}
            : {
                snap: {
                  snapTo: 1 / SEGMENTS,
                  duration: { min: 0.2, max: 0.6 },
                  ease: "power1.inOut",
                },
              }),
        },
      });

      tl.to(bar, { scaleY: 1, ease: "none", duration: SEGMENTS }, 0);

      for (let i = 0; i < SEGMENTS; i++) {
        if (reduced) {
          tl.to(plates[i + 1], { opacity: 1, ease: "none", duration: 1 }, i);
        } else {
          // Both channels, for the same reason as the `y: 0` above: the pixel
          // residue from the CSS park must not survive the rise.
          tl.to(plates[i + 1], { yPercent: 0, y: 0, ease: "power2.inOut", duration: 1 }, i);
          tl.to(plates[i], { filter: "brightness(0.3)", ease: "power2.inOut", duration: 1 }, i);
        }
        tl.set(dots[i + 1], { backgroundColor: "#ffffff", borderColor: "#ffffff" }, i + 1);
      }

      // Rows reveal identically either way — this is entrance, not the scrub.
      gsap.from(rows, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: scope, start: "top 70%", once: true },
      });
    },
    [],
  );

  return (
    <section
      id="portfolio"
      ref={root}
      aria-labelledby="portfolio-heading"
      /* White on the orange gradient, as the reference. Strictly this is a
         ~3:1 pairing — below AA for this size range — but it is the template's
         own palette choice and the user has asked for a 1:1 match over the
         contrast-safe substitution. */
      className="relative w-full pt-[8vw] max-[1025px]:pt-[30vw] text-white"
    >
      {/* ---- clip layer (z-2): rises + narrows, revealed by clip-path ---- */}
      <div
        data-clip
        aria-hidden="true"
        className="absolute left-0 top-0 z-2 h-[50vh] w-full bg-[linear-gradient(90deg,var(--grad-hot)_0%,var(--accent-red)_100%)] will-change-[clip-path]"
      />

      {/* ---- sticky stage (z-3) ---------------------------------------- */}
      <div className="sticky top-0 z-3 flex h-[100svh] w-full flex-col items-center justify-center gap-[5vw] overflow-hidden bg-[linear-gradient(90deg,var(--grad-hot)_0%,var(--accent-red)_100%)] px-[4vw] max-[1025px]:gap-12 max-[1025px]:px-[5vw] max-md:gap-[15vw]">
        <h2
          id="portfolio-heading"
          data-heading
          className="text-center [font-size:var(--text-section)] max-[1025px]:[font-size:clamp(2.25rem,6.5vw,6.5rem)] max-md:[font-size:clamp(1.75rem,9vw,6.5rem)]"
        >
          {workHeading}
        </h2>

        <div className="flex w-full items-center gap-[4vw] max-[1025px]:flex-col max-[1025px]:items-start max-[1025px]:gap-16 max-md:gap-[15vw]">
          {/* ---- timeline ------------------------------------------- */}
          <div className="relative w-[32%] max-[1025px]:w-[50%] max-md:w-full">
            {/* Track, then the fill that scrubs over it. Both are absolutely
                positioned 1px rules rather than a border, so the fill can grow
                from the top without moving the layout. */}
            <div
              aria-hidden="true"
              className="absolute left-1 top-[2.5vw] h-[21vw] w-px bg-white/20 max-[1025px]:top-[1vw] max-[1025px]:h-[33vw] max-md:h-[62vw]"
            />
            <div
              data-bar-fill
              aria-hidden="true"
              className="absolute left-1 top-[2.5vw] h-[21vw] w-px origin-top bg-white max-[1025px]:top-[1vw] max-[1025px]:h-[33vw] max-md:h-[62vw]"
            />

            <div className="flex flex-col max-[1025px]:gap-[4vw] max-md:gap-[14vw]">
              {projects.map((p) => (
                <div
                  key={p.id}
                  data-row
                  /* Fixed row height so the dots and the 21vw rule line up; the
                     line is sized to the stack, not derived from the rows. */
                  className="relative flex h-[7vw] items-center gap-[1.2vw] max-[1025px]:h-[11vw] max-md:h-[19vw] max-md:gap-[5vw]"
                >
                  {/* 10px dot. The timeline repaints it white as its project
                      becomes current — see the tl.set calls above. */}
                  <span
                    data-dot
                    aria-hidden="true"
                    className="mt-[-1.5vw] size-[10px] shrink-0 rounded-full border max-[1025px]:mt-[-4vw] max-md:mt-[-7vw]"
                  />
                  <div>
                    <h3 className="font-normal text-[1.5vw] max-[1025px]:text-[3.5vw] max-md:text-[5.5vw]">{p.title}</h3>
                    <p className="text-[1vw] max-[1025px]:text-[2.5vw] max-md:text-[4.2vw]">
                      {p.tags.join("  •  ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- image stack ----------------------------------------- */}
          <div className="relative h-[38vw] w-full overflow-hidden rounded-xl max-[1025px]:h-[52vw] max-[1025px]:rounded-lg">
            {projects.map((p, i) => (
              <div
                key={p.id}
                data-plate
                /* Explicit z-index, not DOM order. The incoming plate rises
                   OVER the one it replaces, so "which is on top" has to be a
                   stated fact rather than an accident of markup. */
                style={{ zIndex: i + 1 }}
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-[#F4EFE9] max-[1025px]:rounded-lg"
              >
                <Image
                  src={p.image}
                  alt={`${p.title} — ${p.tags.join(", ")}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 68vw"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- bottom glow ---------------------------------------------- */}
      {/* A blurred gradient slab sitting below the stage, so the stage reads as
          lit from underneath rather than pasted on. */}
      <div aria-hidden="true" className="absolute bottom-[-10%] left-0 h-[60vh] w-full overflow-hidden max-[1025px]:bottom-[-13%]">
        <div className="absolute bottom-[35%] left-[-7.5%] z-2 h-[40vh] w-[115%] bg-[linear-gradient(90deg,var(--grad-hot)_0%,var(--accent-red)_100%)] blur-2xl max-[1025px]:bottom-[50%] max-[1025px]:left-[-10%] max-[1025px]:w-[120%] max-[1025px]:blur-lg" />
      </div>

      {/* ---- scroll runway -----------------------------------------------
           The section's own pt-[8vw] sits ABOVE the sticky stage, exactly as
           in the reference (its h-[360vh] total includes that padding, which
           is what makes the stage's sticky threshold land 8vw deep). The
           runway is reduced by the same amount so the section sums to a
           clean 360vh. */}
      <div aria-hidden="true" className="h-[calc(360vh-8vw-100svh)]" />
    </section>
  );
}