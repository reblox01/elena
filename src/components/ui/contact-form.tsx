"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

/**
 * The reference's Get-In-Touch form, cloned field-for-field from its DOM.
 *
 * The honest oddities, all measured against the ref:
 *
 *   • "Your Message*" is a single-line `<input>`, not a textarea — every
 *     field is the same h-14 pill.
 *   • labels are `sr-only`; the placeholders are the visible text (and the
 *     asterisks live on the END of the placeholder string, as typed).
 *   • field colours come through the form config as INLINE styles
 *     (`rgba(255,255,255,0.15)` bg/border, white text), sitting on top of a
 *     generic light-theme class list the config leaves visible-but-inert.
 *     Placeholder colour is `rgba(255,255,255,0.45)` (computed, ref).
 *   • focus rings: `focus-within:border-[#ff5f00]` — the orange peak from the
 *     class list, not the gradient's #F16B0D.
 *   • the phone pill is a bordered wrapper (`border-white/20`) with an
 *     emoji-flag country toggle, a `listbox` dropdown of ten countries in a
 *     fixed curated order, and a borderless `type="tel"` input behind it.
 *   • the visible Send is a STATIC gradient anchor: real CDP hover on the ref
 *     changes nothing (dot, glyphs, colour all stay put) — the roll/flood
 *     plumbing in its markup is dormant. The hidden native submit does the
 *     work; Send calls `requestSubmit()`.
 *   • onSubmit is the ref's console.log stub; the modal stays open after it.
 */
const FIELD_CLASSES =
  "w-full border rounded-full bg-white h-14 pl-5 pr-4 text-sm text-gray-800 outline-none transition-all border-gray-200 focus-within:border-[#ff5f00] placeholder:text-white/45";
const FIELD_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  borderColor: "rgba(255, 255, 255, 0.15)",
  color: "rgb(255, 255, 255)",
} as const;

/**
 * The ref ships a curated ten-country whitelist in exactly this order.
 * India first, UAE ninth and selected, Singapore last — an order nobody
 * derives logically, so it is copied verbatim rather than "fixed".
 */
const COUNTRIES = [
  { flag: "🇮🇳", code: "IN", dial: "91" },
  { flag: "🇮🇪", code: "IE", dial: "353" },
  { flag: "🇺🇸", code: "US", dial: "1" },
  { flag: "🇬🇧", code: "GB", dial: "44" },
  { flag: "🇦🇺", code: "AU", dial: "61" },
  { flag: "🇨🇦", code: "CA", dial: "1" },
  { flag: "🇩🇪", code: "DE", dial: "49" },
  { flag: "🇫🇷", code: "FR", dial: "33" },
  { flag: "🇦🇪", code: "AE", dial: "971" },
  { flag: "🇸🇬", code: "SG", dial: "65" },
] as const;

type Country = (typeof COUNTRIES)[number];

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("transition-transform", open && "rotate-180")}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [country, setCountry] = useState<Country>(COUNTRIES.find((c) => c.code === "AE")!);
  const [ddOpen, setDdOpen] = useState(false);
  const phoneBlockRef = useRef<HTMLDivElement>(null);

  // The ref's submit is a deliberate console.log stub — nothing is sent, and
  // the modal stays open afterwards (measured).
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", Object.fromEntries(new FormData(e.currentTarget).entries()));
  };

  // Click-away for the country listbox: anywhere outside the phone block
  // closes the dropdown (the panel/pill area counts as outside the options).
  useEffect(() => {
    if (!ddOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const block = phoneBlockRef.current;
      if (block && block.contains(e.target as Node)) return;
      setDdOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ddOpen]);

  const pick: MouseEventHandler<HTMLButtonElement> = (e) => {
    const code = (e.currentTarget as HTMLButtonElement).dataset.code as Country["code"];
    setCountry(COUNTRIES.find((c) => c.code === code)!);
    setDdOpen(false);
  };

  const sendClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className="contact-form space-y-[1.2vw] max-md:space-y-[4vw] max-[1025px]:space-y-[4vw]"
    >
      {/*
        Every field lives in its own `w-full` row div on the reference — the
        form's `space-y` steps then measure between ROW borders, not between
        the label/input elements, which is where the 17.28px rhythm comes
        from at 1440.
      */}
      <div className="w-full">
        <label className="sr-only" htmlFor="get-in-touch-name">
          Your Name*
        </label>
        <input
          id="get-in-touch-name"
          name="name"
          type="text"
          placeholder="Your Name*"
          className={FIELD_CLASSES}
          style={FIELD_STYLE}
        />
      </div>
      <div className="w-full">
        <label className="sr-only" htmlFor="get-in-touch-email">
          Email Address*
        </label>
        <input
          id="get-in-touch-email"
          name="email"
          type="email"
          placeholder="Email Address*"
          className={FIELD_CLASSES}
          style={FIELD_STYLE}
        />
      </div>
      <div className="w-full">
        <label className="sr-only" htmlFor="get-in-touch-subject">
          Subject*
        </label>
        <input
          id="get-in-touch-subject"
          name="subject"
          type="text"
          placeholder="Subject*"
          className={FIELD_CLASSES}
          style={FIELD_STYLE}
        />
      </div>
      <div className="w-full">
        <label className="sr-only" htmlFor="get-in-touch-message">
          Your Message*
        </label>
        <input
          id="get-in-touch-message"
          name="message"
          type="text"
          placeholder="Your Message*"
          className={FIELD_CLASSES}
          style={FIELD_STYLE}
        />
      </div>

      {/* Phone pill: bordered wrapper carries the ring; the input inside is
          borderless so the rounding stays a single shape. */}
      <div className="w-full">
        <div
          ref={phoneBlockRef}
          className="flex h-14 items-center rounded-full border bg-white/15 transition-all border-white/20 focus-within:border-[#ff5f00]"
        >
          <div className="relative shrink-0">
            {/* The ref's exact class list. The light-theme `text-gray-700` it
                carries is inert on BOTH sides: the form-scope `--form-text`
                remap rule in globals.css (a mirror of the ref's
                #contact-form-_r_0_ stylesheet rule) re-points it to white,
                and being unlayered it also beats hover:text-gray-900 — so the
                label stays white on hover, as measured on the ref. */}
            <button
              type="button"
              aria-expanded={ddOpen}
              aria-haspopup="listbox"
              onClick={() => setDdOpen((v) => !v)}
              className="flex h-full cursor-pointer items-center gap-1 pl-4 pr-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
            >
              <span className="text-base">{country.flag}</span>
              <span className="font-normal text-sm">+{country.dial}</span>
              <ChevronDown open={ddOpen} />
            </button>
            {ddOpen && (
              <div
                role="listbox"
                className="absolute left-0 top-full z-50 mt-2 max-h-52 min-w-48 rounded-md border border-gray-200 bg-white py-1"
              >
                {/* The ref nests a 12rem scroller (`overflow-y-auto max-h-48`)
                    inside the clipped box, so the box itself never scrolls:
                    its height stays 4 + 192 + 4 + borders = 201.67px at 1440,
                    and the overflow stays contained so the ten options never
                    grow the modal panel's own scroll area into a scrollbar.

                    One deliberate departure from the ref: its scroller draws
                    the platform's default scrollbar (track, thumb, arrow
                    buttons). Per direction we hide it — `.no-scrollbar` keeps
                    the list fully scrollable with wheel/drag/keyboard but
                    draws nothing. Side effect of hiding: the ~15px classic
                    gutter is no longer reserved, so the option rows widen to
                    the box's padding edge. */}
                <div className="no-scrollbar overflow-y-auto max-h-48">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      data-code={c.code}
                      type="button"
                      role="option"
                      aria-selected={c.code === country.code}
                      onClick={pick}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-black! transition-colors hover:bg-gray-50",
                        c.code === country.code && "font-medium text-orange-500",
                      )}
                    >
                      <span>{c.flag}</span>
                      <span>{c.code}</span>
                      <span className="ml-auto text-gray-400">+{c.dial}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <label className="sr-only" htmlFor="get-in-touch-phone">
            Phone Number*
          </label>
          <input
            id="get-in-touch-phone"
            name="phone"
            type="tel"
            placeholder="Phone Number*"
            className="h-full flex-1 rounded-r-full bg-transparent! pl-4 pr-5 text-sm text-gray-800 outline-none placeholder:text-white/45"
            style={{ color: "rgb(255, 255, 255)" }}
          />
        </div>
      </div>

      {/*
        The hidden native submit sits BETWEEN the phone row and the send
        wrapper on the reference dump. `hidden` keeps it out of the spacing
        rhythm (display:none suppresses its space-y margin); it only exists
        so `requestSubmit()` has a real submitter to fire with.
      */}
      <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />

      {/*
        The visible Send is a STATIC gradient anchor: the ref's own hover
        state did not budge under real CDP hover (dot scale, glyphs, colour —
        all identical), so replicating a flood here would be inventing motion.

        It lives inside a `flex` wrapper because the anchor's own `mt-[2vw]`
        must stack INSIDE the wrapper's space-y step (17.28 + 28.8 = 46.08 to
        the anchor's top) — a bare anchor child would collapse its margin
        against the phone row's instead, landing 17.28px too high.
      */}
      <div className="flex">
        <a
          aria-disabled="false"
          href="#"
          onClick={sendClick}
          className="group relative flex w-fit items-center justify-center gap-[0.9vw] h-[3.5vw] px-[2vw] rounded-full overflow-hidden whitespace-nowrap no-underline font-medium text-[1.5vw] transition-colors border-white/20! duration-500 motion-reduce:transition-none max-[1025px]:gap-[1.6vw] max-[1025px]:h-[8vw] max-[1025px]:px-[3.5vw] max-[1025px]:text-[3vw] max-[1025px]:font-normal max-[1025px]:motion-reduce:transition-none max-md:gap-[2.4vw] max-md:h-[12vw] max-md:px-[5vw] max-md:text-[4.2vw] max-md:motion-reduce:transition-none mt-[2vw] max-md:mt-0 max-[1025px]:mt-[3vw]"
          style={{
            background: "linear-gradient(to right, rgb(241, 107, 13), rgb(230, 20, 22))",
            color: "rgb(255, 255, 255)",
          }}
        >
          <span
            aria-hidden="true"
            className="relative z-10 flex shrink-0 items-center justify-center w-[0.5vw] h-[0.5vw] max-[1025px]:w-[1.5vw] max-[1025px]:h-[1.5vw] max-md:w-[2.3vw] max-md:h-[2.3vw]"
            style={{ marginTop: "0.08em" }}
          >
            <span
              className="absolute inset-0 rounded-full transition-transform duration-400 ease-in-out motion-reduce:transition-none max-[1025px]:motion-reduce:transition-none max-md:motion-reduce:transition-none"
              style={{
                background: "rgb(255, 255, 255)",
                transform: "scale(1)",
                transitionTimingFunction: "cubic-bezier(0.785, 0.135, 0.15, 0.86)",
              }}
            />
          </span>
          <span
            aria-hidden="true"
            className="invisible block h-[1.3em] leading-[1.3] text-[1.2vw] max-md:text-[4vw] max-[1025px]:text-[2.5vw]"
          >
            Send
          </span>
          <span
            className="absolute left-1/2 top-1/2 z-20 block h-[1.3em] -translate-x-1/2 -translate-y-1/2 overflow-hidden text-[1.2vw] max-md:text-[4vw] max-[1025px]:text-[2.5vw]"
            style={{ marginTop: "0.08em" }}
          >
            <span className="block leading-[1.3]" aria-hidden="false">
              Send
            </span>
          </span>
          {/*
            Fourth in-flow child on the ref's send: this spacer is what makes
            the anchor exactly 137px wide (dot 7.2 + gap 12.96 + sizer 39.1 +
            gap 12.96 + spacer 7.2 + padding 57.6). The absolute window's
            centring also shifts with it, so dropping it drifts "Send" 3.6px
            left and pinches the pill.
          */}
          <span
            aria-hidden="true"
            className="block shrink-0 w-[0.5vw] max-[1025px]:w-[1.5vw] max-md:w-[2.3vw]"
          />
        </a>
      </div>
    </form>
  );
}
