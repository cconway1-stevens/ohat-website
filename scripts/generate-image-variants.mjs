// Generates responsive copies of the site's photographs.
//
// A static export cannot use the Worker's image optimizer, and Next's
// `unoptimized` escape hatch ships one full-size file to every device — a
// phone downloading the 2004px hero. Instead the build pre-renders a width
// ladder here and `image-loader.mjs` points `next/image` at it, so the normal
// srcset behaviour works on a plain static host.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";

const SOURCE_DIR = "public/media";
const OUT_DIR = "public/media/rs";
const WIDTHS = [640, 828, 1200, 1920];

const sources = readdirSync(SOURCE_DIR).filter((file) =>
  /\.(jpe?g|png)$/i.test(file),
);

mkdirSync(OUT_DIR, { recursive: true });

// Pillow is available in the build image; shelling out keeps this script free
// of a node image dependency.
const python = `
import json, os, sys
from PIL import Image

widths = ${JSON.stringify(WIDTHS)}
manifest = {}
for name in ${JSON.stringify(sources)}:
    path = os.path.join(${JSON.stringify(SOURCE_DIR)}, name)
    try:
        im = Image.open(path)
    except Exception:
        continue
    stem = os.path.splitext(name)[0]
    available = []
    for w in widths:
        if w >= im.width:
            continue
        out = os.path.join(${JSON.stringify(OUT_DIR)}, f"{stem}-{w}.jpg")
        if not os.path.exists(out):
            copy = im.convert("RGB")
            copy = copy.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            copy.save(out, "JPEG", quality=78, optimize=True, progressive=True)
        available.append(w)
    if available:
        manifest[f"/media/{name}"] = {"stem": stem, "widths": available, "full": im.width}
print(json.dumps(manifest))
`;

const manifest = execFileSync("python3", ["-c", python], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
}).trim();

writeFileSync("lib/image-manifest.json", `${manifest}\n`);

const count = Object.keys(JSON.parse(manifest)).length;
console.log(`Responsive variants ready for ${count} images (${WIDTHS.join(", ")}px).`);
