"use client";

import Image from "next/image";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap, EASE } from "@/components/gsap/gsap-config";
import { clients, clientsHeading } from "@/lib/data";

/**
 * CLIENTS — a 240vh scroll-driven logo tunnel.
 *
 * Two sticky layers, both pinned for the section's duration:
 *
 *   1. the statement, centred, at z-10
 *   2. the logo grid, z-20, pulled up by -100vh so it sits ON TOP
 *
 * The grid carries `perspective` and is driven along Z by scroll, so the marks
 * fly toward the viewer and pass over the words rather than sitting behind
 * them. That overlap is the whole effect — without the z-20 layer the section
 * collapses into an ordinary logo wall.
 *
 * The grid is decorative (aria-hidden); the client names are announced once in
 * a visually-hidden list so a screen reader isn't read twelve drifting copies.
 */
export function Clients() {
  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { mobile, reduced }) => {
      const grid = scope.querySelector<HTMLElement>("[data-grid]");
      const statement = scope.querySelector<HTMLElement>("[data-statement]");
      if (!grid) return;

      if (reduced || mobile) {
        // No Z-tunnel on touch or under reduced motion: a perspective grid that
        // only moves on scroll is unreadable on a phone and pointless when
        // motion is suppressed. Fall back to a plain scrolling row.
        if (statement)
          gsap.from(statement, {
            y: 20,
            opacity: 0,
            duration: 0.7,
            ease: EASE.out,
            scrollTrigger: { trigger: scope, start: "top 80%", once: true },
          });
        return;
      }

      const rows = Array.from(grid.children) as HTMLElement[];

      if (statement) {
        gsap.from(statement, {
          yPercent: 40,
          opacity: 0,
          duration: 0.9,
          ease: EASE.mask,
          scrollTrigger: { trigger: scope, start: "top 70%", once: true },
        });
      }

      // Fly the grid forward through Z. Negative start = far away and small;
      // ending past the camera = large and past the viewer.
      gsap.fromTo(
        grid,
        { z: -2600 },
        {
          z: 420,
          ease: "none",
          scrollTrigger: { trigger: scope, start: "top top", end: "bottom bottom", scrub: true },
        },
      );

      // Rows counter-drift slightly so the marks don't travel as one flat sheet.
      rows.forEach((row, i) => {
        gsap.fromTo(
          row,
          { yPercent: i % 2 === 0 ? -14 : 14, opacity: 0 },
          {
            yPercent: i % 2 === 0 ? 14 : -14,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: scope, start: "top top", end: "bottom bottom", scrub: true },
          },
        );
      });
    },
    [],
  );

  return (
    <section
      id="clients"
      ref={root}
      aria-labelledby="clients-heading"
      /* NOTE: deliberately no `overflow-hidden` here. It would make the section
         itself a scroll container, and the sticky layers inside would then
         resolve against the section's overflow instead of the viewport — so
         they would never engage. Clipping belongs on the grid layer only. */
      className="relative h-[240vh] w-full bg-[var(--paper-deep)] text-center"
    >
      {/* ---- statement (underneath) ---- */}
      <div className="sticky top-0 z-10 flex h-screen w-full items-center justify-center">
        <div className="w-3/5 max-lg:w-4/5">
          <h3
            id="clients-heading"
            data-statement
            className="[font-size:var(--text-section)] leading-[1.2] text-[var(--fg)] max-lg:[font-size:clamp(1.75rem,7vw,7rem)] max-md:[font-size:clamp(1.5rem,8vw,7rem)]"
          >
            {clientsHeading}
          </h3>
        </div>
      </div>

      {/* ---- logo grid (on top, pulled up to overlap) ---- */}
      <div className="sticky top-0 z-20 -mt-screen flex h-screen w-full items-center justify-center overflow-hidden">
        <div
          data-grid
          aria-hidden="true"
          className="grid grid-cols-5 gap-[3vw] [perspective:350vw] max-md:grid-cols-3 max-md:gap-[6vw]"
        >
          {/* Each mark is a direct grid child, so the 5-up row and the single
              orphan on the second row fall out of the grid rather than being
              hand-placed. */}
          {clients.map((c) => (
            <div
              key={c.name}
              className="grid__item flex h-[8vw] w-[14vw] items-center justify-center max-md:h-[22vw] max-md:w-[26vw]"
            >
              <Image
                src={c.image}
                alt=""
                width={160}
                height={54}
                className="h-[4vw] w-full object-contain opacity-70 max-md:h-[11vw]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Announced once, not twelve times. */}
      <ul className="sr-only">
        {clients.map((c) => (
          <li key={c.name}>{c.name}</li>
        ))}
      </ul>
    </section>
  );
}