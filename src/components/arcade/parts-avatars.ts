/**
 * Procedural characters for the Parts Counter 3D cabinet — a clerk and the
 * villagers who walk in. No rigs, no models: a capsule body, a sphere head,
 * nub arms, and a waddle that sells the walk. Bubbles and emotes are
 * canvas-drawn sprites, so nothing is downloaded.
 */
import * as THREE from "three";

export type Character = {
  group: THREE.Group;
  /** Advance the walk cycle; `moving` true while the character walks. */
  waddle: (t: number, moving: boolean) => void;
};

const paint = (color: number, roughness = 0.7) =>
  new THREE.MeshStandardMaterial({ color, roughness });

function makeBody(color: number): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 6, 14), paint(color));
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), paint(0xf0d9b8, 0.6));
  head.position.y = 1.05;
  head.castShadow = true;
  group.add(head);
  const eyeMat = paint(0x17181c, 0.4);
  const eyeGeo = new THREE.SphereGeometry(0.028, 10, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.07, 1.1, 0.17);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.07, 1.1, 0.17);
  group.add(rightEye);
  const armMat = paint(color);
  const armGeo = new THREE.CapsuleGeometry(0.05, 0.22, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.3, 0.6, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.3, 0.6, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);
  return group;
}

export function makeClerk(): Character {
  const group = makeBody(0xa8161c);
  // A little red cap with a brim, so the clerk reads as staff.
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 18), paint(0x8f1a1f, 0.5));
  cap.position.y = 1.24;
  group.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.24), paint(0x8f1a1f, 0.5));
  brim.position.set(0, 1.2, 0.12);
  group.add(brim);
  return { group, waddle: (t, moving) => waddle(group, t, moving) };
}

export function makeCustomer(palette: { body: number; head: number }): Character {
  const group = makeBody(palette.body);
  const head = group.children[1] as THREE.Mesh;
  (head.material as THREE.MeshStandardMaterial).color.setHex(palette.head);
  return { group, waddle: (t, moving) => waddle(group, t, moving) };
}

function waddle(group: THREE.Group, t: number, moving: boolean) {
  if (moving) {
    group.rotation.z = Math.sin(t * 9) * 0.12;
    group.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
  } else {
    group.rotation.z = Math.sin(t * 2.2) * 0.02;
    group.position.y = Math.sin(t * 2.2) * 0.012;
  }
}

/* --- bubbles and emotes (canvas sprites) ------------------------------ */

function makeSprite(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 128,
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(0.9, 0.9, 1);
  return sprite;
}

/** A speech bubble with a part icon and a quantity, floating over a head. */
export function makeBubble(id: string, quantity: number): THREE.Sprite {
  return makeSprite((ctx, size) => {
    ctx.fillStyle = "#fdf6e3";
    ctx.strokeStyle = "#17181c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(10, 8, size - 20, size - 34, 18);
    ctx.fill();
    ctx.stroke();
    // Tail.
    ctx.beginPath();
    ctx.moveTo(size / 2 - 14, size - 26);
    ctx.lineTo(size / 2, size - 8);
    ctx.lineTo(size / 2 + 14, size - 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawPartIcon(ctx, id, size / 2, size / 2 - 6, 0.5);
    if (quantity > 1) {
      ctx.fillStyle = "#17181c";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`×${quantity}`, size / 2, size - 12);
    }
  });
}

/** A part glyph: a tinted rounded box with a simple mark, drawn on a sprite. */
function drawPartIcon(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, s: number) {
  const tints: Record<string, string> = {
    wipers: "#1a7183",
    oilfilter: "#a8161c",
    battery: "#68a56f",
    bulb: "#f6bd38",
    airfilter: "#8fb7c4",
    coolant: "#e0555a",
    plugs: "#cfc9b8",
    wax: "#c9a875",
  };
  const color = tints[id] ?? "#999";
  const w = 44 * s;
  const h = 40 * s;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#17181c";
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 8 * s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(23,24,28,0.4)";
  ctx.fillRect(x - w / 2 + 6 * s, y - h / 2 + 8 * s, w - 12 * s, 5 * s);
  ctx.fillRect(x - w / 2 + 6 * s, y - h / 2 + 16 * s, w - 20 * s, 5 * s);
}

/** A floating emote: a happy note or a coin, popped on a sale. */
export function makeEmote(kind: "happy" | "coin"): THREE.Sprite {
  return makeSprite((ctx, size) => {
    if (kind === "coin") {
      ctx.fillStyle = "#f6bd38";
      ctx.strokeStyle = "#17181c";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#17181c";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", size / 2, size / 2 + 2);
    } else {
      ctx.fillStyle = "#17181c";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♪", size / 2, size / 2);
    }
  });
}
