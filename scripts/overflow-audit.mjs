/**
 * Finds horizontal overflow, and names the element causing it.
 *
 * `document.body.scrollWidth > innerWidth` only tells you *that* the page
 * overflows. This walks every element and reports the ones whose right/left edge
 * escapes the viewport, so the fix can target the real culprit instead of being
 * papered over with `overflow-x: hidden`.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PATHS = (process.env.PATHS ?? "/,/questions,/articles").split(",");
const WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024, 1440];

const browser = await chromium.launch();
let failures = 0;

for (const path of PATHS) {
  console.log(`\n${"=".repeat(58)}\n${path}\n${"=".repeat(58)}`);

  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: 800 },
      deviceScaleFactor: 2,
      isMobile: width < 768,
      hasTouch: width < 768,
      userAgent:
        width < 768
          ? "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
          : undefined,
    });

    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(400);

    const report = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const scrollW = Math.max(doc.scrollWidth, document.body.scrollWidth);
      const overflows = scrollW > vw + 1;

      // Which elements actually poke outside the viewport?
      const culprits = [];
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // RTL: an element can escape on either side.
        const overRight = r.right > vw + 1;
        const overLeft = r.left < -1;
        if (!overRight && !overLeft) continue;

        const cs = getComputedStyle(el);
        if (cs.position === "fixed") continue; // fixed bars don't create scroll

        culprits.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? "").slice(0, 70),
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width),
          text: (el.textContent ?? "").trim().slice(0, 40),
          childCount: el.children.length,
        });
      }

      // The deepest offenders are the real cause; ancestors just inherit it.
      const leaves = culprits.filter((c) => c.childCount === 0);

      return {
        scrollW,
        overflows,
        total: culprits.length,
        leaves: leaves.slice(0, 5),
        firstFew: culprits.slice(0, 3),
      };
    }, width);

    const bad = report.overflows;
    if (bad) failures++;

    console.log(
      `  ${bad ? "✘" : "✔"} ${String(width).padEnd(5)} scrollWidth=${report.scrollW}` +
        (bad ? `  (overflow +${report.scrollW - width}px, ${report.total} elements escape)` : ""),
    );

    if (bad) {
      const show = report.leaves.length ? report.leaves : report.firstFew;
      for (const c of show) {
        console.log(
          `        <${c.tag}> l=${c.left} r=${c.right} w=${c.w}  "${c.text}"\n           class="${c.cls}"`,
        );
      }
    }

    await page.close();
  }
}

await browser.close();
console.log(`\n${failures === 0 ? "PASS — no horizontal overflow anywhere" : `FAIL — ${failures} viewport(s) overflow`}\n`);
process.exit(failures ? 1 : 0);
