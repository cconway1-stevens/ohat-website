import { constants, existsSync, accessSync } from "node:fs";
import { delimiter, join } from "node:path";

function isExecutable(file) {
  if (!file || !existsSync(file)) return false;
  try {
    accessSync(file, process.platform === "win32" ? constants.F_OK : constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function pathCandidates() {
  const names =
    process.platform === "win32"
      ? ["chrome.exe", "msedge.exe", "chromium.exe"]
      : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"];
  return (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((dir) => names.map((name) => join(dir, name)));
}

function systemCandidates() {
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
  }
  if (process.platform === "win32") {
    const roots = [
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
      process.env.LOCALAPPDATA,
    ];
    return roots
      .filter(Boolean)
      .flatMap((root) => [
        join(root, "Google", "Chrome", "Application", "chrome.exe"),
        join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
      ]);
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ];
}

function browserSetupMessage(details = "No usable Chromium executable was found.") {
  return (
    `${details}\n` +
    "Set CHROMIUM_PATH to an installed Chrome/Chromium executable, or run:\n" +
    "  ./node_modules/.bin/playwright install chromium\n" +
    "Then verify it with: npm run check:browser:preflight"
  );
}

function resolveChromiumExecutable(chromium) {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit) {
    if (isExecutable(explicit)) return explicit;
    throw new Error(browserSetupMessage(`CHROMIUM_PATH is not executable: ${explicit}`));
  }

  const candidates = [
    chromium.executablePath(),
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    ...systemCandidates(),
    ...pathCandidates(),
  ];
  const executable = [...new Set(candidates)].find(isExecutable);
  if (!executable) throw new Error(browserSetupMessage());
  return executable;
}

export async function launchChromium(options = {}) {
  const { chromium } = await import("playwright");
  const executablePath = resolveChromiumExecutable(chromium);
  return chromium.launch({ ...options, executablePath });
}

export async function verifyChromium() {
  const { chromium } = await import("playwright");
  const executablePath = resolveChromiumExecutable(chromium);
  const browser = await chromium.launch({ executablePath });
  const version = browser.version();
  await browser.close();
  return { executablePath, version };
}
