/**
 * The 3D shop for the Parts Counter 3D cabinet — an Animal Crossing-style
 * two-zone room: customers at the FRONT counter, parts on the BACK shelves,
 * and the walk between them is the game.
 *
 * Everything is procedural (no textures, models, or fonts) and the scene is
 * built once. The game file drives it through a small typed API: it asks for
 * world positions, tells the door to swing, and flips prop visibility.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type WorldHandle = {
  group: THREE.Group;
  door: { open: () => void; close: () => void };
  setPropVisible: (id: string, on: boolean) => void;
  setShelfGlow: (id: string | null) => void;
  shelfSpot: (id: string) => THREE.Vector3;
  registerSpot: THREE.Vector3;
  matSpot: THREE.Vector3;
  doorSpot: THREE.Vector3;
  clerkStart: THREE.Vector3;
  obstacles: { x: number; z: number; r: number }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  partAnchor: (id: string) => THREE.Object3D;
  /** Objects a tap can hit: the shelf parts and the register. */
  interactables: { object: THREE.Object3D; kind: "shelf" | "register"; id?: string }[];
  update: (dt: number) => void;
};

// One silhouette per part id, tinted to match the 2D counter's boxes.
const TINTS: Record<string, number> = {
  wipers: 0x1a7183,
  oilfilter: 0xa8161c,
  battery: 0x68a56f,
  bulb: 0xf6bd38,
  airfilter: 0x8fb7c4,
  coolant: 0xe0555a,
  plugs: 0xcfc9b8,
  wax: 0xc9a875,
};

const SHELF_IDS = Object.keys(TINTS);

function partMesh(id: string): THREE.Group {
  const tint = TINTS[id] ?? 0x999999;
  const group = new THREE.Group();
  const paint = (color: number, roughness = 0.55, metalness = 0.15) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const add = (mesh: THREE.Mesh, x = 0, y = 0, z = 0) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  switch (id) {
    case "battery": {
      add(new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.3, 0.26, 3, 0.03), paint(tint, 0.4)));
      const terminal = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12);
      add(new THREE.Mesh(terminal, paint(0xd8d4c8, 0.3, 0.9)), -0.13, 0.18, 0);
      add(new THREE.Mesh(terminal, paint(0xa8161c, 0.3, 0.6)), 0.13, 0.18, 0);
      break;
    }
    case "oilfilter":
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 24), paint(tint, 0.35, 0.6)));
      add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 24), paint(0x2b2b2b, 0.5)),
        0,
        0.12,
        0,
      );
      break;
    case "coolant": {
      add(new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.3, 0.15, 3, 0.03), paint(tint, 0.25)));
      add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 14), paint(tint, 0.3)),
        0.06,
        0.185,
        0,
      );
      add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14), paint(0xf6f2e4, 0.4)),
        0.06,
        0.23,
        0,
      );
      break;
    }
    case "wipers":
      add(new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.05, 0.09, 2, 0.02), paint(tint, 0.5)));
      add(
        new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.07, 0.11, 2, 0.02), paint(0x17181c, 0.6)),
        0,
        0.01,
        0,
      );
      break;
    case "airfilter": {
      add(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.09, 0.26, 2, 0.02), paint(tint, 0.7)));
      for (let i = -1; i <= 1; i += 1) {
        add(
          new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.02), paint(0xf6f2e4, 0.8)),
          0,
          0.05,
          i * 0.07,
        );
      }
      break;
    }
    case "bulb":
      add(new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.16, 3, 0.03), paint(tint, 0.45)));
      add(
        new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), paint(0xfff6d8, 0.15, 0.05)),
        0,
        0.11,
        0,
      );
      break;
    case "plugs":
      add(new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.13, 0.14, 2, 0.02), paint(tint, 0.65)));
      add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.09, 10),
          paint(0xd8d4c8, 0.25, 0.9),
        ),
        0,
        0.1,
        0,
      );
      break;
    default: // wax — a short shop tin
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 24), paint(tint, 0.3, 0.5)));
      add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.015, 24), paint(0xf6f2e4, 0.4)),
        0,
        0.05,
        0,
      );
  }
  return group;
}

export function buildWorld(scene: THREE.Scene): WorldHandle {
  const group = new THREE.Group();
  scene.add(group);

  const mat = (color: number, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  /* --- the room ------------------------------------------------------ */
  // Checkerboard shop tile, canvas-drawn: cream and warm gray, like the old
  // parts-store floors. Instantly reads "shop" instead of "tech demo".
  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = 256;
  tileCanvas.height = 256;
  const tileCtx = tileCanvas.getContext("2d")!;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      tileCtx.fillStyle = (row + col) % 2 === 0 ? "#e9e2d0" : "#a49c8e";
      tileCtx.fillRect(col * 64, row * 64, 64, 64);
    }
  }
  const tileTexture = new THREE.CanvasTexture(tileCanvas);
  tileTexture.colorSpace = THREE.SRGBColorSpace;
  tileTexture.wrapS = THREE.RepeatWrapping;
  tileTexture.wrapT = THREE.RepeatWrapping;
  tileTexture.repeat.set(3, 2.25);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 9),
    new THREE.MeshStandardMaterial({ map: tileTexture, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = mat(0xd9d2bd, 0.9);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
  backWall.position.set(0, 2, -4.5);
  backWall.receiveShadow = true;
  group.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-6, 2, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.2), wallMat);
  frontWall.position.set(0, 0.6, 4.5);
  group.add(frontWall);

  /* --- back shelves -------------------------------------------------- */
  const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 0.5), mat(0x8d8676, 0.8));
  shelfBoard.position.set(0, 1.15, -4.1);
  shelfBoard.castShadow = true;
  shelfBoard.receiveShadow = true;
  group.add(shelfBoard);
  const pegboard = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.1, 0.05), mat(0x7a5c3a, 0.7));
  pegboard.position.set(0, 1.7, -4.35);
  group.add(pegboard);

  const parts = new Map<string, { group: THREE.Group; material: THREE.MeshStandardMaterial }>();
  SHELF_IDS.forEach((id, index) => {
    const part = partMesh(id);
    const x = -4.2 + index * 1.2;
    part.position.set(x, 1.3, -4.1);
    group.add(part);
    const material = (part.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    parts.set(id, { group: part, material });
  });

  /* --- front counter with a walk-through gap -------------------------- */
  const counterMat = mat(0x7a5c3a, 0.7);
  const counterTopMat = mat(0x6a4e30, 0.55);
  const longCounter = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 0.7), counterMat);
  longCounter.position.set(-1.25, 0.45, 1.6);
  longCounter.castShadow = true;
  longCounter.receiveShadow = true;
  group.add(longCounter);
  const longTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 0.78), counterTopMat);
  longTop.position.set(-1.25, 0.93, 1.6);
  longTop.castShadow = true;
  group.add(longTop);
  const stubCounter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.7), counterMat);
  stubCounter.position.set(3.0, 0.45, 1.6);
  stubCounter.castShadow = true;
  stubCounter.receiveShadow = true;
  group.add(stubCounter);
  const stubTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.78), counterTopMat);
  stubTop.position.set(3.0, 0.93, 1.6);
  stubTop.castShadow = true;
  group.add(stubTop);

  /* --- the register (plain, swapped for brass when upgraded) ---------- */
  const registerGroup = new THREE.Group();
  const plainRegister = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.32, 0.4, 3, 0.04),
    mat(0x3b3630, 0.5),
  );
  plainRegister.castShadow = true;
  registerGroup.add(plainRegister);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x2a2f2c,
    emissive: 0x8fe0a0,
    emissiveIntensity: 0.25,
  });
  const display = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.02), displayMat);
  display.position.set(0, 0.22, 0.12);
  registerGroup.add(display);
  const brassRegister = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 0.32, 0.4, 3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.25 }),
  );
  brassRegister.castShadow = true;
  brassRegister.visible = false;
  registerGroup.add(brassRegister);
  registerGroup.position.set(-2, 1.12, 1.6);
  group.add(registerGroup);

  /* --- welcome mat ---------------------------------------------------- */
  const matMesh = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), mat(0xa8161c, 0.85));
  matMesh.rotation.x = -Math.PI / 2;
  matMesh.position.set(-2, 0.01, 2.6);
  matMesh.receiveShadow = true;
  group.add(matMesh);

  /* --- the swinging door on the right wall ---------------------------- */
  const doorPivot = new THREE.Group();
  doorPivot.position.set(6, 0, 2.5);
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 1.1), mat(0x6a4e30, 0.6));
  doorPanel.position.set(-0.03, 1.1, 0.55);
  doorPanel.castShadow = true;
  doorPivot.add(doorPanel);
  group.add(doorPivot);
  let doorTarget = 0;
  const door = {
    open: () => {
      doorTarget = -1.9;
    },
    close: () => {
      doorTarget = 0;
    },
  };

  /* --- the Ocean Heights sign over the back shelves --------------------- */
  // Canvas-drawn, so the shop's name and phone number are real text — and the
  // phone matches the rest of the site exactly.
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const signCtx = signCanvas.getContext("2d")!;
  signCtx.fillStyle = "#a8161c";
  signCtx.fillRect(0, 0, 1024, 256);
  signCtx.strokeStyle = "#f6bd38";
  signCtx.lineWidth = 10;
  signCtx.strokeRect(16, 16, 992, 224);
  signCtx.fillStyle = "#f6f2e4";
  signCtx.font = "bold 96px Georgia, serif";
  signCtx.textAlign = "center";
  signCtx.fillText("OCEAN HEIGHTS", 512, 116);
  signCtx.fillStyle = "#f6bd38";
  signCtx.font = "bold 52px Georgia, serif";
  signCtx.fillText("AUTO & TIRE · (609) 241-1546", 512, 196);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: 0xffffff,
      emissiveMap: signTexture,
      emissiveIntensity: 0.3,
    }),
  );
  sign.position.set(0, 3.2, -4.45);
  group.add(sign);

  // A brand-red front panel on the long counter.
  const counterFront = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 0.04), mat(0xa8161c, 0.6));
  counterFront.position.set(-1.25, 0.45, 1.97);
  group.add(counterFront);

  /* --- prop slots ------------------------------------------------------ */
  const props = new Map<string, THREE.Object3D>();
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.4, 28), mat(0x68a56f, 0.9));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1, 0.01, 2.8);
  rug.receiveShadow = true;
  props.set("rug", rug);

  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 16), mat(0xa8161c, 0.6));
  pot.position.y = 0.15;
  pot.castShadow = true;
  plant.add(pot);
  const leafMat = mat(0x68a56f, 0.7);
  for (let i = 0; i < 4; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), leafMat);
    leaf.position.set(
      Math.cos((i / 4) * Math.PI * 2) * 0.12,
      0.42,
      Math.sin((i / 4) * Math.PI * 2) * 0.12,
    );
    leaf.scale.y = 1.6;
    plant.add(leaf);
  }
  plant.position.set(4.8, 0, 3.2);
  props.set("plant", plant);

  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), mat(0xf6f2e4, 0.6));
  clock.position.set(0, 2.9, -4.45);
  props.set("clock", clock);

  const snacks = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.1, 16),
    mat(0xf6bd38, 0.5),
  );
  snacks.position.set(0.3, 1.0, 1.6);
  snacks.castShadow = true;
  props.set("snacks", snacks);

  const art = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.5, 0.05, 2, 0.02), mat(0x1a7183, 0.5));
  art.position.set(-3.2, 2.7, -4.45);
  props.set("art", art);

  for (const prop of props.values()) {
    prop.visible = false;
    group.add(prop);
  }

  /* --- lighting -------------------------------------------------------- */
  group.add(new THREE.HemisphereLight(0xf6f2e4, 0x5a5348, 0.6));
  const key = new THREE.DirectionalLight(0xfff2dd, 2.2);
  key.position.set(3, 5.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0004;
  group.add(key);
  const counterGlow = new THREE.PointLight(0xffe6b8, 5, 6, 1.8);
  counterGlow.position.set(0, 2.6, 1.4);
  group.add(counterGlow);

  /* --- world positions the game needs ---------------------------------- */
  const shelfSpot = (id: string) => {
    const part = parts.get(id);
    return new THREE.Vector3(part ? part.group.position.x : 0, 0, -3.2);
  };
  const registerSpot = new THREE.Vector3(-2, 0, 1.1);
  const matSpot = new THREE.Vector3(-2, 0, 2.6);
  const doorSpot = new THREE.Vector3(5.4, 0, 2.5);
  const clerkStart = new THREE.Vector3(-2, 0, 0.5);

  const obstacles = [
    { x: -3, z: 1.6, r: 0.9 },
    { x: -1.5, z: 1.6, r: 0.9 },
    { x: 0, z: 1.6, r: 0.9 },
    { x: 3.0, z: 1.6, r: 0.6 },
    { x: -3, z: -4.1, r: 1.0 },
    { x: 0, z: -4.1, r: 1.0 },
    { x: 3, z: -4.1, r: 1.0 },
    { x: 4.8, z: 3.2, r: 0.4 },
  ];
  const bounds = { minX: -5.3, maxX: 5.3, minZ: -3.9, maxZ: 4.2 };

  /* --- shelf glow ------------------------------------------------------- */
  let glowing: string | null = null;
  const setShelfGlow = (id: string | null) => {
    if (glowing === id) return;
    glowing = id;
    for (const [partId, part] of parts) {
      part.material.emissive.setHex(partId === id ? 0xf6bd38 : 0x000000);
      part.material.emissiveIntensity = partId === id ? 0.45 : 0;
    }
  };

  /* --- door animation ---------------------------------------------------- */
  const update = (dt: number) => {
    const step = Math.min(1, dt * 3);
    doorPivot.rotation.y += (doorTarget - doorPivot.rotation.y) * step;
  };

  return {
    group,
    door,
    setPropVisible: (id, on) => {
      const prop = props.get(id);
      if (prop) prop.visible = on;
    },
    setShelfGlow,
    shelfSpot,
    registerSpot,
    matSpot,
    doorSpot,
    clerkStart,
    obstacles,
    bounds,
    partAnchor: (id) => parts.get(id)?.group ?? group,
    interactables: [
      ...SHELF_IDS.map((id) => ({ object: parts.get(id)!.group, kind: "shelf" as const, id })),
      { object: registerGroup, kind: "register" as const },
    ],
    update,
  };
}
