#!/usr/bin/env node
import { verifyChromium } from "./lib/browser.mjs";

try {
  const browser = await verifyChromium();
  console.log(`Browser preflight passed: Chromium ${browser.version}`);
  console.log(`  ${browser.executablePath}`);
} catch (error) {
  console.error(`Browser preflight failed:\n${error.message}`);
  process.exit(1);
}
