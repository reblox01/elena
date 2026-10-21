import { gsap, SplitText } from "@/components/gsap/gsap-config";

/**
 * Copy reveal — the reference's `Copy` component contract, shared by sections
 * that use it (awards inlines its own block; services / work-with-me use this).
 *
 * Markup contract: `[data-copy-wrapper="true"]` renders at `opacity-0`. A
 * wrapper with `data-copy="chars"` splits its first element into per-char
 * line masks (char stagger 0.015, `mask: chars`, no whitespace reduction);
 * every other wrapper splits into line masks (line stagger 0.1). Both rise out
 * of their mask (yPercent 100 → 0, duration 0.5, power3.out, own trigger at
 * "top 85%"), and the wrapper returns to opacity 1 the moment the split exists.
 *
 * Splitting waits for `document.fonts.ready` with a 300 ms cap — matching the
 * reference — so the masks align to the real font metrics. Under reduced motion
 * nothing splits: the wrapper fades in with a small rise on its own trigger.
 *
 * Must be called inside a useGsap/useGsapMatchMedia build so the tweens join
 * that animation context. Returns a cleanup that reverts every SplitText.
 */
export function buildCopyReveals(scope: HTMLElement, reduced: boolean): () => void {
  const copyWrappers = Array.from(scope.querySelectorAll<HTMLElement>("[data-copy-wrapper]"));
  if (!copyWrappers.length) return () => undefined;

  if (reduced) {
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
    return () => undefined;
  }

  const splits: SplitText[] = [];
  let timer = 0;
  let ran = false;

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

  const go = () => {
    if (ran) return;
    ran = true;
    window.clearTimeout(timer);
    build();
  };

  // Split after the font settles — 300 ms cap, matching the reference.
  timer = window.setTimeout(go, 300);
  void document.fonts?.ready.then(go, go);

  return () => {
    ran = true;
    window.clearTimeout(timer);
    splits.forEach((s) => s.revert());
  };
}
