import { chromium } from "playwright";
const b = await chromium.launch();
const AID = process.env.AID;

for (const path of ["/", "/questions", "/articles", `/articles/${AID}`]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await p.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);

  const r = await p.evaluate(() => {
    const issues = [];

    // Touch targets under 44px
    const small = [];
    for (const el of document.querySelectorAll("a, button, input, select, textarea, [role=button]")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.height < 40 || b.width < 40) {
        small.push(`<${el.tagName.toLowerCase()}> ${Math.round(b.width)}x${Math.round(b.height)} "${(el.textContent||el.getAttribute("aria-label")||"").trim().slice(0,22)}"`);
      }
    }
    if (small.length) issues.push({ kind: "touch-target <40px", items: [...new Set(small)].slice(0, 6) });

    // Buttons/links with no accessible name
    const unnamed = [];
    for (const el of document.querySelectorAll("a, button")) {
      const name = (el.textContent || "").trim() || el.getAttribute("aria-label") || el.getAttribute("title");
      if (!name) unnamed.push(el.outerHTML.slice(0, 60));
    }
    if (unnamed.length) issues.push({ kind: "no accessible name", items: unnamed.slice(0, 5) });

    // Images without alt
    const noAlt = [...document.querySelectorAll("img")].filter(i => !i.hasAttribute("alt"));
    if (noAlt.length) issues.push({ kind: "img without alt", items: noAlt.map(i=>i.src.slice(0,50)) });

    // Headings order
    const hs = [...document.querySelectorAll("h1,h2,h3,h4")].map(h => +h.tagName[1]);
    let skips = 0, prev = 0;
    for (const l of hs) { if (prev && l > prev + 1) skips++; prev = l; }
    if (skips) issues.push({ kind: "heading skip", items: [`${skips} skip(s)`] });

    // Contrast-ish: text on background that is too light (ink-300 on white)
    const faint = [];
    for (const el of document.querySelectorAll("p, span, li, a")) {
      const cs = getComputedStyle(el);
      const c = cs.color.match(/\d+/g);
      if (!c) continue;
      const [r,g,bl] = c.map(Number);
      const lum = (0.2126*r + 0.7152*g + 0.0722*bl) / 255;
      const size = parseFloat(cs.fontSize);
      if (lum > 0.62 && size < 16 && (el.textContent||"").trim()) {
        faint.push(`${cs.color} @${size}px "${(el.textContent||"").trim().slice(0,26)}"`);
      }
    }
    if (faint.length) issues.push({ kind: "low-contrast small text", items: [...new Set(faint)].slice(0, 5) });

    return issues;
  });

  console.log(`\n${path}`);
  if (!r.length) console.log("  ✔ nothing flagged");
  for (const i of r) {
    console.log(`  ⚠ ${i.kind}`);
    i.items.forEach(x => console.log(`      ${x}`));
  }
  await p.close();
}
await b.close();
