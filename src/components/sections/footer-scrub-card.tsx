"use client";

import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";

/**
 * FOOTER SCRUB — the glass card below rides the scroll.
 *
 * The reference starts the card translated 20% down and lets a scrubbed tween
 * settle it to 0 as the footer passes the lower third of the viewport
 * (yPercent 20 → 0, power1.out, trigger the footer at "top 60%" →
 * "bottom bottom"). Exactly one of these wrappers exists per page, so a bare
 * `closest("footer")` is the honest way to reach the trigger element.
 *
 * Below 1025px the reference skips the behaviour entirely; reduced motion
 * parks the card at its natural position.
 */
export function FooterScrubCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useGsapMatchMedia<HTMLDivElement>(
    (root, { reduced: rm, mobile }) => {
      if (rm || mobile || (typeof window !== "undefined" && window.innerWidth <= 1025)) {
        gsap.set(root, { opacity: 1, yPercent: 0 });
        return;
      }

      gsap.fromTo(
        root,
        { yPercent: 20, opacity: 1 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: (root.closest("footer") ?? root) as HTMLElement,
            start: "top 60%",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    },
    [],
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
