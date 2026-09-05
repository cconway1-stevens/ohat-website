import { chromium } from 'playwright';
const base = 'http://localhost:5174';
const browser = await chromium.launch();

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + '/contact', { waitUntil: 'networkidle' });
const elm = mobile.locator('.contact-hours-card');
await elm.scrollIntoViewIfNeeded();
await mobile.waitForTimeout(400);
await elm.screenshot({ path: 'check-card-mobile.png' });

await browser.close();
console.log('done');
