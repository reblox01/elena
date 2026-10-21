"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { buildCopyReveals } from "@/components/gsap/copy-reveal";
import { faqs } from "@/lib/data";

/**
 * FAQ — rebuilt 1:1 from the reference's module (42rc0wabyru76.js).
 *
 * The h2 rides the Copy reveal (chars, stagger .015). Each row is its own
 * tween (y 40 → 0, duration .8, power2.out) triggered at "top 85%", exactly
 * like the reference's per-item build. Rows are single-open (first item open
 * on load), the toggle is the round size-14 badge with the horizontal-draw
 * sweep, and the answer region animates over 0.5s via Radix's measured
 * --radix-accordion-content-height (matched to the reference's duration).
 */
export function Faq() {
  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced: rm }) => {
      // The h2/copy ride the shared Copy reveal (chars).
      const cleanup = buildCopyReveals(scope, rm);

      const rows = Array.from(scope.querySelectorAll<HTMLElement>("[data-faq-row]"));
      if (rm) {
        gsap.set(rows, { opacity: 1, y: 0 });
        return cleanup;
      }

      // Per-row triggers rather than one batched tween, so each question rises
      // as it actually arrives instead of the whole block moving as a unit.
      // (Reference: duration .8, ease power2.out, start "top 85%".)
      const tweens = rows.map((row) =>
        gsap.fromTo(
          row,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 85%", toggleActions: "play none none none" },
          },
        ),
      );

      return () => {
        cleanup();
        for (const tween of tweens) tween.scrollTrigger?.kill();
      };
    },
    [],
  );

  return (
    <section
      id="faq"
      ref={root}
      aria-labelledby="faq-heading"
      className="relative w-screen bg-[#070707] px-[10vw] py-[6vw] text-white max-[1025px]:px-[5vw]"
    >
      <div data-copy-wrapper="true" data-copy="chars" className="opacity-0">
        <h2
          id="faq-heading"
          className="text-center mb-[6vw] text-[5.5vw] max-[1025px]:text-[7vw] max-md:text-[9vw]"
          /* The unlayered heading identity in globals.css outranks utilities —
             restating the reference's computed values inline. */
          style={{ lineHeight: 1.5, letterSpacing: "normal", fontWeight: 400 }}
        >
          Frequently Asked Questions
        </h2>
      </div>

      <div className="mx-auto w-full">
        <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
          {faqs.map((f, i) => (
            <div data-faq-row key={f.q} className="opacity-0">
              <AccordionItem value={`item-${i}`} className="group cursor-pointer py-8 max-md:py-5 [--row-dur:0.5s]">
                <AccordionTrigger className="items-center justify-between gap-6 py-0 text-[1.5vw] font-normal tracking-normal max-[1025px]:text-[2.6vw] max-md:text-[4.2vw] max-md:gap-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="w-[80%] pr-[3vw] max-[1025px]:w-full max-[1025px]:pr-0 max-md:w-full max-md:pr-0">
                  <p className="text-[1.25vw] leading-[1.6] text-white/80 max-[1025px]:text-[2.2vw] max-md:text-[3.8vw]">
                    {f.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
