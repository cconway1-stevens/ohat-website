// Generates responsive copies of the site's photographs.
//
// A static export cannot use the Worker's image optimizer, and Next's
// `unoptimized` escape hatch ships one full-size file to every device — a
// phone downloading the 2004px hero. Instead the build pre-renders a width
// ladder here and `image-loader.mjs` points `next/image` at it, so the normal
// srcset behaviour works on a plain static host.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "public/media";
const OUT_DIR = "public/media/rs";
// 768px closely matches Lighthouse's 412px mobile viewport at its emulated
// device pixel ratio. Previously that phone had to take the 828px copy. The
// smaller rungs also avoid sending a 640px photo to narrow, low-DPR screens.
const WIDTHS = [384, 512, 640, 768, 828, 1200, 1600, 1920];
const RESPONSIVE_EXTENSION = "avif";

// Small brand assets are used at fixed sizes, so a responsive ladder would be
// needless markup. Generate compact modern-format copies at build time.
await sharp(join(SOURCE_DIR, "logo-transparent.png"))
  .avif({ quality: 60, effort: 6 })
  .toFile(join(SOURCE_DIR, "logo-transparent.avif"));

await sharp(join(SOURCE_DIR, "ase-certified.jpg"))
  .resize(70, 52, { fit: "contain", background: "white" })
  .webp({ quality: 78, effort: 6 })
  .toFile(join(SOURCE_DIR, "ase-certified.webp"));

const sources = readdirSync(SOURCE_DIR).filter((file) => /\.(jpe?g|png)$/i.test(file));

mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};
for (const name of sources) {
  const path = join(SOURCE_DIR, name);
  let width;
  try {
    ({ width } = await sharp(path).metadata());
  } catch {
    continue;
  }
  const stem = name.replace(/\.[^.]+$/, "");
  const available = [];
  for (const w of WIDTHS) {
    if (w >= width) continue;
    const out = join(OUT_DIR, `${stem}-${w}.${RESPONSIVE_EXTENSION}`);
    if (!existsSync(out)) {
      await sharp(path).resize(w).avif({ quality: 50, effort: 5 }).toFile(out);
    }
    available.push(w);
  }
  if (available.length) {
    manifest[`/media/${name}`] = {
      stem,
      widths: available,
      full: width,
      extension: RESPONSIVE_EXTENSION,
    };
  }
}

writeFileSync("src/lib/image-manifest.json", `${JSON.stringify(manifest)}\n`);

console.log(
  `Responsive variants ready for ${Object.keys(manifest).length} images (${WIDTHS.join(", ")}px).`,
);
