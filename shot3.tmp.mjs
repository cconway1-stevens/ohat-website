import { chromium } from "playwright";
const dir="/tmp/claude-0/-home-user-ohat-website/d239a15d-8c25-516a-b784-3a2127b9b953/scratchpad";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto("http://localhost:8899/contact/index.html", { waitUntil:"networkidle" });
await p.waitForTimeout(600);
const f = await p.$(".site-footer");
await f.screenshot({ path:`${dir}/footer.png` });
const cols = await p.evaluate(()=>[...document.querySelectorAll(".footer-grid > div")].map((d,i)=>{
  const r=d.getBoundingClientRect(); return {col:i+1, left:Math.round(r.left), w:Math.round(r.width), h:Math.round(r.height)};}));
console.table(cols);
await b.close();
