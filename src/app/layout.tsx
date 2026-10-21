import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { site } from "@/lib/data";

/**
 * Host Grotesk — the reference template's actual typeface, self-hosted.
 *
 * The Fontshare-hosted version can't be used directly: its CSS endpoint returns
 * an empty body to server-side requests, so anything depending on a Fontshare
 * <link> renders in the fallback face whenever the CDN is slow, blocked, or
 * offline. next/font/local also generates the @font-face with
 * `font-display: swap` and a preloaded copy, so there is no runtime dependency.
 *
 * `adjustFontFallback` is off because the synthetic-metrics fallback shifts
 * baselines on a display face this large — the swap flash is the lesser evil.
 */
const hostGrotesk = localFont({
  src: "../../public/fonts/host-grotesk.woff2",
  display: "swap",
  variable: "--font-instrument",
  weight: "100 900",
  style: "normal",
  preload: true,
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

/**
 * Mono is used only for small meta labels (years, indices, kickers) so the
 * technical layer reads as annotation rather than body copy. Google Fonts is
 * fine here — its CSS endpoint is server-accessable, unlike Fontshare's.
 */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-jb",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description:
    "Independent creative web designer specialising in brand identity, motion design and front-end build.",
  openGraph: {
    type: "website",
    title: `${site.name} — ${site.role}`,
    description:
      "Independent creative web designer specialising in brand identity, motion design and front-end build.",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: `${site.name} — ${site.role}` }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hostGrotesk.variable} ${mono.variable}`}>
      <body className="antialiased">
        {/*
          Marks the document as script-capable before any content is parsed.

          Anything that needs to start in a "pre-animation" state — the hero
          artwork is the only one — is gated on `html.js` in globals.css, so it
          is hidden for scripted visitors and left visible for everyone else.
          Gating on a class rather than setting the state from an effect is what
          avoids a flash: hydration finishes well after the browser has painted
          the server HTML, so anything applied from useEffect is seen and then
          undone.

          It has to be inline and un-deferred to run at parse time, and it has to
          live in <body> because an element cannot take both children and
          dangerouslySetInnerHTML.
        */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/*
          Smooth scroll + the GSAP ticker both live in one client provider so
          the rAF clocks cannot drift apart. Nothing renders here.
        */}
        <SmoothScrollProvider />
        {children}
      </body>
    </html>
  );
}