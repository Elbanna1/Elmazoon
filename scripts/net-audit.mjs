import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const AID = process.env.AID;
const b = await chromium.launch();

for (const path of ["/", "/questions", "/articles", `/articles/${AID}`]) {
  const page = await b.newPage({ viewport: { width: 390, height: 800 }, isMobile: true });
  const reqs = [];
  const errors = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/") || u.includes("elmazoon.runasp") || u.includes("/uploads/")) reqs.push(`${r.method()} ${u.replace(BASE, "")}`);
  });
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 90)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 90)));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().replace(BASE, "").slice(0, 70)}`); });

  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);

  const counts = reqs.reduce((m, r) => ((m[r] = (m[r] || 0) + 1), m), {});
  const dupes = Object.entries(counts).filter(([, n]) => n > 1);

  console.log(`\n${path}`);
  console.log(`  API/asset requests : ${reqs.length}`);
  for (const [r, n] of Object.entries(counts)) console.log(`     ${n}x  ${r}`);
  console.log(`  duplicates         : ${dupes.length ? dupes.map(([r, n]) => `${r} (${n}x)`).join(", ") : "none ✓"}`);
  console.log(`  console/network errors: ${errors.length ? "" : "none ✓"}`);
  errors.slice(0, 5).forEach((e) => console.log(`     ✘ ${e}`));
  await page.close();
}
await b.close();
