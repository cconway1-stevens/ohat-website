import { chromium } from 'playwright';
const base = 'http://localhost:5174';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(base + '/contact', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const el = document.querySelector('.contact-hours-card .shop-hours-status');
  if (!el) return 'not found';
  const cs = getComputedStyle(el);
  return {
    display: cs.display,
    width: cs.width,
    padding: cs.padding,
    borderRadius: cs.borderRadius,
    borderWidth: cs.borderWidth,
    boxShadow: cs.boxShadow,
    classList: el.className,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
