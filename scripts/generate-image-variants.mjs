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
const WIDTHS = [640, 828, 1200, 1920];

const sources = readdirSync(SOURCE_DIR).filter((file) =>
  /\.(jpe?g|png)$/i.test(file),
);

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
    const out = join(OUT_DIR, `${stem}-${w}.jpg`);
    if (!existsSync(out)) {
      await sharp(path)
        .resize(w)
        .jpeg({ quality: 78, progressive: true, mozjpeg: true })
        .toFile(out);
    }
    available.push(w);
  }
  if (available.length) {
    manifest[`/media/${name}`] = { stem, widths: available, full: width };
  }
}

writeFileSync("lib/image-manifest.json", `${JSON.stringify(manifest)}\n`);

console.log(
  `Responsive variants ready for ${Object.keys(manifest).length} images (${WIDTHS.join(", ")}px).`,
);
