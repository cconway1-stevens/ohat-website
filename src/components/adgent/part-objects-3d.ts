"use client";

/**
 * Part Objects 3D — faceless auto-part objects for the /adgent studio's
 * "3D Objects" theme. The 3D counterpart of PART_ICONS in pixel-crew.ts:
 * no eyes, no mouth, no mascot — just the part itself as a low-poly icon.
 *
 * Everything is procedural (no models, no downloads), built from THREE
 * primitives with the same steel/rubber palette as the 2D sprites. Each
 * builder returns a group centered on the origin, roughly one unit tall;
 * the scene (object-3d-canvas.tsx) adds lights, turntable motion, and the
 * fake blob shadow.
 *
 * This module imports Three.js, so it must stay behind the studio's
 * dynamic import — never import it from adgent-studio.tsx directly.
 */
import * as THREE from "three";

const RUBBER = 0x23262c;
const STEEL = 0xc8ccd2;
const STEEL_DK = 0x7d838c;
const INK = 0x171412;

const paint = (color: number, roughness = 0.55) =>
  new THREE.MeshStandardMaterial({ color, roughness });

/* Tire: rubber torus, steel rim, five spokes, hub. The faceless Tread. */
function buildTire(): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.18, 18, 40), paint(RUBBER, 0.85)));
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24), paint(STEEL, 0.4));
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.14), paint(STEEL_DK, 0.5));
    spoke.position.set(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0);
    spoke.rotation.z = a + Math.PI / 2;
    group.add(spoke);
  }
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16),
    paint(STEEL_DK, 0.5),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  return group;
}

/* Gear: steel disc, eight teeth, dark center bore. */
function buildGear(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 32), paint(STEEL, 0.45));
  body.rotation.x = Math.PI / 2;
  group.add(body);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), paint(STEEL, 0.45));
    tooth.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0);
    tooth.rotation.z = a;
    group.add(tooth);
  }
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 20), paint(INK, 0.6));
  bore.rotation.x = Math.PI / 2;
  group.add(bore);
  return group;
}

/* Wrench: box handle, open-jaw torus arc up top, ring end at the bottom. */
function buildWrench(): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.07), paint(STEEL, 0.4)));
  // The arc gap centers on +y: default gap center is π + arc/2, so rotate back.
  const jaw = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.055, 12, 24, Math.PI * 1.4),
    paint(STEEL, 0.4),
  );
  jaw.position.y = 0.42;
  jaw.rotation.z = Math.PI * 0.5 - Math.PI * 1.7;
  group.add(jaw);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.05, 12, 24), paint(STEEL, 0.4));
  ring.position.y = -0.4;
  group.add(ring);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), paint(INK, 0.6));
  hole.rotation.x = Math.PI / 2;
  hole.position.y = -0.4;
  group.add(hole);
  return group;
}

/* Piston: crown with ring grooves, skirt, connecting rod, big-end ring. */
function buildPiston(): THREE.Group {
  const group = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24), paint(STEEL, 0.4));
  crown.position.y = 0.32;
  group.add(crown);
  for (const y of [0.36, 0.3]) {
    const groove = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.015, 8, 32),
      paint(STEEL_DK, 0.5),
    );
    groove.rotation.x = Math.PI / 2;
    groove.position.y = y;
    group.add(groove);
  }
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24),
    paint(STEEL_DK, 0.5),
  );
  skirt.position.y = 0.16;
  group.add(skirt);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.07), paint(STEEL, 0.4));
  rod.position.y = -0.12;
  group.add(rod);
  const bigEnd = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 12, 24), paint(STEEL, 0.4));
  bigEnd.position.y = -0.38;
  group.add(bigEnd);
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16), paint(INK, 0.6));
  bore.rotation.x = Math.PI / 2;
  bore.position.y = -0.38;
  group.add(bore);
  return group;
}

/* Brake rotor: drilled friction disc, center hat, lug holes, center bore. */
function buildRotor(): THREE.Group {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 40), paint(STEEL, 0.45));
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.07, 10),
      paint(INK, 0.6),
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0);
    group.add(hole);
  }
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 24), paint(STEEL_DK, 0.5));
  hat.rotation.x = Math.PI / 2;
  hat.position.z = 0.03;
  group.add(hat);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), paint(INK, 0.6));
    lug.rotation.x = Math.PI / 2;
    lug.position.set(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.03);
    group.add(lug);
  }
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), paint(INK, 0.6));
  bore.rotation.x = Math.PI / 2;
  bore.position.z = 0.03;
  group.add(bore);
  return group;
}

/**
 * Builders keyed by the studio's object ids (`objects3d` set in
 * adgent-studio.tsx). Ids carry the `3d` suffix so they can never collide
 * with a pixel-crew character id in the persisted `adgent-looks` state.
 */
export const PART_OBJECT_BUILDERS: Record<string, () => THREE.Group> = {
  tire3d: buildTire,
  gear3d: buildGear,
  wrench3d: buildWrench,
  piston3d: buildPiston,
  rotor3d: buildRotor,
};
