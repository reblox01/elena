import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Portfolio } from "@/components/sections/portfolio";
import { WorkWithMe } from "@/components/sections/work-with-me";
import { Services } from "@/components/sections/services";
import { Awards, Clients, Testimonials } from "@/components/sections/social-proof";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";

/**
 * Page composition — section order mirrors the reference exactly (hero →
 * portfolio → work-with-me → services → awards → clients → testimonials →
 * faq → footer; verified against its rendered DOM map at 1440×900).
 *
 *   hero         pinned scrub marquee, warm ground
 *   portfolio    360vh stacked-image scrub with snap
 *   work-with-me three hover-lit cards, deep ground
 *   services     275vh statement + sticky rail scrubbed horizontally
 *   awards       list with cursor-tracking preview plate
 *   clients      240vh perspective logo tunnel
 *   testimonials single card, swapped by pills
 *   faq          stacked accordion
 *   footer       closing statement + oversized mark
 */
export default function Page() {
  return (
    <>
      <a
        href="#portfolio"
        className="sr-only-focusable fixed left-[var(--gutter)] top-[var(--gutter)] z-[100] rounded-pill bg-[var(--accent)] px-5 py-2.5 [font-size:var(--type-meta)] text-[var(--ink)] no-underline"
      >
        Skip to content
      </a>

      <Header />

      <main>
        <Hero />
        <Portfolio />
        <WorkWithMe />
        <Services />
        <Awards />
        <Clients />
        <Testimonials />
        <Faq />
      </main>

      <Footer />
    </>
  );
}