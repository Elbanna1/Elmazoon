import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const browser = await chromium.launch();

for (const width of [1024, 1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('almaazoon:welcome-seen', '1'));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const r = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="التنقل الرئيسي"]');
    const kids = [...nav.children];
    const used = kids.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    const gaps = (kids.length - 1) * 16;
    const inner = nav.clientWidth - 40; // px-5 ≈ 20 each side (lg:px-8 → 32)
    const links = [...nav.querySelectorAll('ul a')].map((a) => ({
      t: a.innerText.trim().slice(0, 20),
      w: Math.round(a.getBoundingClientRect().width),
    }));
    return {
      navWidth: Math.round(nav.clientWidth),
      contentWidth: Math.round(used + gaps),
      inner: Math.round(inner),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      wraps: nav.scrollHeight > nav.clientHeight + 1,
      links,
    };
  });

  console.log(
    `${width}px  nav=${r.navWidth}  content=${r.contentWidth}  headroom=${r.inner - r.contentWidth}px  overflow=${r.overflow}  wraps=${r.wraps}`
  );
  console.log('        ' + r.links.map((l) => `${l.t}:${l.w}`).join('  '));
  await context.close();
}

await browser.close();
