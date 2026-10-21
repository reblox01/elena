"use client";

import { Fragment, useRef, useState } from "react";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { buildCopyReveals } from "@/components/gsap/copy-reveal";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { services, servicesHeading, servicesStatement } from "@/lib/data";

/**
 * SERVICES — rebuilt from the reference's Services module (chunk 42rc0wabyru76.js).
 *
 * Structure, exactly as the reference:
 *
 *   section#services (275vh, bg #070707)
 *   ├─ statement block (60% wide, 6vw padding):
 *   │    h2 "Design That Speaks / to Your Audience"  — Copy reveal, chars
 *   │    p  practice statement                        — Copy reveal, lines
 *   └─ services-sticky (100vh, sticky top-0):
 *        row of 5 cards (`services-row`) scrubbed horizontally from
 *        xPercent 70 → -33 across the section (50 → -65 tablet, 50 → -77 ≤541,
 *        from/to eased `none`, trigger "top 20%" → "bottom bottom").
 *
 * Card fill: each card's gradient sits under a radial mask whose radius is the
 * CSS var --reveal. The values answer to hover, not scroll: values live in a
 * mutable ref array (`value`s 100 / -40 — card 0 starts lit, the rest fully
 * masked), entering a card tweens the previously active card's value to -40 and
 * the hovered card's to 100 (.45s power2.out, skipped under reduced motion),
 * and `--reveal` rewrites itself inside onUpdate.
 *
 * Per-card badge: the active card gets the white circle (React state,
 * `bg-white text-black` vs `text-white`); the arrows play their diagonal
 * replacement dance on group-hover via plain CSS utilities.
 *
 * Reduced motion: the section loses its runway height, the sticky rail becomes
 * a static 3-column grid (2 / 1 below), the row's transform is cleared, hover
 * snaps instantly, and the Copy wrappers fall to their fade path (handled in
 * useGsapMatchMedia's reduced build).
 */

export function Services() {
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const revealValues = useRef(services.map((_, t) => ({ value: t === 0 ? 100 : -40 })));
  // Active card drives the white badge. The reference tracks it in state.
  const [active, setActive] = useState(0);

  const reduced = useReducedMotion();

  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced: rm }) => {
      const row = scope.querySelector<HTMLElement>("[data-services-row]");
      // h2 + statement ride the reference's Copy reveal (chars / lines).
      const cleanupCopy = buildCopyReveals(scope, rm);
      if (!row) return cleanupCopy;

      if (rm) {
        // The reference clears the row's transform under reduced motion; the
        // grid layout takes over from the scrubbed rail.
        gsap.set(row, { clearProps: "transform" });
        return cleanupCopy;
      }

      const from = window.innerWidth > 1025 ? 70 : 50;
      const to = window.innerWidth > 1025 ? -33 : window.innerWidth < 1025 && window.innerWidth > 541 ? -65 : -77;
      gsap.fromTo(
        row,
        { xPercent: from },
        {
          xPercent: to,
          ease: "none",
          scrollTrigger: { trigger: scope, start: "top 20%", end: "bottom bottom", scrub: true },
        },
      );
      return cleanupCopy;
    },
    [],
  );

  const enterCard = (index: number) => () => {
    if (index === active) return;
    const duration = reduced ? 0 : 0.45;
    const onLeaveIdx = active;
    gsap.to(revealValues.current[onLeaveIdx], {
      value: -40,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        fillRefs.current[onLeaveIdx]?.style.setProperty("--reveal", `${revealValues.current[onLeaveIdx].value}%`);
      },
    });
    gsap.to(revealValues.current[index], {
      value: 100,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        fillRefs.current[index]?.style.setProperty("--reveal", `${revealValues.current[index].value}%`);
      },
    });
    setActive(index);
  };

  return (
    <section
      id="services"
      ref={root}
      aria-label="Services"
      className={`services-section relative w-screen bg-[#070707] text-white ${reduced ? "" : "h-[275vh]"}`}
    >
      <div className="relative pt-[6vw] px-[4vw] w-[60%] max-[1025px]:w-[85%] max-md:w-full max-[1025px]:px-[5vw] max-[1025px]:pt-[15vw]">
        <div data-copy-wrapper="true" data-copy="chars" className="opacity-0">
          <h2
            className="text-[5.5vw] max-[1025px]:text-[7vw] max-md:text-[9vw]"
            /* The unlayered heading identity in globals.css (line-height 1.02,
               letter-spacing -0.035em, weight 500) outranks every utility, so
               the reference's computed values are restated inline — see the
               notes on awards.tsx / portfolio h3.  */
            style={{ lineHeight: 1.2, letterSpacing: "normal", fontWeight: 400 }}
          >
            {servicesHeading.split("\n").map((line, i) => (
              <Fragment key={line}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h2>
        </div>
        <div className="w-[75%] max-[1025px]:w-full mt-[1.5vw] max-[1025px]:mt-[5vw]">
          <div data-copy-wrapper="true" className="opacity-0">
            <p
              className="text-[1.25vw] max-[1025px]:text-[2.5vw] max-md:text-[4.5vw]"
              style={{ lineHeight: 1.5 }}
            >
              {servicesStatement}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`services-sticky ${reduced ? "w-screen pb-[6vw]" : "w-screen h-screen sticky top-0 overflow-hidden flex flex-col max-md:mt-[-30vw]"}`}
      >
        <div className={reduced ? "" : "relative flex-1 flex items-center"}>
          <div
            data-services-row
            className={`services-row ${
              reduced
                ? "grid grid-cols-3 gap-[1.6vw] px-[4vw] pt-[5vw] max-[1025px]:grid-cols-2 max-md:grid-cols-1"
                : "flex gap-[1.6vw] px-[4vw] will-change-transform max-[1025px]:gap-[2.5vw] max-md:gap-[6vw]"
            }`}
          >
            {services.map((s, i) => (
              // The reference ships these as Next Links with href "#"; the click
              // interceptor leaves the page where it is.
              <a
                key={s.title}
                href="#"
                onMouseEnter={enterCard(i)}
                onClick={(e) => e.preventDefault()} // the reference data links "#"; keep the page put.
                className={`services-card ${
                  reduced
                    ? "relative rounded-lg p-[1.6vw] flex flex-col justify-between bg-[#161616] overflow-hidden min-h-[22vw] max-[1025px]:min-h-[32vw] max-[1025px]:p-[3vw] max-md:min-h-0 max-md:p-[5vw] border border-white/20"
                    : "relative w-[27vw] h-[30vw] shrink-0 rounded-lg p-[1.6vw] flex flex-col justify-between bg-[#161616] overflow-hidden max-[1025px]:w-[55vw] max-[1025px]:h-[65vw] max-[1025px]:p-[3vw] max-md:w-[75vw] max-md:h-[85vw] max-md:p-[5vw] border border-white/20 group"
                }`}
              >
                {/* Radial-mask gradient fill — hover sweeps open via --reveal. */}
                <div
                  ref={(el) => {
                    fillRefs.current[i] = el;
                    el?.style.setProperty("--reveal", `${revealValues.current[i].value}%`);
                  }}
                  className="absolute inset-0 bg-linear-to-r from-[#F16B0D] to-[#E61416] radial-mask-bg-fill"
                />
                <div className="relative flex justify-end">
                  <div
                    className={`w-[3vw] h-[3vw] rounded-full flex items-center justify-center border-white/30 border max-[1025px]:w-[7vw] max-[1025px]:h-[7vw] max-md:w-[9vw] max-md:h-[9vw] duration-300 ease-out overflow-hidden relative ${
                      active === i ? "bg-white text-black" : "text-white"
                    }`}
                  >
                    {/* Outgoing arrow: slides away on hover… */}
                    <div className="group-hover:translate-x-[150%] group-hover:translate-y-[-150%] duration-300 ease-out">
                      <ArrowIcon />
                    </div>
                    {/* …while this one slides in from the opposite corner. */}
                    <div className="absolute translate-x-[-150%] translate-y-[150%] group-hover:translate-x-0 group-hover:translate-y-0 duration-300 ease-out">
                      <ArrowIcon />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <h3
                    className="text-[2.5vw] font-normal mb-[1vw] max-[1025px]:text-[5vw] max-md:text-[6.5vw]"
                    style={{ lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400 }}
                  >
                    {s.title}
                  </h3>
                  <ul className="space-y-[0.4vw] list-disc pl-[0.5vw] max-[1025px]:space-y-[1vw] max-md:space-y-[1.8vw]">
                    {s.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-[0.7vw] text-[1.25vw] text-white max-[1025px]:text-[3vw] max-md:text-[4vw]"
                        style={{ lineHeight: 1.5 }}
                      >
                        <span aria-hidden="true" className="size-1.5 bg-white rounded-full shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* lucide arrow-up-right, matching the reference's imported icon. */
function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
