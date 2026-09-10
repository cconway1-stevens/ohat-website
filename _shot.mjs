import { chromium } from "playwright";

const S = process.argv[2];
const browser = await chromium.launch();

async function open(page, slug) {
  await page.goto(`http://localhost:5174/services/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  for (const label of ["Use essential services only", "Accept all optional services"]) {
    const b = page.getByRole("button", { name: label });
    if (await b.count()) {
      await b.first().click();
      break;
    }
  }
  await page.waitForTimeout(600);
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await open(desktop, "recall-work");
await desktop.locator("#service-resources").screenshot({ path: `${S}/resources.png` });
await desktop.locator(".service-panel-related").screenshot({ path: `${S}/related2.png` });
console.log(
  "nav:",
  (await desktop.locator(".service-detail-nav nav a").allTextContents()).join(" | "),
);

const mobile = await browser.newPage({ viewport: { width: 390, height: 900 } });
await open(mobile, "brake-repair");
await mobile.screenshot({ path: `${S}/mobile.png`, fullPage: false });
await mobile.locator("#service-questions").screenshot({ path: `${S}/mobile-faq.png` });

// horizontal overflow check
for (const [name, page] of [
  ["desktop", desktop],
  ["mobile", mobile],
]) {
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`${name} horizontal overflow: ${over}px`);
}
await browser.close();
