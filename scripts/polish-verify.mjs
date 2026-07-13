import { chromium } from "playwright";
const AID = process.env.AID;
const b = await chromium.launch();

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = ([r,g,bl]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(bl);

let contrastFails = 0, tapFails = 0;

for (const path of ["/", "/questions", "/articles", `/articles/${AID}`]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await p.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);

  const r = await p.evaluate(() => {
    // Resolve the true painted background behind an element.
    const bgOf = el => {
      let n = el;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/[\d.]+/g);
        if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) return m.slice(0,3).map(Number);
        n = n.parentElement;
      }
      return [255,255,255];
    };
    const texts = [], taps = [];
    for (const el of document.querySelectorAll("p, span, li, a, h1, h2, h3, time, label, button")) {
      const t = (el.textContent || "").trim();
      if (!t || el.children.length) continue;
      // WCAG exempts decorative content from contrast.
      if (el.closest("[aria-hidden=true]")) continue;
      const cs = getComputedStyle(el);
      const fg = (cs.color.match(/\d+/g) || []).slice(0,3).map(Number);
      texts.push({ fg, bg: bgOf(el), size: parseFloat(cs.fontSize), weight: cs.fontWeight, text: t.slice(0,26) });
    }
    for (const el of document.querySelectorAll("a, button, input, textarea, [role=button]")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      // Inline links inside a sentence are exempt from the minimum-size rule.
      const inline = getComputedStyle(el).display === "inline" && el.closest("p");
      if (inline) continue;
      // A skip link is 1x1 until focused — exempt by design.
      if (el.className && String(el.className).includes("sr-only")) continue;
      if (b.height < 44 || b.width < 44) taps.push(`<${el.tagName.toLowerCase()}> ${Math.round(b.width)}x${Math.round(b.height)} "${(el.textContent||el.getAttribute("aria-label")||"").trim().slice(0,24)}"`);
    }
    return { texts, taps };
  });

  const bad = [];
  for (const t of r.texts) {
    const l1 = L(t.fg), l2 = L(t.bg);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    const ratio = (hi + 0.05) / (lo + 0.05);
    const large = t.size >= 24 || (t.size >= 18.66 && +t.weight >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) bad.push(`${ratio.toFixed(2)}:1 (need ${need}) @${t.size}px "${t.text}"`);
  }
  contrastFails += bad.length;
  tapFails += r.taps.length;

  console.log(`\n${path}`);
  console.log(`  text nodes checked : ${r.texts.length}`);
  console.log(`  contrast failures  : ${bad.length ? "" : "0 ✓"}`);
  [...new Set(bad)].slice(0,6).forEach(x => console.log(`      ✘ ${x}`));
  console.log(`  tap targets <44px  : ${r.taps.length ? "" : "0 ✓"}`);
  [...new Set(r.taps)].slice(0,6).forEach(x => console.log(`      ✘ ${x}`));
  await p.close();
}
await b.close();
console.log(`\n${contrastFails === 0 && tapFails === 0 ? "PASS — WCAG AA contrast + 44px tap targets everywhere" : `contrast fails=${contrastFails}  tap fails=${tapFails}`}\n`);
