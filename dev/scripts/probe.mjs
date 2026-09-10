import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const messages = [];
page.on("console", (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => messages.push(`[pageerror] ${err.message}`));
await (async () => {
  for (let i = 0; i < 30; i++) {
    try {
      await page.goto(`${base}/links`, { waitUntil: "networkidle", timeout: 60000 });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("dev server never answered on /links");
})();
await page.waitForTimeout(2000);
console.log(`captured ${messages.length} message(s)`);
for (const m of messages) console.log(`\n${m.slice(0, 5000)}`);
await browser.close();
