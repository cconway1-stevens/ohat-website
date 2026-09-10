"use client";

/**
 * Tread's character builder — the parametric 3D tire mascot shared by the
 * contact-page widget and the /agent studio.
 *
 * Everything is procedural (no models, no downloads): a torus tire, a cream
 * face disc, kawaii eyes with sparkle highlights, a cat mouth, soft blush, a
 * baseball cap and a valve-stem sprout. `buildPal(options)` returns a THREE
 * group plus the eye handles the scene needs for blinking.
 *
 * The studio renders several `TreadVariant` presets side by side; the widget
 * uses the default (production) variant.
 */
import * as THREE from "three";

export type TreadVariant = {
  id: string;
  label: string;
  tireRadius?: number;
  tireTube?: number;
  faceRadius?: number;
  eyeScale?: number;
  mouth?: "cat" | "smile" | "open";
  cap?: boolean;
  blush?: boolean;
  grooves?: boolean;
  whitewall?: boolean;
  faceColor?: number;
};

export type PalParts = {
  group: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  shadow: THREE.Mesh;
};

const paint = (color: number, roughness = 0.7) =>
  new THREE.MeshStandardMaterial({ color, roughness });

/* --- canvas sprites (same pattern as the arcade emotes) ----------------- */

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
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
}

export function makeConfettiSprite(color: string): THREE.Sprite {
  return makeSprite((ctx, size) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#171412";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(size * 0.3, size * 0.38, size * 0.4, size * 0.24, 6);
    ctx.fill();
    ctx.stroke();
  }, 64);
}

export function makeHeartSprite(): THREE.Sprite {
  return makeSprite((ctx, size) => {
    ctx.fillStyle = "#a8161c";
    ctx.strokeStyle = "#171412";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(size / 2, size * 0.82);
    ctx.bezierCurveTo(size * 0.05, size * 0.5, size * 0.22, size * 0.16, size / 2, size * 0.38);
    ctx.bezierCurveTo(size * 0.78, size * 0.16, size * 0.95, size * 0.5, size / 2, size * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

export function makeZzzSprite(): THREE.Sprite {
  return makeSprite((ctx, size) => {
    ctx.fillStyle = "#1a7183";
    ctx.strokeStyle = "#f7efd9";
    ctx.lineWidth = 8;
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("Zzz", size / 2, size / 2);
    ctx.fillText("Zzz", size / 2, size / 2);
  });
}

/* --- the character ------------------------------------------------------- */

function addMouth(group: THREE.Group, mouth: TreadVariant["mouth"], z: number) {
  const mat = paint(0x171412, 0.5);
  if (mouth === "smile") {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 8, 24, Math.PI), mat);
    smile.position.set(0, -0.02, z);
    smile.rotation.z = Math.PI;
    group.add(smile);
  } else if (mouth === "open") {
    const open = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), mat);
    open.position.set(0, -0.06, z);
    open.scale.set(1, 0.75, 0.3);
    group.add(open);
  } else {
    // Cat "ω" mouth: two small arcs, low on the face.
    const arcGeo = new THREE.TorusGeometry(0.034, 0.011, 8, 16, Math.PI);
    for (const x of [-0.032, 0.032]) {
      const arc = new THREE.Mesh(arcGeo, mat);
      arc.position.set(x, -0.062, z);
      arc.rotation.z = Math.PI;
      group.add(arc);
    }
  }
}

export function buildPal(options: Partial<TreadVariant> = {}): PalParts {
  const {
    tireRadius = 0.48,
    tireTube = 0.19,
    faceRadius = 0.3,
    eyeScale = 1,
    mouth = "cat",
    cap = true,
    blush = true,
    grooves = false,
    whitewall = true,
    faceColor = 0xf7efd9,
  } = options;

  const group = new THREE.Group();

  // Clean rubber donut. No wireframe grooves by default — up close they read
  // as fur, and fur on a face is where the creep used to live.
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(tireRadius, tireTube, 18, 40),
    paint(0x2a2624, 0.85),
  );
  group.add(tire);
  if (grooves) {
    const wire = new THREE.Mesh(
      new THREE.TorusGeometry(tireRadius, tireTube + 0.005, 10, 24),
      new THREE.MeshBasicMaterial({
        color: 0x171412,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
    );
    group.add(wire);
  }

  // Classic whitewall: a pale band hugging the front sidewall, tucked under
  // the face edge and stopping short of the tread so the outer ring stays
  // black rubber. A lathe shell follows the torus surface (lifted a hair so
  // it never z-fights), which a flat ring can't do without clipping.
  if (whitewall) {
    const lift = 0.005;
    const tube = tireTube + lift;
    const inner = tireRadius - tireTube + lift; // behind the face plate
    const outer = tireRadius + tireTube - 0.05; // clear of the tread edge
    const steps = 24;
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= steps; i++) {
      const rho = inner + ((outer - inner) * i) / steps;
      const s = Math.min(1, Math.max(-1, (rho - tireRadius) / tube));
      points.push(new THREE.Vector2(rho, tube * Math.cos(Math.asin(s))));
    }
    const band = new THREE.Mesh(
      new THREE.LatheGeometry(points, 48),
      new THREE.MeshStandardMaterial({
        color: 0xf5f1e8,
        roughness: 0.65,
        // Visible from behind too, so the celebrate spin reads as a
        // whitewall on both sidewalls.
        side: THREE.DoubleSide,
      }),
    );
    band.rotation.x = Math.PI / 2;
    group.add(band);
  }

  // Big cream face filling the hole — the face dominates instead of peeking
  // out of the rubber.
  const hubcap = new THREE.Mesh(
    new THREE.CylinderGeometry(faceRadius, faceRadius, 0.1, 32),
    paint(faceColor, 0.55),
  );
  hubcap.rotation.x = Math.PI / 2;
  hubcap.position.z = 0.16;
  group.add(hubcap);

  // Kawaii eyes: big whites, big pupils, and the all-important sparkle dot —
  // a plain dark pupil is a doll eye, a pupil with a highlight is a friend.
  const eyeWhiteGeo = new THREE.SphereGeometry(0.088, 16, 12);
  const eyeWhiteMat = paint(0xffffff, 0.3);
  const pupilGeo = new THREE.SphereGeometry(0.047, 12, 10);
  const pupilMat = paint(0x171412, 0.35);
  const sparkleGeo = new THREE.SphereGeometry(0.016, 8, 8);
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const makeEye = (x: number) => {
    const eye = new THREE.Group();
    const white = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    white.scale.setScalar(eyeScale);
    eye.add(white);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.scale.setScalar(eyeScale);
    pupil.position.set(0, 0.005, 0.058);
    eye.add(pupil);
    const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
    sparkle.scale.setScalar(eyeScale);
    sparkle.position.set(-0.02, 0.024, 0.095);
    eye.add(sparkle);
    eye.position.set(x, 0.03, 0.235);
    group.add(eye);
    return eye;
  };
  const leftEye = makeEye(-0.135);
  const rightEye = makeEye(0.135);

  addMouth(group, mouth, 0.245);

  // Soft pink blush, translucent and clearly on the cream under the eyes.
  if (blush) {
    const blushGeo = new THREE.SphereGeometry(0.045, 12, 10);
    const blushMat = new THREE.MeshStandardMaterial({
      color: 0xf2a7a0,
      roughness: 1,
      transparent: true,
      opacity: 0.9,
    });
    for (const x of [-0.185, 0.185]) {
      const b = new THREE.Mesh(blushGeo, blushMat);
      b.position.set(x, -0.045, 0.215);
      b.scale.set(1.35, 0.8, 0.35);
      group.add(b);
    }
  }

  // A proper baseball cap — dome, brim, button — resting on the rubber at a
  // jaunty tilt, not floating above it.
  if (cap) {
    const capGroup = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      paint(0xa8161c, 0.6),
    );
    capGroup.add(dome);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.13), paint(0xa8161c, 0.6));
    brim.position.set(0.14, 0, 0.02);
    capGroup.add(brim);
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), paint(0x6f0d12, 0.6));
    button.position.y = 0.17;
    capGroup.add(button);
    capGroup.position.set(-0.17, 0.58, 0.05);
    capGroup.rotation.z = 0.3;
    group.add(capGroup);
  }

  // Valve stem sprout poking out of the top-right, with a little dark cap.
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.02, 0.12, 10),
    paint(0x8a8580, 0.5),
  );
  stem.position.set(0.43, 0.46, 0);
  stem.rotation.z = -Math.PI / 4;
  group.add(stem);
  const stemTip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.032, 10),
    paint(0x171412, 0.5),
  );
  stemTip.position.set(0.48, 0.51, 0);
  stemTip.rotation.z = -Math.PI / 4;
  group.add(stemTip);

  // Fake blob shadow — no light shadows, this is the whole shading budget.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 28),
    new THREE.MeshBasicMaterial({
      color: 0x171412,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = 0.55;
  shadow.position.y = -0.7;

  return { group, leftEye, rightEye, shadow };
}
