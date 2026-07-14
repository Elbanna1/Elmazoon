/**
 * Verifies the three new sections against a real browser.
 *
 * Overflow is measured as documentElement.scrollWidth > clientWidth, and clipping
 * as any element inside the new sections whose box escapes the viewport — the two
 * failure modes that `overflow-x: hidden` would have hidden rather than fixed.
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

const browser = await chromium.launch();

/* ---------------- 1. responsive: overflow + clipping + RTL ---------------- */
console.log('\n[1] responsive — / at 8 widths');

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  // Suppress the welcome modal for the layout pass — it is tested on its own below.
  await page.addInitScript(() => sessionStorage.setItem('almaazoon:welcome-seen', '1'));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);

  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const out = {
      docWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      dir: doc.dir,
      clipped: [],
      missing: [],
    };

    for (const id of ['documents', 'location']) {
      const section = document.getElementById(id);
      if (!section) { out.missing.push(id); continue; }
      for (const el of section.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        // 1px of tolerance for sub-pixel rounding at DPR 2.
        if (r.left < -1 || r.right > doc.clientWidth + 1) {
          out.clipped.push(`#${id} ${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 30)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        }
      }
    }
    return out;
  });

  const tag = `${width}px`;
  if (report.missing.length) fail(`${tag} missing sections: ${report.missing.join(', ')}`);
  if (report.docWidth > report.clientWidth) {
    fail(`${tag} horizontal overflow: doc=${report.docWidth} viewport=${report.clientWidth}`);
  } else if (report.clipped.length) {
    fail(`${tag} clipping: ${report.clipped.slice(0, 3).join(' | ')}`);
  } else if (report.dir !== 'rtl') {
    fail(`${tag} dir="${report.dir}" — expected rtl`);
  } else {
    pass(`${tag} no overflow (doc=${report.docWidth}) · no clipping · dir=rtl`);
  }

  await context.close();
}

/* ---------------- 2. content ---------------- */
console.log('\n[2] content');
{
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('almaazoon:welcome-seen', '1'));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const items = await page.locator('#documents ol > li').allInnerTexts();
  const expected = [
    '١- بطاقة الزوج وثلاث صور منها.',
    '٢- بطاقة الزوجة وثلاث صور منها.',
    '٣- بطاقة وكيل الزوجة (الوالد أو الأخ أو العم أو الخال) وصورة منها.',
    '٤- ٦ صور شخصية لكل من الزوج والزوجة.',
    '٥- شهادة صحية من مستشفى حكومي أو وحدة طب أسرة.',
    '٦- إشهاد طلاق رسمي إذا كانت الزوجة مطلقة.',
    '٧- وثيقة الزواج + شهادة وفاة الزوج إذا كانت الزوجة أرملة.',
    '٨- أصل شهادة الميلاد للزوج والزوجة.',
  ];
  const got = items.map((t) => t.replace(/\s+/g, ' ').trim());
  expected.forEach((line, i) => {
    if (got[i] === line) pass(`doc ${i + 1} exact`);
    else fail(`doc ${i + 1}\n        expected: ${line}\n        got     : ${got[i]}`);
  });

  const icons = await page.locator('#documents ol > li svg').count();
  icons === 8 ? pass('8 distinct icons') : fail(`icons=${icons}, expected 8`);

  const note = (await page.locator('#documents p').last().innerText()).trim();
  note === 'يرجى التأكد من تجهيز جميع المستندات قبل موعد عقد الزواج لتسهيل إنهاء الإجراءات.'
    ? pass('highlighted note exact')
    : fail(`note: ${note}`);

  const heading = (await page.locator('#documents-heading').innerText()).trim();
  heading === 'الأوراق المطلوبة لإتمام عقد الزواج' ? pass('documents heading') : fail(`heading: ${heading}`);

  const locHeading = (await page.locator('#location-heading').innerText()).trim();
  locHeading === 'عنوان المكتب' ? pass('location heading') : fail(`heading: ${locHeading}`);

  const address = (await page.locator('#location p.ugc').innerText()).trim();
  address === 'العبور - الحي الأول - محور السادات - بجوار مدرسة معاذ بن جبل - بجوار موقف حليم.'
    ? pass('address exact')
    : fail(`address: ${address}`);

  /* Maps button */
  const btn = page.getByRole('link', { name: /فتح الموقع على خرائط Google/ });
  const href = await btn.getAttribute('href');
  const target = await btn.getAttribute('target');
  const rel = await btn.getAttribute('rel');
  const EXPECT = 'https://www.google.com/maps?q=30.235612869262695,31.46569061279297&z=17&hl=en';
  href === EXPECT ? pass('maps href exact') : fail(`maps href: ${href}`);
  target === '_blank' ? pass('maps opens in new tab') : fail(`target=${target}`);
  /noopener/.test(rel || '') ? pass(`rel="${rel}"`) : fail(`rel=${rel}`);

  /* Map iframe is lazy: absent at load, present once scrolled to. */
  const before = await page.locator('#location iframe').count();
  before === 0 ? pass('map iframe not loaded on initial paint') : fail('map iframe loaded eagerly');

  await page.locator('#location').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const after = await page.locator('#location iframe').count();
  after === 1 ? pass('map iframe mounts when scrolled into view') : fail('map iframe never mounted');

  await context.close();
}

/* ---------------- 3. modal ---------------- */
console.log('\n[3] welcome modal');
{
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  const dialog = page.getByRole('dialog');

  /* 3a. scroll trigger beats the timer */
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  (await dialog.count()) === 0 ? pass('not shown immediately') : fail('shown too early');

  await page.evaluate(() => {
    const s = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, s * 0.45);
  });
  await page.waitForTimeout(400);
  await dialog.waitFor({ state: 'visible', timeout: 3000 }).then(
    () => pass('opens at 40% scroll (before the 8s timer)'),
    () => fail('did not open on scroll'),
  );

  const title = (await dialog.getByRole('heading').innerText()).trim();
  title === 'مرحبًا بك' ? pass('title "مرحبًا بك"') : fail(`title: ${title}`);

  for (const label of ['الأوراق المطلوبة', 'عنوان المكتب', 'اسأل المأذون', 'تواصل معنا']) {
    (await dialog.getByRole('link', { name: new RegExp(label) }).count()) === 1
      ? pass(`button "${label}"`)
      : fail(`missing button "${label}"`);
  }
  (await dialog.getByRole('button', { name: 'إغلاق', exact: true }).count()) === 1
    ? pass('close button "إغلاق"')
    : fail('missing close button');
  (await dialog.getByRole('button', { name: 'إغلاق النافذة', exact: true }).count()) === 1
    ? pass('X button has a distinct accessible name')
    : fail('X button name is ambiguous');

  /* 3b. ESC closes */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  (await dialog.count()) === 0 ? pass('ESC closes') : fail('ESC did not close');

  /* 3c. once per session: reload, scroll, wait past the timer */
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(9500);
  (await dialog.count()) === 0
    ? pass('does NOT reopen after reload in the same session (8s + scroll both elapsed)')
    : fail('reopened in the same session');

  /* 3d. navigating to another page in the same session must not reopen it */
  await page.goto(`${BASE}/articles`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(9000);
  (await dialog.count()) === 0 ? pass('does NOT reopen on another page') : fail('reopened on /articles');

  await context.close();
}

/* 3e. a fresh session shows it again — via the timer this time */
{
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  const dialog = page.getByRole('dialog');
  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await dialog.waitFor({ state: 'visible', timeout: 12000 }).then(
    () => {
      const dt = Date.now() - t0;
      dt >= 7000 && dt <= 11000
        ? pass(`fresh session: opens on the 8s timer (${(dt / 1000).toFixed(1)}s, no scrolling)`)
        : fail(`timer fired at ${(dt / 1000).toFixed(1)}s`);
    },
    () => fail('never opened in a fresh session'),
  );

  /* The backdrop must actually be reachable on a short phone — if the card fills
     the screen there is nothing left to click, and "close by clicking outside"
     quietly stops existing. Click the midpoint of the gap above the card. */
  const box = await dialog.boundingBox();
  const gap = box.y;
  gap > 24
    ? pass(`backdrop reachable above the card (${Math.round(gap)}px)`)
    : fail(`card leaves only ${Math.round(gap)}px of backdrop — nothing to click`);

  await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(gap / 2));
  await page.waitForTimeout(300);
  (await dialog.count()) === 0 ? pass('outside click closes') : fail('outside click did not close');

  await context.close();
}

/* 3f. the X button, and the action buttons scroll to their sections */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const dialog = page.getByRole('dialog');

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await dialog.waitFor({ state: 'visible', timeout: 12000 });
  await dialog.getByRole('button', { name: 'إغلاق النافذة', exact: true }).click();
  await page.waitForTimeout(300);
  (await dialog.count()) === 0 ? pass('X button closes') : fail('X did not close');

  for (const [label, id] of [['الأوراق المطلوبة', 'documents'], ['عنوان المكتب', 'location'], ['تواصل معنا', 'contact']]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.getByRole('dialog').waitFor({ state: 'visible', timeout: 12000 });
    await p.getByRole('dialog').getByRole('link', { name: new RegExp(label) }).click();
    await p.waitForTimeout(1500);
    const top = await p.evaluate((i) => document.getElementById(i).getBoundingClientRect().top, id);
    Math.abs(top) < 120
      ? pass(`"${label}" scrolled #${id} into view (top=${Math.round(top)}px)`)
      : fail(`"${label}" → #${id} top=${Math.round(top)}px`);
    await ctx.close();
  }

  await context.close();
}

/* ---------------- 4. the modal itself, at every width ---------------- */
console.log('\n[4] modal — no overflow, backdrop reachable, at 8 widths');

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 727 : 800 }, // 727: a short, common phone
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 12000 });

  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const card = document.querySelector('[role="dialog"]');
    const box = card.getBoundingClientRect();
    const clipped = [...card.querySelectorAll('*')].some((el) => {
      const b = el.getBoundingClientRect();
      return b.width && (b.left < -1 || b.right > doc.clientWidth + 1);
    });
    return {
      overflow: doc.scrollWidth > doc.clientWidth,
      gap: Math.round(box.top),
      clipped,
      scrolls: card.scrollHeight > card.clientHeight + 1,
    };
  });

  const tag = `${width}px`;
  if (r.overflow) fail(`${tag} modal causes horizontal overflow`);
  else if (r.clipped) fail(`${tag} modal content clipped`);
  else if (r.gap <= 24) fail(`${tag} only ${r.gap}px of backdrop — outside-click unreachable`);
  else pass(`${tag} no overflow · backdrop ${r.gap}px · card ${r.scrolls ? 'scrolls internally' : 'fits'}`);

  await context.close();
}

await browser.close();

console.log(
  failures === 0
    ? '\nPASS — sections render, no overflow/clipping at any width, modal once per session\n'
    : `\nFAIL — ${failures} problem(s)\n`,
);
process.exit(failures === 0 ? 0 : 1);
