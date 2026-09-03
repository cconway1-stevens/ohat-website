/**
 * Pixel Crew — five 8-bit NES-style auto-part characters drawn on a Canvas 2D
 * context. Each is a pure `draw(ctx, frame, emote)` function using `fillRect`
 * primitives on a 32×32 logical grid, scaled with `image-rendering: pixelated`
 * by the host. No sprite sheets, no downloads — pure code, matching the Lot
 * Defender / Shore Run arcade pattern.
 *
 * Every shape is drawn with a 1px ink outline (draw the dark version one pixel
 * larger, then the fill on top) so each part reads as the thing it is at a
 * glance. Faces sit on light-colored areas and use a wide, bold mouth so the
 * expression is visible even at small sizes.
 *
 * RETRO_CREW (bottom of file) is a separate set of cloud-bot sprites with
 * glowing `>_` terminal faces — same grid and contract, shown in the studio's
 * Retro mode. Kept out of PIXEL_CREW so the shop crew stays at five.
 *
 * PART_ICONS (also bottom of file) is a faceless set — plain auto-part icons
 * (brake rotor, piston, gear, steering wheel, bulb) with no eyes or mouth.
 * Emotes read through motion plus the corner badge, so the parts stay icons.
 */

export type PixelEmote = "idle" | "celebrate" | "thinking" | "happy" | "sleep";

/** Customizable face features, set in the studio's Character mode. */
export type PixelLook = {
  eyeSize?: "small" | "medium" | "big";
  mouth?: "smile" | "cat" | "open";
};

export type PixelCharacter = {
  id: string;
  name: string;
  blurb: string;
  /**
   * Persona metadata the chat brain auto-fills its copy from — one uniform
   * template for every sprite: `kind` slots into "I'm {name}, {kind}." and
   * `self` into "I'm just {self} — that one's beyond me."
   */
  persona: { kind: string; self: string };
  draw: (ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote, look?: PixelLook) => void;
};

const RED = "#a8161c";
const DARK_RED = "#6f0d12";
const YELLOW = "#f6bd38";
const CREAM = "#f7efd9";
const INK = "#171412";
const BLUE = "#1a7183";
const WHITE = "#ffffff";
const RUBBER = "#23262c";
const RUBBER_HI = "#454b54";
const STEEL = "#c8ccd2";
const STEEL_DK = "#7d838c";
const CASING = "#1b1d21";
const GREEN = "#2f9e5b";
const AMBER = "#e8912a";
const AMBER_DK = "#b3621a";
const AMBER_LT = "#f4b15e";
const CERAMIC = "#f4f1e8";
const CERAMIC_SH = "#cfcabb";

export const PIXEL_GRID = 32;

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Filled rect with a 1px ink outline. */
function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, INK);
  px(ctx, x, y, w, h, fill);
}

/** Filled circle. */
function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

/** Filled circle with a 1px ink outline. */
function discO(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  disc(ctx, cx, cy, r + 1, INK);
  disc(ctx, cx, cy, r, fill);
}

function blink(frame: number): boolean {
  return Math.floor(frame / 80) % 12 === 11;
}

function wobble(frame: number, amp: number): number {
  return Math.sin(frame * 0.07) * amp;
}

/** Two big eyes — white with a dark pupil and a highlight, or a closed lid. */
function eyes(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  rx: number,
  ry: number,
  open: boolean,
  size: "small" | "medium" | "big" = "medium",
) {
  const w = size === "small" ? 3 : size === "big" ? 5 : 4;
  const h = size === "small" ? 4 : size === "big" ? 6 : 5;
  if (open) {
    px(ctx, lx, ly, w, h, WHITE);
    px(ctx, lx + 1, ly + 1, Math.max(1, w - 2), h - 2, INK);
    px(ctx, lx + 1, ly + 1, 1, 1, WHITE);
    px(ctx, rx, ry, w, h, WHITE);
    px(ctx, rx + 1, ry + 1, Math.max(1, w - 2), h - 2, INK);
    px(ctx, rx + 1, ry + 1, 1, 1, WHITE);
  } else {
    px(ctx, lx, ly + Math.floor(h / 2), w, 1, INK);
    px(ctx, rx, ry + Math.floor(h / 2), w, 1, INK);
  }
}

/** A mouth in one of three styles — all bold enough to read at small sizes. */
function mouth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  style: "smile" | "cat" | "open" = "smile",
) {
  if (style === "cat") {
    // the "ω" cat mouth
    px(ctx, cx - 3, cy, 1, 1, INK);
    px(ctx, cx - 2, cy + 1, 1, 1, INK);
    px(ctx, cx - 1, cy, 1, 1, INK);
    px(ctx, cx + 1, cy, 1, 1, INK);
    px(ctx, cx + 2, cy + 1, 1, 1, INK);
    px(ctx, cx + 3, cy, 1, 1, INK);
  } else if (style === "open") {
    // an open, happy mouth
    px(ctx, cx - 2, cy, 5, 1, INK);
    px(ctx, cx - 2, cy + 1, 5, 2, DARK_RED);
    px(ctx, cx - 1, cy + 2, 3, 1, "#e88a8a");
  } else {
    // a wide, bold smile
    px(ctx, cx - 3, cy, 1, 1, INK);
    px(ctx, cx - 2, cy + 1, 5, 1, INK);
    px(ctx, cx + 3, cy, 1, 1, INK);
    px(ctx, cx - 1, cy + 2, 3, 1, INK);
  }
}

/** Rosy cheeks for extra cuteness. */
function blush(ctx: CanvasRenderingContext2D, lx: number, rx: number, y: number) {
  px(ctx, lx, y, 2, 1, "#e88a8a");
  px(ctx, rx, y, 2, 1, "#e88a8a");
}

/** The floating emote badge in the top-right corner. */
function emoteBadge(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  if (emote === "idle") return;
  ctx.save();
  const bob = Math.sin(frame * 0.15) * 0.5;
  ctx.translate(24, 3 + bob);
  if (emote === "celebrate") {
    for (let i = 0; i < 5; i++) {
      const a = frame * 0.2 + i * 1.26;
      const r = 3 + Math.sin(frame * 0.1 + i) * 0.5;
      px(ctx, Math.cos(a) * r + 3, Math.sin(a) * r + 3, 1, 1, [YELLOW, RED, BLUE, CREAM, GREEN][i]);
    }
  } else if (emote === "happy") {
    px(ctx, 2, 1, 2, 2, RED);
    px(ctx, 4, 1, 2, 2, RED);
    px(ctx, 2, 2, 4, 2, RED);
    px(ctx, 3, 4, 2, 1, RED);
  } else if (emote === "sleep") {
    ctx.fillStyle = BLUE;
    ctx.font = "8px monospace";
    ctx.fillText("z", 2, 6);
    ctx.fillText("z", 6, 3);
  } else if (emote === "thinking") {
    disc(ctx, 3, 5, 1, YELLOW);
    disc(ctx, 6, 2, 1, YELLOW);
  }
  ctx.restore();
}

function shiftY(ctx: CanvasRenderingContext2D, dy: number, draw: () => void) {
  ctx.save();
  ctx.translate(0, dy);
  draw();
  ctx.restore();
}

/* --- Tread (tire) -------------------------------------------------------- */

function drawTread(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  look: PixelLook = {},
) {
  const dy = emote === "happy" ? wobble(frame, 1.2) : wobble(frame, 0.4);
  shiftY(ctx, dy, () => {
    const spin = emote === "celebrate";
    ctx.save();
    if (spin) {
      ctx.translate(16, 19);
      ctx.rotate(frame * 0.12);
      ctx.translate(-16, -19);
    }
    // rubber ring with outline
    discO(ctx, 16, 19, 11, RUBBER);
    // chunky tread lugs around the edge
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      px(
        ctx,
        15 + Math.round(Math.cos(a) * 10),
        18 + Math.round(Math.sin(a) * 10),
        3,
        2,
        RUBBER_HI,
      );
    }
    // sidewall highlight ring
    disc(ctx, 16, 19, 9, RUBBER_HI);
    disc(ctx, 16, 19, 8, RUBBER);
    // rim
    discO(ctx, 16, 19, 7, STEEL);
    // rim spokes
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      px(ctx, 16 + Math.round(Math.cos(a) * 4), 19 + Math.round(Math.sin(a) * 4), 2, 2, STEEL_DK);
    }
    // cream face plate in the hub
    disc(ctx, 16, 19, 4, CREAM);
    // face
    eyes(ctx, 12, 16, 19, 16, !blink(frame), look.eyeSize);
    mouth(ctx, 16, 21, look.mouth);
    blush(ctx, 11, 20, 20);
    ctx.restore();
    // red shop cap across the top
    box(ctx, 10, 4, 12, 3, RED);
    px(ctx, 7, 6, 18, 2, RED);
    px(ctx, 12, 2, 8, 2, DARK_RED);
  });
  emoteBadge(ctx, frame, emote);
}

/* --- Wrenchy (wrench) ---------------------------------------------------- */

function drawWrenchy(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  look: PixelLook = {},
) {
  const sway = emote === "idle" ? wobble(frame, 0.2) : wobble(frame, 0.5);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(sway * 0.05);
  ctx.translate(-16, -16);
  // open-end jaw: a wide U shape (two arms joined at the bottom)
  box(ctx, 6, 3, 5, 9, STEEL); // left arm
  box(ctx, 21, 3, 5, 9, STEEL); // right arm
  box(ctx, 6, 10, 20, 4, STEEL); // jaw base
  px(ctx, 7, 4, 2, 6, STEEL_DK); // inner shading
  px(ctx, 23, 4, 2, 6, STEEL_DK);
  // neck
  box(ctx, 14, 14, 4, 3, STEEL);
  // handle
  box(ctx, 12, 17, 8, 9, STEEL);
  px(ctx, 13, 18, 1, 7, STEEL_DK);
  px(ctx, 18, 18, 1, 7, STEEL_DK);
  // ring end at the bottom
  discO(ctx, 16, 27, 3, STEEL);
  disc(ctx, 16, 27, 1, RUBBER);
  // face on the handle
  eyes(ctx, 13, 19, 17, 19, !blink(frame), look.eyeSize);
  mouth(ctx, 16, 23, look.mouth);
  ctx.restore();
  emoteBadge(ctx, frame, emote);
}

/* --- Volt (car battery) -------------------------------------------------- */

function drawVolt(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  look: PixelLook = {},
) {
  const pulse = emote === "idle" ? 0 : Math.sin(frame * 0.12) * 0.4;
  shiftY(ctx, pulse, () => {
    // carrying handle strap across the top
    px(ctx, 11, 6, 10, 2, INK);
    px(ctx, 11, 6, 1, 3, INK);
    px(ctx, 20, 6, 1, 3, INK);
    // + terminal post (red, left)
    box(ctx, 9, 4, 4, 4, RED);
    px(ctx, 10, 5, 2, 1, WHITE);
    // - terminal post (lead, right)
    box(ctx, 19, 4, 4, 4, STEEL_DK);
    px(ctx, 20, 5, 2, 1, WHITE);
    // dark casing
    box(ctx, 6, 9, 20, 18, CASING);
    // cell-cap strip along the top of the casing
    px(ctx, 7, 10, 18, 2, RUBBER_HI);
    // front label (where the face lives)
    box(ctx, 9, 14, 14, 10, CREAM);
    px(ctx, 9, 14, 14, 2, RED);
    // face on the label
    eyes(ctx, 11, 17, 19, 17, !blink(frame), look.eyeSize);
    mouth(ctx, 16, 21, look.mouth);
    blush(ctx, 10, 21, 20);
  });
  emoteBadge(ctx, frame, emote);
}

/* --- Drip (oil can) ------------------------------------------------------ */

function drawDrip(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  look: PixelLook = {},
) {
  const bounce =
    emote === "happy" ? Math.abs(Math.sin(frame * 0.15)) * 1.5 : Math.sin(frame * 0.06) * 0.3;
  shiftY(ctx, -bounce, () => {
    // tapered spout, up to the right
    box(ctx, 17, 8, 5, 4, AMBER_DK);
    box(ctx, 21, 5, 4, 3, AMBER_DK);
    box(ctx, 24, 3, 3, 2, STEEL_DK);
    // cap on the top-left
    box(ctx, 10, 9, 4, 3, STEEL_DK);
    // body
    box(ctx, 9, 12, 14, 15, AMBER);
    px(ctx, 9, 12, 14, 3, AMBER_DK);
    px(ctx, 9, 12, 2, 15, AMBER_LT);
    // label band (face area)
    box(ctx, 10, 18, 12, 7, CREAM);
    px(ctx, 10, 18, 12, 1, RED);
    // face on the label
    eyes(ctx, 12, 19, 18, 19, !blink(frame), look.eyeSize);
    mouth(ctx, 15, 23, look.mouth);
    // the drip, falling from the spout tip
    if (emote === "sleep" || emote === "idle") {
      const drip = (frame * 0.08) % 8;
      px(ctx, 25, 6 + Math.floor(drip), 2, 2, AMBER_DK);
    }
  });
  emoteBadge(ctx, frame, emote);
}

/* --- Sparky (spark plug) ------------------------------------------------- */

function drawSparky(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  look: PixelLook = {},
) {
  const sway = emote === "idle" ? wobble(frame, 0.2) : wobble(frame, 0.45);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(sway * 0.04);
  ctx.translate(-16, -16);
  // terminal stud (top knob)
  box(ctx, 14, 2, 4, 3, STEEL);
  // white ceramic insulator with ribs
  box(ctx, 12, 5, 8, 10, CERAMIC);
  px(ctx, 12, 7, 8, 1, CERAMIC_SH);
  px(ctx, 12, 10, 8, 1, CERAMIC_SH);
  px(ctx, 12, 13, 8, 1, CERAMIC_SH);
  // metal hex nut
  box(ctx, 10, 15, 12, 4, STEEL);
  px(ctx, 12, 15, 1, 4, STEEL_DK);
  px(ctx, 19, 15, 1, 4, STEEL_DK);
  // threaded section
  box(ctx, 13, 19, 6, 6, STEEL_DK);
  px(ctx, 13, 20, 6, 1, STEEL);
  px(ctx, 13, 22, 6, 1, STEEL);
  px(ctx, 13, 24, 6, 1, STEEL);
  // electrode + ground strap at the bottom
  px(ctx, 15, 25, 2, 3, STEEL); // center electrode
  px(ctx, 18, 25, 2, 1, STEEL_DK); // strap out
  px(ctx, 19, 25, 1, 3, STEEL_DK); // strap down
  px(ctx, 16, 27, 4, 1, STEEL_DK); // strap under
  // face on the ceramic
  eyes(ctx, 12, 7, 18, 7, !blink(frame), look.eyeSize);
  mouth(ctx, 16, 12, look.mouth);
  blush(ctx, 11, 20, 11);
  ctx.restore();
  emoteBadge(ctx, frame, emote);
}

export const PIXEL_CREW: PixelCharacter[] = [
  {
    id: "tread",
    name: "Tread",
    blurb: "The shop tire. Black rubber, bright rim, red cap — spins on a dime.",
    persona: { kind: "the shop tire", self: "a tire" },
    draw: drawTread,
  },
  {
    id: "wrenchy",
    name: "Wrenchy",
    blurb: "The go-to wrench. Open jaw up top, ring at the bottom, face on the handle.",
    persona: { kind: "the shop wrench", self: "a wrench" },
    draw: drawWrenchy,
  },
  {
    id: "volt",
    name: "Volt",
    blurb: "The car battery. Dark casing, twin posts, a handle, and a front label.",
    persona: { kind: "the shop battery", self: "a battery" },
    draw: drawVolt,
  },
  {
    id: "drip",
    name: "Drip",
    blurb: "The oil can. Tapered spout, amber body, and a drip when it's quiet.",
    persona: { kind: "the shop oil can", self: "an oil can" },
    draw: drawDrip,
  },
  {
    id: "sparky",
    name: "Sparky",
    blurb: "The spark plug. White ceramic, hex nut, threads, and the electrode gap.",
    persona: { kind: "the shop spark plug", self: "a spark plug" },
    draw: drawSparky,
  },
];

/* --- Retro cloud-bots (terminal-face sprites) ------------------------------ */

type RetroPalette = {
  cloud: string;
  cloudHi: string;
  cloudSh: string;
  screen: string;
  glow: string;
  glowDim: string;
};

const RETRO_GLOW = "#7df2e6";
const RETRO_GLOW_DIM = "#2e6b64";

const BIT_PALETTE: RetroPalette = {
  cloud: "#6d7fe8",
  cloudHi: "#9aabf7",
  cloudSh: "#4b58b8",
  screen: "#171c38",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const PICO_PALETTE: RetroPalette = {
  cloud: "#4fc48d",
  cloudHi: "#8fe6b8",
  cloudSh: "#2e9163",
  screen: "#12301f",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const DOT_PALETTE: RetroPalette = {
  cloud: "#e87fbe",
  cloudHi: "#f7a9da",
  cloudSh: "#b5518f",
  screen: "#38152c",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const CHIP_PALETTE: RetroPalette = {
  cloud: "#f0a44f",
  cloudHi: "#fcc887",
  cloudSh: "#c27327",
  screen: "#3a2612",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};

/** A 3×5 terminal chevron (`>`), optionally mirrored. */
function chevron(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, flip = false) {
  const pts = [
    [0, 0],
    [1, 1],
    [2, 2],
    [1, 3],
    [0, 4],
  ];
  for (const [dx, dy] of pts) px(ctx, flip ? x + 2 - dx : x + dx, y + dy, 1, 1, color);
}

/** Shared bot body: feet, arms, and a torso with a mini `>_` chest badge. */
function drawBotBody(ctx: CanvasRenderingContext2D, p: RetroPalette) {
  box(ctx, 12, 27, 3, 2, p.cloudSh);
  box(ctx, 17, 27, 3, 2, p.cloudSh);
  box(ctx, 9, 21, 2, 4, p.cloud);
  box(ctx, 21, 21, 2, 4, p.cloud);
  box(ctx, 12, 20, 8, 7, p.cloud);
  px(ctx, 12, 25, 8, 2, p.cloudSh);
  // mini >_ badge on the chest
  px(ctx, 13, 22, 1, 1, p.glow);
  px(ctx, 14, 23, 1, 1, p.glow);
  px(ctx, 13, 24, 1, 1, p.glow);
  px(ctx, 16, 24, 2, 1, p.glow);
}

/**
 * The bot face: a dark screen with a glowing terminal glyph. The glyph is the
 * whole expression — `>_` idles with a blinking cursor, `^_^` is happy,
 * `>_<` celebrates, `...` thinks, and the screen dims to sleep. `sy` is the
 * screen's top edge, so heads of different heights can share the face.
 */
function drawTerminalFace(
  ctx: CanvasRenderingContext2D,
  frame: number,
  emote: PixelEmote,
  p: RetroPalette,
  sy: number,
) {
  box(ctx, 9, sy, 14, 10, p.screen);
  if (emote === "celebrate") {
    chevron(ctx, 9, sy + 2, p.glow);
    px(ctx, 13, sy + 6, 3, 1, p.glow);
    chevron(ctx, 17, sy + 2, p.glow, true);
  } else if (emote === "happy") {
    px(ctx, 11, sy + 3, 1, 1, p.glow);
    px(ctx, 12, sy + 2, 1, 1, p.glow);
    px(ctx, 13, sy + 3, 1, 1, p.glow);
    px(ctx, 18, sy + 3, 1, 1, p.glow);
    px(ctx, 19, sy + 2, 1, 1, p.glow);
    px(ctx, 20, sy + 3, 1, 1, p.glow);
    px(ctx, 14, sy + 6, 4, 1, p.glow);
  } else if (emote === "thinking") {
    const dots = Math.floor(frame / 20) % 4;
    for (let i = 0; i < dots; i++) px(ctx, 11 + i * 4, sy + 4, 2, 2, p.glow);
  } else if (emote === "sleep") {
    px(ctx, 11, sy + 3, 3, 1, p.glowDim);
    px(ctx, 18, sy + 3, 3, 1, p.glowDim);
    px(ctx, 14, sy + 6, 4, 1, p.glowDim);
  } else {
    chevron(ctx, 11, sy + 2, p.glow);
    if (Math.floor(frame / 30) % 2 === 0) px(ctx, 16, sy + 6, 4, 1, p.glow);
  }
}

/** Hop/bob shared by every bot sprite. */
function botHop(frame: number, emote: PixelEmote): number {
  if (emote === "happy") return Math.abs(Math.sin(frame * 0.15)) * 2;
  if (emote === "celebrate") return Math.abs(Math.sin(frame * 0.2)) * 2.5;
  return wobble(frame, 0.5);
}

/** A cloud-headed bot running a terminal prompt on its face screen. */
function makeRetroBot(p: RetroPalette): PixelCharacter["draw"] {
  return (ctx, frame, emote) => {
    // ground shadow — stays put while the bot hops
    px(ctx, 11, 30, 10, 1, "rgba(0, 0, 0, 0.3)");
    shiftY(ctx, -botHop(frame, emote), () => {
      drawBotBody(ctx, p);
      // fluffy cloud head — ink silhouette first, then the fill lumps
      const lumps: [number, number, number][] = [
        [16, 8, 5],
        [10, 10, 4],
        [22, 10, 4],
        [7, 14, 3],
        [25, 14, 3],
        [16, 14, 7],
      ];
      for (const [cx, cy, r] of lumps) disc(ctx, cx, cy, r + 1, INK);
      for (const [cx, cy, r] of lumps) disc(ctx, cx, cy, r, p.cloud);
      // bottom shade + top highlights
      px(ctx, 10, 19, 12, 1, p.cloudSh);
      px(ctx, 12, 20, 8, 1, p.cloudSh);
      px(ctx, 12, 5, 2, 1, p.cloudHi);
      px(ctx, 19, 4, 2, 1, p.cloudHi);
      drawTerminalFace(ctx, frame, emote, p, 9);
    });
    emoteBadge(ctx, frame, emote);
  };
}

export const RETRO_CREW: PixelCharacter[] = [
  {
    id: "bit",
    name: "Bit",
    blurb: "The original cloud-bot. Boots straight into a terminal and never logs off.",
    persona: { kind: "the original cloud-bot", self: "the original cloud-bot" },
    draw: makeRetroBot(BIT_PALETTE),
  },
  {
    id: "pico",
    name: "Pico",
    blurb: "The mint build. Compiles fast, blinks the cursor faster.",
    persona: { kind: "the mint cloud-bot", self: "the mint cloud-bot" },
    draw: makeRetroBot(PICO_PALETTE),
  },
  {
    id: "dot",
    name: "Dot",
    blurb: "The pink build. Ships pixel-perfect sprites on the first try.",
    persona: { kind: "the pink cloud-bot", self: "the pink cloud-bot" },
    draw: makeRetroBot(DOT_PALETTE),
  },
  {
    id: "chip",
    name: "Chip",
    blurb: "The amber build. Runs warm and beeps happily under load.",
    persona: { kind: "the amber cloud-bot", self: "the amber cloud-bot" },
    draw: makeRetroBot(CHIP_PALETTE),
  },
];

/* --- Tire bots (retro bot body, tire head) --------------------------------- */

type TirePalette = RetroPalette & {
  /** Sidewall accent ring — whitewall white, redline red, etc. */
  ring: string;
  /** Set false for racing slicks (no tread lugs). */
  lugs?: boolean;
};

const TORQUE_PALETTE: TirePalette = {
  cloud: "#23262c",
  cloudHi: "#454b54",
  cloudSh: "#14161a",
  ring: "#7d838c",
  screen: "#101318",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const WHITEWALL_PALETTE: TirePalette = {
  cloud: "#23262c",
  cloudHi: "#454b54",
  cloudSh: "#14161a",
  ring: "#e8e6df",
  screen: "#101318",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const BLAZE_PALETTE: TirePalette = {
  cloud: "#23262c",
  cloudHi: "#454b54",
  cloudSh: "#14161a",
  ring: "#c8232c",
  screen: "#101318",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
};
const SLICK_PALETTE: TirePalette = {
  cloud: "#23262c",
  cloudHi: "#454b54",
  cloudSh: "#14161a",
  ring: "#3a7bd5",
  screen: "#101318",
  glow: RETRO_GLOW,
  glowDim: RETRO_GLOW_DIM,
  lugs: false,
};

/**
 * The tire theme combined onto the retro-bot body: same torso, arms, feet,
 * and terminal face — but the head is a tire. A rubber ring with tread lugs
 * and a sidewall accent ring (whitewall, redline, …) around the hub, where
 * the glowing `>_` screen lives.
 */
function makeTireBot(p: TirePalette): PixelCharacter["draw"] {
  return (ctx, frame, emote) => {
    px(ctx, 11, 30, 10, 1, "rgba(0, 0, 0, 0.3)");
    shiftY(ctx, -botHop(frame, emote), () => {
      drawBotBody(ctx, p);
      // tire head — rubber ring with an ink outline
      discO(ctx, 16, 12, 10, p.cloud);
      // tread lugs around the edge
      if (p.lugs !== false) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          px(
            ctx,
            15 + Math.round(Math.cos(a) * 9),
            11 + Math.round(Math.sin(a) * 9),
            3,
            2,
            p.cloudHi,
          );
        }
      }
      // sidewall accent ring
      disc(ctx, 16, 12, 8, p.ring);
      disc(ctx, 16, 12, 7, p.cloud);
      drawTerminalFace(ctx, frame, emote, p, 7);
    });
    emoteBadge(ctx, frame, emote);
  };
}

export const TIRE_BOTS: PixelCharacter[] = [
  {
    id: "torque",
    name: "Torque",
    blurb: "The blackwall classic. Grips the road, grips the prompt.",
    persona: { kind: "the blackwall tire-bot", self: "the blackwall tire-bot" },
    draw: makeTireBot(TORQUE_PALETTE),
  },
  {
    id: "whitewall",
    name: "Whitewall",
    blurb: "Old-school whitewall style wrapped around a brand-new shell.",
    persona: { kind: "the whitewall tire-bot", self: "the whitewall tire-bot" },
    draw: makeTireBot(WHITEWALL_PALETTE),
  },
  {
    id: "blaze",
    name: "Blaze",
    blurb: "Redline rubber. Boots hot and never fades.",
    persona: { kind: "the redline tire-bot", self: "the redline tire-bot" },
    draw: makeTireBot(BLAZE_PALETTE),
  },
  {
    id: "slick",
    name: "Slick",
    blurb: "Racing slick — no tread, all speed, zero packet loss.",
    persona: { kind: "the racing-slick tire-bot", self: "the racing-slick tire-bot" },
    draw: makeTireBot(SLICK_PALETTE),
  },
];

/* --- Part icons (faceless auto-part sprites) ------------------------------- */

/**
 * Faceless auto-part icons — no eyes, no mouth, no PixelLook. The part itself
 * is the whole sprite; emotes read through motion (spin, pump, glow) plus the
 * floating corner badge. Same 32×32 grid and ink-outline style as the crew.
 * Each still carries the required `persona`, so in chat an icon answers as
 * the part ("I'm Gear, a gear — …" / "I'm just a gear — that one's beyond
 * me.") through the same uniform template as every other sprite.
 */

/** Bob shared by the icons — the only "body language" a faceless part gets. */
function iconBob(frame: number, emote: PixelEmote): number {
  if (emote === "happy") return -Math.abs(Math.sin(frame * 0.15)) * 1.5;
  if (emote === "thinking") return wobble(frame, 0.7);
  if (emote === "sleep") return 0.5;
  return wobble(frame, 0.4);
}

/* Brake disc: drilled friction ring, center hat, lug holes, center bore. */
function drawRotorIcon(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  const spin = emote === "celebrate" ? frame * 0.12 : frame * 0.008;
  shiftY(ctx, iconBob(frame, emote), () => {
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(spin);
    ctx.translate(-16, -16);
    // friction ring
    discO(ctx, 16, 16, 11, STEEL);
    // drilled holes around the ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      disc(ctx, 16 + Math.round(Math.cos(a) * 9), 16 + Math.round(Math.sin(a) * 9), 1, INK);
    }
    // center hat with lug holes and a bore
    disc(ctx, 16, 16, 5, STEEL_DK);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      px(ctx, 16 + Math.round(Math.cos(a) * 3), 16 + Math.round(Math.sin(a) * 3), 1, 1, INK);
    }
    disc(ctx, 16, 16, 1, INK);
    ctx.restore();
  });
  emoteBadge(ctx, frame, emote);
}

/* Piston: ring-grooved crown, wrist pin, skirt, rod, big-end ring. Pumps. */
function drawPistonIcon(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  const pump =
    emote === "celebrate" || emote === "happy"
      ? Math.sin(frame * 0.2) * 1.5
      : Math.sin(frame * 0.06) * 0.5;
  shiftY(ctx, pump, () => {
    // crown with compression-ring grooves
    box(ctx, 10, 5, 12, 8, STEEL);
    px(ctx, 10, 7, 12, 1, STEEL_DK);
    px(ctx, 10, 9, 12, 1, STEEL_DK);
    // wrist-pin bore
    px(ctx, 15, 11, 2, 2, INK);
    // skirt
    box(ctx, 12, 13, 8, 3, STEEL_DK);
    // connecting rod
    box(ctx, 14, 16, 4, 8, STEEL);
    px(ctx, 15, 17, 1, 6, STEEL_DK);
    // big-end ring
    discO(ctx, 16, 26, 3, STEEL);
    disc(ctx, 16, 26, 1, INK);
  });
  emoteBadge(ctx, frame, emote);
}

/* Gear: eight outlined teeth around a steel body. Always turning. */
function drawGearIcon(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  const speed = emote === "celebrate" ? 0.15 : emote === "thinking" ? 0 : 0.02;
  const rock = emote === "thinking" ? wobble(frame, 0.1) : 0;
  shiftY(ctx, iconBob(frame, emote), () => {
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(frame * speed + rock);
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      box(ctx, -2, -13, 4, 4, STEEL);
      ctx.restore();
    }
    // body, hub, bore
    discO(ctx, 0, 0, 9, STEEL);
    disc(ctx, 0, 0, 4, STEEL_DK);
    disc(ctx, 0, 0, 2, INK);
    ctx.restore();
  });
  emoteBadge(ctx, frame, emote);
}

/* Steering wheel: rubber rim, dark open interior, three spokes, steel hub. */
function drawWheelIcon(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  const sway = emote === "celebrate" ? frame * 0.12 : wobble(frame, emote === "idle" ? 0.06 : 0.12);
  shiftY(ctx, iconBob(frame, emote), () => {
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(sway);
    ctx.translate(-16, -16);
    // rubber rim ring with a highlight
    discO(ctx, 16, 16, 11, RUBBER);
    px(ctx, 11, 6, 3, 1, RUBBER_HI);
    px(ctx, 18, 6, 3, 1, RUBBER_HI);
    // dark open interior — reads as holes against the dark stage
    disc(ctx, 16, 16, 8, INK);
    // three spokes: left, right, down
    px(ctx, 7, 15, 6, 2, STEEL_DK);
    px(ctx, 19, 15, 6, 2, STEEL_DK);
    px(ctx, 15, 17, 2, 7, STEEL_DK);
    // hub + horn button
    discO(ctx, 16, 16, 3, STEEL);
    px(ctx, 15, 15, 2, 2, INK);
    ctx.restore();
  });
  emoteBadge(ctx, frame, emote);
}

/* Headlight bulb: glass envelope, glowing filament, ribbed screw base. */
function drawBulbIcon(ctx: CanvasRenderingContext2D, frame: number, emote: PixelEmote) {
  const lit = emote !== "sleep" && Math.floor(frame / 40) % 2 === 0;
  shiftY(ctx, iconBob(frame, emote), () => {
    // glass envelope
    discO(ctx, 16, 12, 8, CREAM);
    // filament with support posts
    const glow = emote === "sleep" ? STEEL_DK : lit ? AMBER_LT : AMBER;
    px(ctx, 13, 11, 6, 2, glow);
    px(ctx, 14, 10, 1, 1, glow);
    px(ctx, 17, 10, 1, 1, glow);
    px(ctx, 13, 13, 1, 3, STEEL_DK);
    px(ctx, 18, 13, 1, 3, STEEL_DK);
    // ribbed screw base + bottom contact
    box(ctx, 12, 20, 8, 6, STEEL_DK);
    px(ctx, 12, 21, 8, 1, STEEL);
    px(ctx, 12, 23, 8, 1, STEEL);
    box(ctx, 14, 26, 4, 2, STEEL);
    // light rays when excited
    if (emote === "celebrate" || emote === "happy") {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + frame * 0.05;
        px(ctx, 16 + Math.round(Math.cos(a) * 11), 12 + Math.round(Math.sin(a) * 11), 1, 1, YELLOW);
      }
    }
  });
  emoteBadge(ctx, frame, emote);
}

export const PART_ICONS: PixelCharacter[] = [
  {
    id: "rotor",
    name: "Rotor",
    blurb: "Brake disc icon. Drilled steel ring, center hat, lug holes — spins when excited.",
    persona: { kind: "a brake rotor", self: "a brake rotor" },
    draw: drawRotorIcon,
  },
  {
    id: "piston",
    name: "Piston",
    blurb: "Piston icon. Ring grooves, wrist pin and connecting rod — pumps up and down.",
    persona: { kind: "a piston", self: "a piston" },
    draw: drawPistonIcon,
  },
  {
    id: "gear",
    name: "Gear",
    blurb: "Cog icon. Eight teeth around a steel body — always turning, faster to celebrate.",
    persona: { kind: "a gear", self: "a gear" },
    draw: drawGearIcon,
  },
  {
    id: "wheel",
    name: "Wheel",
    blurb: "Steering wheel icon. Rubber rim, three spokes, steel hub — sways like it's steering.",
    persona: { kind: "a steering wheel", self: "a steering wheel" },
    draw: drawWheelIcon,
  },
  {
    id: "bulb",
    name: "Bulb",
    blurb: "Headlight bulb icon. Glass envelope and a glowing filament — dims down to sleep.",
    persona: { kind: "a headlight bulb", self: "a headlight bulb" },
    draw: drawBulbIcon,
  },
];
