"use client";

import type { ComponentType, ReactNode } from "react";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { buildCopyReveals } from "@/components/gsap/copy-reveal";
import { workWithMe, type WorkIcon } from "@/lib/data";

/**
 * WORK WITH ME — rebuilt from the reference's module (same chunk as services /
 * awards, 42rc0wabyru76.js): centred h2 + sub-line, then a 3-column grid of
 * fixed-height cards (1 column below 1025px), each ending in a hairline whose
 * orange fill is a HOVER effect, not a scroll rule — enter draws it left→right,
 * leave retreats it right→left (0.55s power2.out, killTweensOf'd, re-origin so
 * the draw always follows the cursor direction of travel).
 *
 * The cards themselves reveal once at the section's top edge (opacity 0,
 * yPercent 10 → visible, stagger 0.05, power2.out, trigger "top top"); under
 * reduced motion they render visible immediately.
 */

/**
 * The reference ships the older lucide 0.x glyphs; lucide-react's current
 * release has redrawn rocket/sparkles/zap, so the three icons are inlined from
 * the reference's own svg markup (50×50, stroke #E8620F, width 1.5).
 */
function RefIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E8620F"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mb-[2.5vw] max-[1025px]:mb-[4vw]"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconRocket() {
  return (
    <RefIcon>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" />
      <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
    </RefIcon>
  );
}

function IconSparkles() {
  return (
    <RefIcon>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </RefIcon>
  );
}

function IconZap() {
  return (
    <RefIcon>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </RefIcon>
  );
}

const ICONS: Record<WorkIcon, ComponentType> = {
  rocket: IconRocket,
  sparkles: IconSparkles,
  zap: IconZap,
};

export function WorkWithMe() {
  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced: rm }) => {
      const cleanups: Array<() => void> = [buildCopyReveals(scope, rm)];

      // Rules park hidden at left origin in every mode — matching the module's
      // initial set before any hover.
      const rules = Array.from(scope.querySelectorAll<HTMLElement>("[data-rule-fill]"));
      rules.forEach((r) => gsap.set(r, { scaleX: 0, transformOrigin: "left center" }));

      const showRule = (i: number) => {
        const t = rules[i];
        if (!t) return;
        gsap.killTweensOf(t);
        gsap.set(t, { transformOrigin: "left center" });
        gsap.to(t, { scaleX: 1, duration: 0.55, ease: "power2.out" });
      };
      const hideRule = (i: number) => {
        const t = rules[i];
        if (!t) return;
        gsap.killTweensOf(t);
        gsap.set(t, { transformOrigin: "right center" });
        gsap.to(t, { scaleX: 0, duration: 0.55, ease: "power2.out" });
      };

      const cards = Array.from(scope.querySelectorAll<HTMLElement>("[data-work-card]"));
      cards.forEach((card, i) => {
        const on = () => showRule(i);
        const off = () => hideRule(i);
        card.addEventListener("mouseenter", on);
        card.addEventListener("mouseleave", off);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", on);
          card.removeEventListener("mouseleave", off);
        });
      });

      if (rm) {
        // Reference reduced path: no card entrance — static, visible.
        gsap.set(cards, { opacity: 1, yPercent: 0 });
      } else {
        gsap.fromTo(
          cards,
          { opacity: 0, yPercent: 10 },
          {
            opacity: 1,
            yPercent: 0,
            stagger: 0.05,
            ease: "power2.out",
            scrollTrigger: { trigger: scope, start: "top top" },
          },
        );
      }

      return () => cleanups.forEach((fn) => fn());
    },
    [],
  );

  return (
    <section
      id="work-with-me"
      ref={root}
      aria-label="Why work with me"
      className="relative w-screen bg-[#070707] text-white pt-[25vw] pb-[10vw] max-[1025px]:pt-[65vw]"
    >
      <div className="text-center mb-[5vw] max-md:mb-[10vw]">
        <div data-copy-wrapper="true" data-copy="chars" className="opacity-0">
          <h2
            className="text-[5.5vw] max-[1025px]:text-[7vw] max-md:text-[9vw]"
            /* The unlayered heading identity in globals.css (lh 1.02 /
               ls -0.035em / weight 500) outranks every utility — the
               reference's computed values are restated inline. The WWM h2
               runs at the body's 1.5 leading in the reference, unlike the
               services h2 which is 1.2. */
            style={{ lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400 }}
          >
            {workWithMe.heading}
          </h2>
        </div>
        <div data-copy-wrapper="true" className="opacity-0">
          <p
            className="text-[1.25vw] text-white mt-[1.5vw] max-[1025px]:text-[2.5vw] max-md:text-[4.5vw] max-md:mt-[2vw]"
            style={{ lineHeight: 1.5 }}
          >
            {workWithMe.sub}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 max-[1025px]:grid-cols-1">
        {workWithMe.cards.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <div
              key={card.title}
              data-work-card
              className="relative px-[4vw] pt-[2vw] pb-[3vw] h-[32vw] flex flex-col justify-between work-card max-[1025px]:h-auto max-[1025px]:py-[6vw] max-[1025px]:px-[5vw]"
            >
              <div>
                <Icon />
                <h3
                  className="text-[2vw] mb-[2.5vw] max-[1025px]:text-[4.2vw] max-md:text-[5.8vw] max-[1025px]:mb-[2vw]"
                  style={{ lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400 }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-[1.25vw] text-white/80 max-[1025px]:text-[2.8vw] max-md:text-[4vw]"
                  style={{ lineHeight: 1.5 }}
                >
                  {card.body}
                </p>
              </div>
              <div className="relative mt-[3vw] h-px w-full bg-white/20">
                <span data-rule-fill className="absolute inset-0 h-px w-full will-change-transform" style={{ backgroundColor: "#E8620F" }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
