import Image from "next/image";
import { ContactButton } from "@/components/ui/contact-button";
import { FooterScrubCard } from "@/components/sections/footer-scrub-card";
import { site, socials } from "@/lib/data";

/**
 * The build year, cached.
 *
 * Next 16 rejects a bare `new Date()` during prerender as an unstable value —
 * it legitimately differs between a build in December and a rebuild in January,
 * which would silently change the served HTML. Marking it `"use cache"` pins the
 * value for the lifetime of the render rather than recomputing per request, and
 * lets the route stay fully static.
 */
async function buildYear() {
  "use cache";
  return new Date().getFullYear();
}

/**
 * FOOTER — a server component, deliberately.
 *
 * No interactivity and no browser APIs, so it should not ship the client
 * runtime. The one exception is ContactButton, which is a client leaf: the char
 * roll needs rAF to work and nothing else here does.
 *
 * Structure is the reference's: an oversized background mark bleeding off the
 * bottom edge, and a single glass card floating above it holding everything.
 * The card is the point — it collects the close, the call to action and the
 * small print into one plane instead of letting them dissolve into the page.
 */
export async function Footer() {
  const year = await buildYear();

  return (
    <footer
      id="footer"
      className="relative overflow-hidden px-[4vw] pt-[10vw] max-[1025px]:px-[5vw] max-md:pt-[20vw]"
    >
      {/* Absolute, not fixed — it belongs to this section's box. */}
      <Image
        src="/footer-bg.svg"
        alt=""
        aria-hidden="true"
        width={1920}
        height={900}
        className="pointer-events-none absolute -bottom-20 left-0 right-0 w-full max-md:bottom-0 max-md:scale-[5]"
      />

      <div className="relative z-[1]">
        {/* The glass card rides the scroll (FooterScrubCard): it starts 20%
            down and settles level as the footer reaches the viewport floor. */}
        <FooterScrubCard className="flex flex-col justify-between gap-20 rounded-4xl border border-white/30 bg-black/5 px-12 py-12 backdrop-blur-2xl max-[1025px]:flex-col max-[1025px]:items-center max-[1025px]:gap-10 max-[1025px]:px-8 max-[1025px]:py-15 max-md:gap-8 max-md:px-6">
          {/* ---- wordmark + closing call ------------------------------ */}
          <div className="flex items-start justify-between gap-24 max-[1025px]:flex-col-reverse max-[1025px]:items-center max-[1025px]:gap-10 max-md:gap-16">
            <Image
              src="/elena-voss.svg"
              alt={site.name}
              width={338}
              height={172}
              className="w-[22vw] max-[1025px]:w-[34vw] max-md:w-[46vw]"
            />

            <div className="flex flex-col items-end gap-[2vw] max-[1025px]:items-center max-[1025px]:gap-5 max-md:gap-[7vw]">
              <p className="w-[75%] text-end [font-size:clamp(1.75rem,3.4vw,3.75rem)] leading-[1.15] max-[1025px]:w-full max-[1025px]:text-center max-[1025px]:[font-size:clamp(2rem,5vw,4rem)] max-md:[font-size:clamp(2.25rem,7.5vw,4.5rem)]">
                Ready to Bring Your Vision to Life?
              </p>
              <ContactButton label={site.ctaLabel} href={`mailto:${site.email}`} />
            </div>
          </div>

          {/* ---- contact details + social ------------------------------ */}
          <div className="flex w-full items-end justify-between gap-36 max-[1025px]:flex-col max-[1025px]:items-center max-[1025px]:gap-10 max-[1025px]:text-center max-md:gap-10">
            <div className="w-fit">
              <h6 className="mb-5 text-[1.25vw] uppercase max-[1025px]:text-[2.4vw] max-md:text-[4vw]">Reach Out</h6>
              {/* Contact links get the reference's drawing underline: a
                  currentColor bar that grows left-to-right on the row hover
                  and survives a line wrap, unlike text-decoration. */}
              <ul className="space-y-2 text-[1.25vw] max-[1025px]:text-[2.4vw] max-md:text-[4vw]">
                <li className="under-multi-parent w-fit">
                  <a
                    href={`tel:${site.phone.replace(/\D/g, "")}`}
                    className="under-multi focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]"
                  >
                    {site.phone}
                  </a>
                </li>
                <li className="under-multi-parent w-fit">
                  <a
                    href={`mailto:${site.email}`}
                    className="under-multi focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]"
                  >
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Pills invert on hover rather than fading: `invert` flips the mark
                to its negative so it stays legible against the white fill that
                scales up underneath it. The border is left at currentColor —
                the reference's bare `border`, i.e. a full-strength white ring. */}
            <ul className="flex gap-4">
              {socials.map((s) => (
                <li key={s.label} className="group">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={`${s.label} (opens in a new tab)`}
                    className="relative block overflow-hidden rounded-full border bg-white/5 p-2.5 transition-all duration-300 ease-in-out group-hover:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)] motion-reduce:transition-none"
                  >
                    <span className="absolute inset-0 z-[-1] origin-center scale-0 rounded-full bg-white transition-transform duration-300 ease-in-out group-hover:scale-100 motion-reduce:transition-none" />
                    <Image
                      src={s.icon}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 object-contain transition-all duration-300 ease-in-out group-hover:invert motion-reduce:transition-none"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </FooterScrubCard>

        <div className="flex items-end justify-between gap-10 py-8 pt-12 text-lg max-md:flex-col max-md:gap-2 max-md:text-center">
          <p>
            Copyright{" "}
            <a
              href="https://vault.hyperiux.com"
              target="_blank"
              rel="noopener noreferrer"
              className="under-multi focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]"
            >
              © Elena Voss Design
            </a>{" "}
            {year}
          </p>
          <p>
            By:{" "}
            <a
              href="https://www.hyperiux.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="under-multi focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus)]"
            >
              Hyperiux
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}