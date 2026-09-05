import { chromium } from 'playwright';
const base = 'http://localhost:5174';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto(base + '/contact', { waitUntil: 'networkidle' });
const info = await page.evaluate(() => {
  const wrap = document.querySelector('.contact-hours-card .shop-hours-status-wrap');
  const status = document.querySelector('.contact-hours-card .shop-hours-status');
  const card = document.querySelector('.contact-hours-card');
  const cw = getComputedStyle(wrap);
  const cs = getComputedStyle(status);
  const cc = getComputedStyle(card);
  return {
    cardWidth: cc.width,
    wrapDisplay: cw.display,
    wrapWidth: cw.width,
    wrapJustifySelf: cw.justifySelf,
    wrapAlignSelf: cw.alignSelf,
    statusFlexGrow: cs.flexGrow,
    statusFlexBasis: cs.flexBasis,
    statusWidth: cs.width,
    statusFlexShrink: cs.flexShrink,
    statusAlignSelf: cs.alignSelf,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
