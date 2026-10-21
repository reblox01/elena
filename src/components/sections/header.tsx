"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ContactButton } from "@/components/ui/contact-button";
import { useGsapMatchMedia } from "@/components/gsap/use-gsap";
import { gsap } from "@/components/gsap/gsap-config";
import { site } from "@/lib/data";

/**
 * HEADER — logo + CTA only, and it gets out of the way.
 *
 * The reference's behaviour, exactly:
 *
 *   • hide on scroll DOWN  (yPercent -100), show on scroll UP (yPercent 0),
 *     both 0.5s power3.out
 *   • a backdrop blur fades in once you are past 40vh, so the bar separates
 *     from whatever it is floating over
 *   • no background colour and no rule at rest — it sits on the hero cleanly
 *   • starts at opacity 0 and is dropped in by the hero's intro at t=1.8s
 *
 * The hide/show is direction-gated rather than threshold-gated on purpose. A
 * plain `scrollY > 200` toggle hides the bar when you scroll down but then
 * leaves it hidden while you read, which is the opposite of what you want — the
 * controls should be one flick of the wheel away.
 *
 * `z-[99]`, not a token: the hero stage sits at z-2 and scales up to fill the
 * viewport, so anything less than that can end up behind it mid-scroll.
 */
export function Header() {
  const [blurred, setBlurred] = useState(false);

  // The section ref comes FROM the hook. useGsapMatchMedia keeps its own scope
  // ref and returns immediately if nothing is attached to it — declaring a
  // separate `const root = useRef()` and ref'ing that instead leaves the hook's
  // scope null, so the hide/show listener is never wired and the bar just sits
  // there permanently. It fails silently, which is why it is worth the comment.
  const root = useGsapMatchMedia<HTMLElement>(
    (scope, { reduced }) => {
      const bar = scope.querySelector<HTMLElement>("[data-bar]");
      if (!bar) return;

      // Reduced motion keeps the bar permanently on screen. Auto-hiding a
      // navigation is a usability decision, not decoration: if you cannot see
      // where "back to top" is, there must be no hiding at all.
      if (reduced) return;

      const last = { y: window.scrollY };
      const hidden = { v: false };

      const onScroll = () => {
        const y = window.scrollY;
        const delta = y - last.y;
        last.y = y;

        if (delta > 0 && y > 0 && !hidden.v) {
          hidden.v = true;
          gsap.to(bar, { yPercent: -100, duration: 0.5, ease: "power3.out" });
        } else if (delta < 0 && hidden.v) {
          hidden.v = false;
          gsap.to(bar, { yPercent: 0, duration: 0.5, ease: "power3.out" });
        }
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        // Leave the bar on screen for the next mount rather than restoring it
        // mid-hide and letting it animate out over fresh content.
        gsap.set(bar, { yPercent: 0 });
      };
    },
    [],
  );

  // Separate listener for the blur, because that one is a React state change
  // and has to keep working under reduced motion.
  useEffect(() => {
    const onScroll = () => setBlurred(window.scrollY > window.innerHeight * 0.4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header id="header" ref={root} className="fixed inset-x-0 top-0 z-[99] w-full">
      {/*
        One child owns everything the scroll logic touches: the translate for
        hide/show AND the backdrop-filter. backdrop-filter blurs whatever is
        painted behind the element, so with no background of its own the bar
        stays invisible over the hero and only reads once something is actually
        behind it — which is the point.
      */}
      <div
        data-bar
        className={`flex items-center justify-between gap-4 px-[4vw] py-[1.5vw] transition-[backdrop-filter] duration-500 ease-out max-[1025px]:px-[5vw] max-[1025px]:py-[3vw] max-md:px-[5vw] max-md:py-4 motion-reduce:transition-none ${
          blurred ? "backdrop-blur-lg" : "backdrop-blur-none"
        }`}
      >
        <a
          id="header-logo"
          href="#top"
          className="inline-flex shrink-0 items-center no-underline transition-opacity duration-300 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-[var(--focus)]"
        >
          {/* 12vw, not the footer's 22vw — the header mark is deliberately
              small; it is a wayfinding cue, not a masthead. */}
          <Image src="/elena-voss.svg" alt="" width={338} height={172} className="w-[12vw] max-[1025px]:w-[25vw] max-md:w-[34vw]" priority />
          <span className="sr-only">{site.name} — back to top</span>
        </a>

        <ContactButton label={site.ctaLabel} href={`mailto:${site.email}`} className="shrink-0" />
      </div>
    </header>
  );
}