/**
 * Downloads the reference template's static assets into public/.
 *
 * WHY NOT SCRAPLING
 * -----------------
 * Scrapling (https://github.com/d4vinci/Scrapling) exists to defeat bot
 * protection and render JS when scraping *HTML pages*. These targets are
 * static files on a public CDN served to anonymous GET requests — no bot
 * challenge, no session, no JS. Scrapling would add a Python dependency and a
 * slower path for no benefit here. If you ever need to scrape the rendered DOM
 * itself, reach for it then.
 *
 * Run: node scripts/fetch-reference-assets.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://elena-voss-portfolio-template-v3.21st.app";

/** [remote path, local path under public/] */
const ASSETS = [
  // --- display font (Host Grotesk, the reference's actual typeface) --------
  ["/_next/static/media/3a11180d498b75c0-s.p.2028s2bhlck6k.woff2", "fonts/host-grotesk.woff2"],

  // --- brand marks ---------------------------------------------------------
  ["/_next/static/media/elena-voss.1bwgasvm4oh6t.svg", "elena-voss.svg"],
  ["/_next/static/media/footer-bg.2y6ggh6bp2suk.svg", "footer-bg.svg"],

  // --- hero ----------------------------------------------------------------
  ["/_next/static/media/hero-bg-full-img.0ymicntlhm1vj.webp", "hero/hero-main.webp"],
  ["/_next/static/media/og-image.0cl-731jabrer.webp", "og-image.webp"],

  // --- portfolio plates ---------------------------------------------------
  ["/_next/static/media/portfolio-img-1.006uvpvyjl7kz.webp", "work/work-01.webp"],
  ["/_next/static/media/portfolio-img-2.2ys49j7gkfz7j.webp", "work/work-02.webp"],
  ["/_next/static/media/portfolio-img-3.04bada5ydkt1h.webp", "work/work-03.webp"],
  ["/_next/static/media/portfolio-img-4.0wnkqlz-f5rcj.webp", "work/work-04.webp"],

  // --- testimonial portraits ----------------------------------------------
  ["/_next/static/media/testimonial-1.1n9zd7_gpp9li.webp", "avatars/avatar-01.webp"],
  ["/_next/static/media/testimonial-2.2mihuvuv56utd.webp", "avatars/avatar-02.webp"],
  ["/_next/static/media/testimonial-3.25i3vd2ma4kps.webp", "avatars/avatar-03.webp"],
  ["/_next/static/media/testimonial-4.0mqg9hibqoxgk.webp", "avatars/avatar-04.webp"],
  ["/_next/static/media/testimonial-5.1p4twu_lvqrj9.webp", "avatars/avatar-05.webp"],

  // --- client wordmarks ----------------------------------------------------
  ["/_next/static/media/clients-1.2x6o6jq8f5_bm.webp", "clients/client-1.webp"],
  ["/_next/static/media/clients-2.1l6jm5-3cnwvg.webp", "clients/client-2.webp"],
  ["/_next/static/media/clients-3.0-x8av3q__ih4.webp", "clients/client-3.webp"],
  ["/_next/static/media/clients-4.1tgn231h0a-zf.webp", "clients/client-4.webp"],
  ["/_next/static/media/clients-5.1h0spsdpfo9zr.webp", "clients/client-5.webp"],
  ["/_next/static/media/clients-6.1_xtm6aakyuxq.webp", "clients/client-6.webp"],

  // --- social --------------------------------------------------------------
  ["/_next/static/media/facebook.28b69odb44qoi.svg", "social/facebook.svg"],
  ["/_next/static/media/instagram.44_o2mpfxt9wp.svg", "social/instagram.svg"],
  ["/_next/static/media/linkedIn.3zxx2oqth41cz.svg", "social/linkedin.svg"],
  ["/_next/static/media/twitter.0pg43yq6t12uk.svg", "social/twitter.svg"],
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const root = process.cwd();
let ok = 0;
const failed = [];

for (const [remote, local] of ASSETS) {
  const dest = join(root, "public", local);
  mkdirSync(join(dest, ".."), { recursive: true });

  // Skip if already present with real bytes, so re-runs are cheap.
  if (existsSync(dest)) {
    console.log(`skip   ${local}`);
    ok++;
    continue;
  }

  try {
    const res = await fetch(ORIGIN + remote, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const type = res.headers.get("content-type") || "";
    // Guard against a soft-404 returning an HTML error page as a 200.
    if (type.includes("text/html")) throw new Error("got HTML, expected an asset");

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error(`suspiciously small (${buf.length}B)`);

    writeFileSync(dest, buf);
    console.log(`ok     ${local.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB  ${type.split(";")[0]}`);
    ok++;
  } catch (err) {
    console.log(`FAIL   ${local.padEnd(28)} ${err.message}`);
    failed.push(local);
  }
}

console.log(`\n${ok}/${ASSETS.length} downloaded.`);
if (failed.length) {
  console.log("failed:", failed.join(", "));
  process.exitCode = 1;
}