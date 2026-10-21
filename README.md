# Portfolio Template

A single-page, scroll-driven portfolio built on Next.js 16, Tailwind v4, GSAP 3 and
shadcn/ui. Structure, palette and motion follow the
[Elena Voss reference](https://elena-voss-portfolio-template-v3.21st.app/).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static output
```

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Cache Components) |
| Styling | Tailwind CSS v4 (`@theme inline` tokens) |
| Animation | GSAP 3.15 — ScrollTrigger + SplitText |
| Smooth scroll | Lenis, driven off `gsap.ticker` |
| UI primitives | shadcn/ui (Button, Radix Accordion) |

---

## Making it yours

### 1. Copy — `src/lib/data.ts`

Every string on the site lives in one file. Swap values, keep the shapes.
No section hardcodes copy.

### 2. Images

All artwork is local under `public/` — the template has **zero external image
dependencies**, so nothing breaks when a CDN changes.

```
public/work/work-01.webp … work-04.webp    portfolio plates + hero marquee
public/hero/hero-main.webp                hero artwork
public/avatars/avatar-01.webp … 05.webp   testimonial portraits
public/clients/client-1.webp … 06.webp    client wordmarks
public/social/*.svg                       social marks
public/elena-voss.svg                     wordmark
public/fonts/host-grotesk.woff2           display face
public/og-image.webp                      social card
```

Re-download the reference set with:

```bash
node scripts/fetch-reference-assets.mjs
```

Swap in your own work by overwriting these files — keep the filenames, or point
`src/lib/data.ts` at the new paths.

> **Plain `fetch` is used rather than Scrapling.** Scrapling
> ([d4vinci/Scrapling](https://github.com/d4vinci/Scrapling)) defeats bot
> protection and renders JS when scraping *HTML pages*. These are static CDN
> files served to anonymous GETs — no challenge, no session. Reach for Scrapling
> when you need the rendered DOM, not the assets.

### 3. Palette — `src/app/globals.css`

All tokens are in `:root`. The accent is one value:

```css
--accent: oklch(0.68 0.19 52);   /* the warm orange */
```

**Contrast rule you must keep.** On the saturated orange grounds (portfolio, CTA)
white text measures only **3.07:1** — fine for display type, a real AA failure for
body copy. That's why the tokens exist:

- `--on-orange-fg` → ink `#070707` at **6.79:1** — use at any size
- `--on-orange-fg-display` → white at 3.07:1 — **display sizes only (≥24px)**

Swap the palette without breaking this and you'll ship an inaccessible site.

### 4. Typeface

**Host Grotesk**, self-hosted from `public/fonts/host-grotesk.woff2` via
`next/font/local`. The Fontshare-hosted version can't be used directly — its
CSS endpoint returns an empty body to server-side requests, so anything relying
on a Fontshare `<link>` renders in the fallback face whenever the CDN is slow,
blocked, or offline. `next/font/local` preloads and self-hosts, so there's no
runtime dependency.

Mono (JetBrains Mono, via `next/font/google`) is used only for small meta
labels. Swap either in `src/app/layout.tsx`.

### 5. CSS gotchas worth knowing

Two Tailwind v4 traps are already fixed here — don't reintroduce them:

1. **Never name a `:root` token the same as its `@theme inline` mapping.**
   `--text-hero: var(--text-hero)` is circular: it resolves to nothing, the
   utility never generates, and every heading silently falls back to the
   browser default. Raw tokens are prefixed (`--type-*`, `--font-brand-*`) to
   keep the two name spaces disjoint.

2. **Font size must not use the `text-*` prefix.** Tailwind's `text-*` namespace
   carries *both* colour and font-size, so `text-meta` and `text-fg-faint` in
   one class string collide inside `tailwind-merge` and one of them is dropped.
   All sizing here uses `[font-size:var(--type-*)]`, which is unambiguous.

---

## Architecture notes

### Animation lifecycle

All GSAP work goes through two hooks in `src/components/gsap/use-gsap.ts`:

| Hook | Use when |
|---|---|
| `useGsap(build, deps)` | Simple scroll-in reveals. Skips work entirely under reduced motion. |
| `useGsapMatchMedia(build, deps)` | Anything that differs by breakpoint or motion preference. |

Both wrap work in a context that is **reverted on unmount**. A raw
`useEffect` + `gsap.to()` leaks tweens and ScrollTriggers on every route change
and on React StrictMode's double-mount — which surfaces as elements stuck at
`opacity: 0` that never come back.

Rules to follow when adding animation:

- **Never** create tweens outside these hooks.
- `gsap.context()` **discards its callback's return value** — capture cleanup in
  a closure variable, don't read it back off the context.
- Don't nest `gsap.context()` inside a `gsap.matchMedia()` callback; the
  matchMedia cleanup can't see it and it will leak.
- Split text **after** `document.fonts.ready` — fonts decide line breaks, so
  splitting first leaves masks wrapped in the wrong place.
- Use `gsap.set()` when clearing a pre-existing inline state, not `gsap.from()`
  with the same properties. `gsap.from` tweens *to* the values you pass, which
  is the opposite of what "un-hide this" means.

### Responsive behaviour

The two pinned sections are **desktop-only by design**:

- **Hero** (300vh) — pinned at all sizes; the scrubbed headline reveal is the point.
- **Portfolio** (360vh) — sticky only at `lg+`. Below that it renders as a
  stacked list, because the pinned layout cannot fit a heading + timeline +
  image stack into `100svh` on a phone.

Any scroll-driven section must have a non-scroll fallback. The portfolio branch
explicitly clears the inline `opacity: 0` on plates 2–4 — without that, a
reduced-motion or mobile visitor silently loses three of four projects.

### Accessibility

- Skip link → `#portfolio`
- `:focus-visible` ring, instant (never animated), warm `#FFD9B8` on dark
  grounds / ink on light — `globals.css`
- `overflow-x: clip` on `html` and `body` (not `hidden`, which breaks sticky)
- `overflow-wrap: anywhere` on headings and body so long words can't blow out
  the grid
- Marquee is `aria-hidden` with a visually-hidden `<ul>` announcing each client
  once, rather than twice
- SplitText runs with `aria: "auto"`, so screen readers hear a sentence, not
  letters
- `prefers-reduced-motion: reduce` disables Lenis, skips GSAP construction, and
  collapses transitions to a ≤150 ms opacity change

---

## ⚠️ Demo content

The person, studio, projects, awards, clients and testimonials in
`src/lib/data.ts` are **fictional placeholder data** from the reference design.
They exist to show the layout working, not to make claims.

Before this goes anywhere public, replace:

- the Awwwards / Webby / FWA badges
- the client wordmarks
- the testimonials and their attributions
- the email, location, and social links

Invented credentials and fake client relationships are the first thing a
reviewer checks, and they are the fastest way to get a portfolio dismissed.

---

## Project layout

```
scripts/gen-assets.mjs        generates placeholder SVG artwork
src/
  app/
    layout.tsx                fonts, metadata, Lenis+GSAP provider
    globals.css               design tokens, base, a11y, keyframes
    page.tsx                  section composition
  components/
    gsap/
      gsap-config.ts          plugin registration, shared easings
      use-gsap.ts             useGsap / useGsapMatchMedia
      split-reveal.tsx        masked line/word reveals
    providers/
      smooth-scroll-provider.tsx
    sections/                 header, hero, portfolio, content,
                              social-proof, faq, footer
    ui/                       shadcn button, accordion
  lib/
    data.ts                   ← all copy
    utils.ts
```