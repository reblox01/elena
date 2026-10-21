"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "@/components/gsap/gsap-config";
import { ContactForm } from "@/components/ui/contact-form";
import { cn } from "@/lib/utils";

/**
 * GET-IN-TOUCH — the reference's modal, cloned against its live DOM.
 *
 * The measured behaviour is stranger than a halfway reconstruction would
 * guess, so all of it is deliberate:
 *
 *   • lazy mount, permanent stay — the provider keeps `mounted` (set once on
 *     the first open) separate from `open`. The closed dialog is NOT removed:
 *     it stays in the DOM at opacity 0 with `pointer-events-none` +
 *     `aria-hidden="true"` — the browser-console warning about aria-hidden on
 *     a focused descendant in the ref's console is the smoking gun this is
 *     really theirs.
 *   • NO entrance animation: rAF sampling showed the dialog rendering already
 *     settled at identity the very first frame (t≈15ms). The
 *     `will-change-[transform,opacity]` on the stage is dormant plumbing.
 *   • the exit however IS animated: stage + overlay fade to 0 while the stage
 *     lands at exactly scale(0.8), ~0.7s, ease-in (power1.in), then parks
 *     there permanently. Re-opening instantly resets those inline values.
 *   • no Escape handler — measured: dispatching Escape closes nothing. Only
 *     the ✕ button and the backdrop close it.
 *   • scroll lock: body gets the ref's exact inline
 *     `scroll-behavior: auto; overflow: hidden;` and Lenis stops behind it;
 *     both restore once the fade completes.
 *   • focus moves to the dialog element itself (a DIV, per the ref's
 *     activeElement probe), and returns to the invoker on close.
 */
const GetInTouchContext = createContext<{ openModal: () => void } | null>(null);

export function useGetInTouchModal() {
  const ctx = useContext(GetInTouchContext);
  if (!ctx) {
    throw new Error("useGetInTouchModal must be used within <GetInTouchProvider>");
  }
  return ctx;
}

export function GetInTouchProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  // Whether the page was already scroll-locked BEFORE this open (the hero
  // intro holds Lenis stopped for its first beats). If so, a later close must
  // NOT release the intro's lock — only restore the body overflow.
  const wasLockedRef = useRef(false);

  const openModal = useCallback(() => {
    invokerRef.current = document.activeElement as HTMLElement | null;
    wasLockedRef.current = document.documentElement.classList.contains("lenis-stopped");
    setMounted(true);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  // Lock on open, and reset any parked exit state…
  useEffect(() => {
    if (!open || !mounted) return;
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    lenis?.stop();
    document.documentElement.classList.add("lenis-stopped");
    document.body.setAttribute("style", "scroll-behavior: auto; overflow: hidden;");

    const inner = rootEl.querySelector<HTMLElement>("[data-modal-stage]");
    const overlay = rootEl.querySelector<HTMLElement>("[data-modal-overlay]");
    if (inner) gsap.set(inner, { opacity: 1, scale: 1 });
    if (overlay) gsap.set(overlay, { opacity: 1 });

    // The dialog itself takes focus, exactly like the ref (activeElement=DIV).
    rootEl.focus();
  }, [open, mounted]);

  // …and animate out on close, then unlock. Re-opening mid-fade is safe: the
  // open effect above resets inline opacity/scale at step zero.
  useEffect(() => {
    if (open || !mounted) return;
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const inner = rootEl.querySelector<HTMLElement>("[data-modal-stage]");
    const overlay = rootEl.querySelector<HTMLElement>("[data-modal-overlay]");

    const restore = () => {
      // Only hand scroll back if WE took it. If the intro was still holding
      // Lenis when we locked, its own gate removes the class when it runs.
      if (!wasLockedRef.current) {
        const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
        lenis?.start();
        document.documentElement.classList.remove("lenis-stopped");
      }
      document.body.removeAttribute("style");
      // Dismiss hands focus back to the opening control (Radix does this
      // automatically; the ref's dialog parks focus on the dialog DIV for the
      // whole fade — console warning and all — then returns it).
      if (invokerRef.current?.isConnected) invokerRef.current.focus();
    };

    const finish = (el: HTMLElement | null) => el && gsap.set(el, { opacity: 0, scale: 0.8 });

    if (prefersReducedMotion()) {
      finish(inner);
      if (overlay) gsap.set(overlay, { opacity: 0 });
      restore();
      return;
    }

    // Measured off the ref: opacity 1→0 and scale 1→0.8 share the same
    // slow-start ease and window (~0.7s), overlay in lockstep with the stage.
    const tl = gsap.timeline({ onComplete: restore });
    tl.to([inner, overlay], { opacity: 0, duration: 0.7, ease: "power1.in" }, 0).to(
      inner,
      { scale: 0.8, duration: 0.7, ease: "power1.in" },
      0,
    );

    return () => {
      tl.kill();
    };
  }, [open, mounted]);

  return (
    <GetInTouchContext.Provider value={{ openModal }}>
      {children}
      {mounted &&
        createPortal(
          <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="get-in-touch-modal-title"
            aria-hidden={open ? undefined : true}
            tabIndex={-1}
            className={cn(
              "fixed inset-0 z-[9999] focus-visible:outline-none",
              open ? "pointer-events-auto" : "pointer-events-none",
            )}
          >
            {/*
              The stage IS what animates (opacity + scale) — not the panel —
              which is why it carries the will-change pair.
            */}
            <div
              data-modal-stage
              className="relative z-1 flex h-screen w-screen items-center justify-center px-[4vw] max-md:px-4 will-change-[transform,opacity]"
            >
              {/* The backdrop is a button on the ref: a clickable, labelled
                  close affordance living under the panel. */}
              <button
                data-modal-overlay
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                className="absolute inset-0 cursor-pointer border-0 backdrop-blur-lg bg-black/10 will-change-[opacity]"
              />

              <div className="relative w-full max-w-[75vw] h-[75vh] overflow-y-auto rounded-[2vw] bg-white/5 backdrop-blur-lg border border-white/10 text-white p-[3vw] max-[1025px]:max-w-[85vw] max-[1025px]:p-8 max-md:max-w-full max-md:p-6 max-md:rounded-3xl">
                <div className="absolute top-[2vw] right-[2vw] max-[1025px]:top-6 max-[1025px]:right-6 max-md:top-4 max-md:right-4">
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={closeModal}
                    className="group relative shrink-0 size-14 rounded-full overflow-hidden flex items-center justify-center cursor-pointer max-[1025px]:size-11 max-md:size-9"
                  >
                    <div className="absolute inset-0 w-full h-full bg-linear-to-r from-[#F16B0D] to-[#E61416]" />
                    <span className="absolute h-0.5 z-2 w-4 rounded-full bg-white rotate-45 max-md:w-3 group-hover:rotate-[225deg] duration-500 ease-in-out motion-reduce:transition-none" />
                    <span className="absolute h-0.5 z-2 w-4 rounded-full bg-white -rotate-45 max-md:w-3 group-hover:rotate-[135deg] duration-500 ease-in-out motion-reduce:transition-none" />
                  </button>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-[3vw] items-start max-[1025px]:grid-cols-1 max-[1025px]:gap-8 pt-[4vw]">
                  <div>
                    <h2
                      id="get-in-touch-modal-title"
                      className="text-[4.8vw] leading-[1.1]! max-[1025px]:text-[5vw] max-md:text-[8vw]"
                    >
                      Get in Touch
                    </h2>
                    <p className="mt-[1vw] text-[1.1vw] text-white max-[1025px]:text-[2.4vw] max-md:text-[4vw]">
                      Drop me a message
                    </p>
                  </div>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </GetInTouchContext.Provider>
  );
}
