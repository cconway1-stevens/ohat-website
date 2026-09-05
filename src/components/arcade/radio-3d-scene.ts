/**
 * The '56 De Luxe — a 1950s chrome dash radio rendered in Three.js.
 *
 * Modelled on the Blaupunkt-style units: a chrome trapezoidal faceplate with
 * horizontal ribs, a black glass dial with white AM/FM scales, five black
 * piano-key presets, and two big flanking knobs. Chrome gets its realism from
 * a PMREM room environment; the dial glows amber through an emissive canvas
 * texture when the set is powered.
 *
 * Everything interactive is raycast: drag the right knob (or the dial glass
 * itself) to tune, drag the left knob for volume, click the left knob for
 * power, click the right knob to cycle AM → FM → LIVE, and press the piano
 * keys for presets (hold one to save). The React side owns the state; this
 * file only renders it and reports gestures.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Band } from "@/lib/arcade/garage-audio";

export type RadioBand = Band | "LIVE";

export type RadioSceneCallbacks = {
  /** Tuning knob or dial glass dragged — dial value in the current band. */
  onTune(dial: number): void;
  /** Volume knob dragged, 0..1. */
  onVolume(volume: number): void;
  /** Left knob clicked without dragging — the classic push-for-power. */
  onPower(): void;
  /** Right knob clicked without dragging — cycle the band. */
  onBand(): void;
  /** A piano key was tapped (recall) or held (save). */
  onPreset(index: number, action: "recall" | "save"): void;
};

export type RadioSceneHandle = {
  setDial(dial: number, band: RadioBand): void;
  setVolume(volume: number): void;
  setPower(on: boolean): void;
  setBand(band: RadioBand): void;
  /** 0..1 — how cleanly the tuner is locked on a station. */
  setLock(lock: number): void;
  /** Blink a piano key to confirm a save. */
  flashPreset(index: number): void;
  dispose(): void;
};

/* --- layout --------------------------------------------------------- */

const FACE_W = 3.6;
const FACE_H = 1.16;
const FACE_TAPER = 0.07;
const DIAL_W = 1.9;
const DIAL_H = 0.6;
const DIAL_Y = 0.16;
const BUTTON_Y = -0.36;
const BUTTON_W = 0.28;
const BUTTON_H = 0.3;
const BUTTON_GAP = 0.06;
const KNOB_X = 1.34;
const KNOB_Y = -0.04;
const KNOB_R = 0.2;

// The dial glass is centred on x=0; scale margins inside the texture (px).
const TEX_W = 1024;
const SCALE_PAD = 70;
const SCALE_W = TEX_W - SCALE_PAD * 2;

const FM = { min: 87.5, max: 108 };
const AM = { min: 530, max: 1700 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Dial value → 0..1 across the glass for the given band. */
function dialT(dial: number, band: RadioBand): number {
  if (band === "AM") return clamp((dial - AM.min) / (AM.max - AM.min), 0, 1);
  return clamp((dial - FM.min) / (FM.max - FM.min), 0, 1);
}

/** 0..1 across the glass → dial value for the given band. */
function tDial(t: number, band: RadioBand): number {
  if (band === "AM") return AM.min + clamp(t, 0, 1) * (AM.max - AM.min);
  return FM.min + clamp(t, 0, 1) * (FM.max - FM.min);
}

/** The needle and the printed scale share one mapping: texture px → scene x. */
function dialX(dial: number, band: RadioBand): number {
  const u = (SCALE_PAD + dialT(dial, band) * SCALE_W) / TEX_W;
  return (u - 0.5) * DIAL_W;
}

function knobTurn(t: number): number {
  return THREE.MathUtils.degToRad(-(clamp(t, 0, 1) * 270 - 135));
}

/* --- canvas textures ------------------------------------------------ */

function makeDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = 340;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);

  const bg = g.createLinearGradient(0, 0, 0, 340);
  bg.addColorStop(0, "#101014");
  bg.addColorStop(0.5, "#0a0a0d");
  bg.addColorStop(1, "#08080a");
  g.fillStyle = bg;
  g.fillRect(0, 0, TEX_W, 340);

  const scaleX = (t: number) => SCALE_PAD + t * SCALE_W;

  // AM scale along the top — 54..160 (×10 kHz), the way the period dials read.
  g.strokeStyle = "#e8e4da";
  g.fillStyle = "#e8e4da";
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(SCALE_PAD, 96);
  g.lineTo(TEX_W - SCALE_PAD, 96);
  g.stroke();
  const amMarks = [54, 60, 70, 80, 100, 120, 140, 160];
  g.font = "700 34px Georgia, serif";
  for (const mark of amMarks) {
    const t = (mark - 54) / (160 - 54);
    const x = scaleX(t);
    g.beginPath();
    g.moveTo(x, 84);
    g.lineTo(x, 96);
    g.stroke();
    g.fillText(String(mark), x, 72);
  }
  for (let mark = 54; mark <= 160; mark += 2) {
    const x = scaleX((mark - 54) / (160 - 54));
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, 90);
    g.lineTo(x, 96);
    g.stroke();
  }
  g.font = "700 22px Georgia, serif";
  g.textAlign = "left";
  g.fillText("AM", SCALE_PAD - 52, 74);
  g.textAlign = "right";
  g.fillText("×10 kHz", TEX_W - SCALE_PAD + 52, 74);

  // Brand, dead centre — the way BLAUPUNKT sat in the middle of the glass.
  g.textAlign = "center";
  g.fillStyle = "#f5f2e8";
  g.font = "700 44px Georgia, serif";
  g.fillText("O H A T", TEX_W / 2, 176);
  g.font = "400 20px Georgia, serif";
  g.fillStyle = "#b9b4a6";
  g.fillText("D E   L U X E", TEX_W / 2, 208);

  // FM scale along the bottom — 88..108.
  g.strokeStyle = "#e8e4da";
  g.fillStyle = "#e8e4da";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(SCALE_PAD, 250);
  g.lineTo(TEX_W - SCALE_PAD, 250);
  g.stroke();
  const fmMarks = [88, 92, 96, 100, 104, 108];
  g.font = "700 34px Georgia, serif";
  for (const mark of fmMarks) {
    const t = (mark - 88) / (108 - 88);
    const x = scaleX(t);
    g.beginPath();
    g.moveTo(x, 250);
    g.lineTo(x, 262);
    g.stroke();
    g.fillText(String(mark), x, 300);
  }
  for (let mark = 88; mark <= 108; mark += 1) {
    const x = scaleX((mark - 88) / (108 - 88));
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, 250);
    g.lineTo(x, 256);
    g.stroke();
  }
  g.font = "700 22px Georgia, serif";
  g.textAlign = "left";
  g.fillText("FM", SCALE_PAD - 52, 296);
  g.textAlign = "right";
  g.fillText("MHz", TEX_W - SCALE_PAD + 52, 296);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Horizontal ribbing for the faceplate — the engine-turned chrome look. */
function makeRibTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 160);
  for (let y = 0; y < 160; y += 5) {
    g.fillStyle = "#b8b8b8";
    g.fillRect(0, y, 512, 2);
    g.fillStyle = "#585858";
    g.fillRect(0, y + 2, 512, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Radial ribs for the knob edges. */
function makeKnobRibTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 32;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.CanvasTexture(canvas);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 32);
  for (let x = 0; x < 256; x += 8) {
    g.fillStyle = "#b0b0b0";
    g.fillRect(x, 0, 3, 32);
    g.fillStyle = "#4a4a4a";
    g.fillRect(x + 3, 0, 3, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

/** The little band window beside the tuning knob — redrawn on band change. */
function makeBandWindow(): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 56;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture };
}

function drawBandWindow(canvas: HTMLCanvasElement, texture: THREE.CanvasTexture, band: RadioBand) {
  const g = canvas.getContext("2d");
  if (!g) return;
  g.fillStyle = "#0a0805";
  g.fillRect(0, 0, 192, 56);
  g.fillStyle = "#ffb14e";
  g.font = "700 30px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(band, 96, 30);
  texture.needsUpdate = true;
}

/* --- the scene ------------------------------------------------------ */

export function mountRadioScene(
  canvas: HTMLCanvasElement,
  callbacks: RadioSceneCallbacks,
): RadioSceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 30);
  camera.position.set(0, 0.42, 4.3);
  camera.lookAt(0, -0.05, 0);

  // Chrome lives or dies by its environment map.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const disposables: { dispose(): void }[] = [renderer, pmrem, environment];
  const track = <T extends { dispose(): void }>(resource: T): T => {
    disposables.push(resource);
    return resource;
  };

  /* --- materials --- */
  const chrome = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xf2f3f5,
      metalness: 1,
      roughness: 0.14,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.15,
    }),
  );
  const chromeDark = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x6f7276,
      metalness: 1,
      roughness: 0.32,
      envMapIntensity: 0.9,
    }),
  );
  const blackGloss = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x17181a,
      metalness: 0.1,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.1,
    }),
  );
  const ribTexture = track(makeRibTexture());
  const chromeRibbed = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xe8e9eb,
      metalness: 1,
      roughness: 0.2,
      bumpMap: ribTexture,
      bumpScale: 0.6,
      envMapIntensity: 1.05,
    }),
  );
  const dialTexture = track(makeDialTexture());
  const dialFace = track(
    new THREE.MeshStandardMaterial({
      map: dialTexture,
      emissive: 0xffa530,
      emissiveMap: dialTexture,
      emissiveIntensity: 0,
      roughness: 0.35,
      metalness: 0,
    }),
  );
  const dialGlass = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.06,
      transparent: true,
      opacity: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
  );
  const needleMat = track(new THREE.MeshBasicMaterial({ color: 0xff3b1f }));
  const knobRibTexture = track(makeKnobRibTexture());
  const knobSide = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1b1d,
      metalness: 0.2,
      roughness: 0.35,
      clearcoat: 0.8,
      bumpMap: knobRibTexture,
      bumpScale: 0.5,
      envMapIntensity: 1,
    }),
  );
  const lampMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0d140d,
      emissive: 0x53d769,
      emissiveIntensity: 0,
      roughness: 0.4,
    }),
  );

  /* --- lights --- */
  const key = new THREE.DirectionalLight(0xfff3e0, 2.6);
  key.position.set(2.5, 3, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -3;
  key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xdfe6f2, 0x141210, 0.5));
  const rim = new THREE.DirectionalLight(0xa8c0ff, 0.8);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);
  const dialLight = new THREE.PointLight(0xffa530, 0, 4.5, 2.5);
  dialLight.position.set(0, DIAL_Y, 0.75);
  scene.add(dialLight);

  /* --- the radio --- */
  const radio3d = new THREE.Group();
  scene.add(radio3d);

  // Trapezoidal chrome faceplate, extruded with a small bevel.
  const shape = new THREE.Shape();
  {
    const w = FACE_W / 2;
    const h = FACE_H / 2;
    const t = FACE_TAPER;
    const r = 0.08;
    shape.moveTo(-w + t + r, h);
    shape.lineTo(w - t - r, h);
    shape.quadraticCurveTo(w - t, h, w - t, h - r);
    shape.lineTo(w, -h + r);
    shape.quadraticCurveTo(w, -h, w - r, -h);
    shape.lineTo(-w + r, -h);
    shape.quadraticCurveTo(-w, -h, -w, -h + r);
    shape.lineTo(-w + t, h - r);
    shape.quadraticCurveTo(-w + t, h, -w + t + r, h);
  }
  const faceGeometry = track(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 8,
    }),
  );
  faceGeometry.translate(0, 0, -0.06);
  const faceplate = new THREE.Mesh(faceGeometry, chrome);
  faceplate.castShadow = true;
  radio3d.add(faceplate);

  // Ribbed chrome overlay on the face — the horizontal engine-turned lines.
  const ribOverlay = new THREE.Mesh(
    track(new THREE.PlaneGeometry(FACE_W - 0.18, FACE_H - 0.16)),
    chromeRibbed,
  );
  ribOverlay.position.z = 0.047;
  radio3d.add(ribOverlay);

  // Dial: dark chrome bezel, the printed glass, the needle, the cover glass.
  const dialBezel = new THREE.Mesh(
    track(new THREE.BoxGeometry(DIAL_W + 0.12, DIAL_H + 0.12, 0.05)),
    chromeDark,
  );
  dialBezel.position.set(0, DIAL_Y, 0.055);
  radio3d.add(dialBezel);

  const dialPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(DIAL_W, DIAL_H)), dialFace);
  dialPlane.position.set(0, DIAL_Y, 0.085);
  radio3d.add(dialPlane);

  const needle = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.014, DIAL_H - 0.08, 0.008)),
    needleMat,
  );
  needle.position.set(0, DIAL_Y, 0.093);
  radio3d.add(needle);

  const dialCover = new THREE.Mesh(track(new THREE.PlaneGeometry(DIAL_W, DIAL_H)), dialGlass);
  dialCover.position.set(0, DIAL_Y, 0.1);
  radio3d.add(dialCover);

  // The stereo/lock lamp — a green dot at the right edge of the dial.
  const lockLamp = new THREE.Mesh(track(new THREE.CircleGeometry(0.022, 16)), lampMat);
  lockLamp.position.set(DIAL_W / 2 - 0.08, DIAL_Y - DIAL_H / 2 + 0.07, 0.096);
  radio3d.add(lockLamp);

  // Five black piano keys in a chrome channel.
  const buttonChannel = new THREE.Mesh(
    track(new THREE.BoxGeometry(5 * BUTTON_W + 4 * BUTTON_GAP + 0.12, BUTTON_H + 0.1, 0.04)),
    chromeDark,
  );
  buttonChannel.position.set(0, BUTTON_Y, 0.05);
  radio3d.add(buttonChannel);

  const buttons: THREE.Mesh[] = [];
  const buttonRowW = 5 * BUTTON_W + 4 * BUTTON_GAP;
  for (let i = 0; i < 5; i += 1) {
    const button = new THREE.Mesh(
      track(new THREE.BoxGeometry(BUTTON_W, BUTTON_H, 0.09)),
      blackGloss,
    );
    button.position.set(
      -buttonRowW / 2 + BUTTON_W / 2 + i * (BUTTON_W + BUTTON_GAP),
      BUTTON_Y,
      0.09,
    );
    button.castShadow = true;
    button.userData.kind = "preset";
    button.userData.index = i;
    radio3d.add(button);
    buttons.push(button);
  }

  // Two flanking knobs: chrome base ring, ribbed black barrel, indicator line.
  function makeKnob(x: number, kind: "volume" | "tune") {
    const group = new THREE.Group();
    group.position.set(x, KNOB_Y, 0.05);
    const ring = new THREE.Mesh(
      track(new THREE.CylinderGeometry(KNOB_R + 0.045, KNOB_R + 0.045, 0.05, 40)),
      chrome,
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const barrel = new THREE.Mesh(
      track(new THREE.CylinderGeometry(KNOB_R, KNOB_R, 0.13, 40)),
      knobSide,
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.07;
    barrel.castShadow = true;
    group.add(barrel);
    const cap = new THREE.Mesh(
      track(new THREE.CylinderGeometry(KNOB_R - 0.02, KNOB_R - 0.02, 0.012, 40)),
      blackGloss,
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.14;
    group.add(cap);
    const marker = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.018, KNOB_R * 0.62, 0.008)),
      track(new THREE.MeshBasicMaterial({ color: 0xf5f2e8 })),
    );
    marker.position.set(0, KNOB_R * 0.5, 0.148);
    group.add(marker);
    // A fat invisible hit target so the knob is easy to grab.
    const hit = new THREE.Mesh(
      track(new THREE.CylinderGeometry(KNOB_R + 0.12, KNOB_R + 0.12, 0.3, 12)),
      track(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hit.rotation.x = Math.PI / 2;
    hit.position.z = 0.08;
    hit.userData.kind = kind;
    group.add(hit);
    radio3d.add(group);
    return { group, barrel, marker, hit };
  }
  const volumeKnob = makeKnob(-KNOB_X, "volume");
  const tuneKnob = makeKnob(KNOB_X, "tune");

  // The band window, tucked between the piano keys and the tuning knob.
  const bandWindow = makeBandWindow();
  track(bandWindow.texture);
  const bandPlateMat = track(
    new THREE.MeshStandardMaterial({
      map: bandWindow.texture,
      emissive: 0xffb14e,
      emissiveMap: bandWindow.texture,
      emissiveIntensity: 0,
      roughness: 0.4,
    }),
  );
  const bandPlate = new THREE.Mesh(track(new THREE.PlaneGeometry(0.3, 0.11)), bandPlateMat);
  bandPlate.position.set(0.99, BUTTON_Y, 0.075);
  radio3d.add(bandPlate);

  // A thin base rail and two rubber feet, so the set sits on the shelf.
  const rail = new THREE.Mesh(track(new THREE.BoxGeometry(FACE_W - 0.5, 0.07, 0.34)), chromeDark);
  rail.position.set(0, -FACE_H / 2 - 0.045, -0.05);
  radio3d.add(rail);
  const footGeometry = track(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 16));
  const footMat = track(new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.95 }));
  for (const x of [-FACE_W / 2 + 0.5, FACE_W / 2 - 0.5]) {
    const foot = new THREE.Mesh(footGeometry, footMat);
    foot.position.set(x, -FACE_H / 2 - 0.1, -0.05);
    radio3d.add(foot);
  }

  // Just the chrome face floating in a dark studio — no shelf, no clutter.
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.8, 32),
    new THREE.ShadowMaterial({ opacity: 0.55 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -FACE_H / 2 - 0.6;
  shadow.receiveShadow = true;
  scene.add(shadow);

  /* --- state the scene renders --- */
  let band: RadioBand = "FM";
  let targetDial = 95.5;
  let shownDial = 95.5;
  let volume = 0.65;
  let power = false;
  let lock = 0;
  let lampLevel = 0;
  const buttonDip = [0, 0, 0, 0, 0];
  const buttonFlash = [0, 0, 0, 0, 0];

  drawBandWindow(bandWindow.canvas, bandWindow.texture, band);

  /* --- pointer interaction --- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitTargets = [volumeKnob.hit, tuneKnob.hit, dialCover, dialPlane, ...buttons];
  let drag: {
    kind: "tune" | "volume" | "dial";
    startX: number;
    startY: number;
    startValue: number;
    moved: number;
    at: number;
  } | null = null;
  let presetHold: { index: number; timer: number; saved: boolean } | null = null;
  let parallax = { x: 0, y: 0 };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function castAt(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(hitTargets, false);
  }

  function dialFromPoint(point: THREE.Vector3): number {
    const u = clamp((point.x + DIAL_W / 2) / DIAL_W, 0, 1);
    const texPx = u * TEX_W;
    const t = clamp((texPx - SCALE_PAD) / SCALE_W, 0, 1);
    return tDial(t, band);
  }

  function onPointerDown(event: PointerEvent) {
    const hits = castAt(event);
    if (hits.length === 0) return;
    const hit = hits[0];
    const kind = hit.object.userData.kind as string | undefined;
    canvas.setPointerCapture(event.pointerId);
    if (kind === "preset") {
      const index = hit.object.userData.index as number;
      buttonDip[index] = 1;
      const timer = window.setTimeout(() => {
        if (presetHold?.index === index) {
          presetHold.saved = true;
          buttonFlash[index] = 1;
          callbacks.onPreset(index, "save");
        }
      }, 650);
      presetHold = { index, timer, saved: false };
      return;
    }
    if (kind === "volume") {
      drag = {
        kind: "volume",
        startX: event.clientX,
        startY: event.clientY,
        startValue: volume,
        moved: 0,
        at: performance.now(),
      };
      return;
    }
    if (kind === "tune") {
      drag = {
        kind: "tune",
        startX: event.clientX,
        startY: event.clientY,
        startValue: targetDial,
        moved: 0,
        at: performance.now(),
      };
      return;
    }
    // The dial glass itself: drag the needle across the scale.
    drag = {
      kind: "dial",
      startX: event.clientX,
      startY: event.clientY,
      startValue: targetDial,
      moved: 0,
      at: performance.now(),
    };
    callbacks.onTune(dialFromPoint(hit.point));
  }

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    parallax = {
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    };
    if (!drag) {
      const hits = castAt(event);
      canvas.style.cursor = hits.length
        ? hits[0].object.userData.kind === "preset"
          ? "pointer"
          : "grab"
        : "default";
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.kind === "volume") {
      callbacks.onVolume(clamp(drag.startValue - dy * 0.004, 0, 1));
    } else if (drag.kind === "tune") {
      const span = band === "AM" ? AM.max - AM.min : FM.max - FM.min;
      callbacks.onTune(drag.startValue + (dx / rect.width) * span * 1.6);
    } else {
      const hits = castAt(event);
      if (hits.length) callbacks.onTune(dialFromPoint(hits[0].point));
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (presetHold) {
      window.clearTimeout(presetHold.timer);
      if (!presetHold.saved) callbacks.onPreset(presetHold.index, "recall");
      buttonDip[presetHold.index] = 0;
      presetHold = null;
    }
    if (drag) {
      const quick = performance.now() - drag.at < 500 && drag.moved < 6;
      if (quick && drag.kind === "volume") callbacks.onPower();
      if (quick && drag.kind === "tune") callbacks.onBand();
      drag = null;
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  /* --- the render loop --- */
  let raf = 0;
  let last = performance.now();
  let clock = 0;
  let running = false;
  let onScreen = true;

  function tick(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    // The needle swings with a little inertia, like the real string drive.
    shownDial = reduced ? targetDial : lerp(shownDial, targetDial, Math.min(1, dt * 9));
    needle.position.x = dialX(shownDial, band);
    tuneKnob.group.rotation.z = knobTurn(dialT(shownDial, band));
    volumeKnob.group.rotation.z = knobTurn(volume);

    // Dial lamp: warm up when powered, breathe faintly, brighten with lock.
    const lampTarget = power ? 0.9 + lock * 0.7 : 0;
    lampLevel = reduced ? lampTarget : lerp(lampLevel, lampTarget, Math.min(1, dt * 5));
    const flicker = reduced ? 0 : Math.sin(clock * 47) * 0.012 + Math.sin(clock * 13) * 0.008;
    dialFace.emissiveIntensity = Math.max(0, lampLevel + flicker * lampLevel);
    bandPlateMat.emissiveIntensity = power ? 0.9 : 0;
    dialLight.intensity = lampLevel * 1.6;
    lampMat.emissiveIntensity = power && lock > 0.65 ? 1.4 : 0;

    // Piano keys: dip while pressed, flash on save.
    for (let i = 0; i < 5; i += 1) {
      buttonDip[i] = lerp(buttonDip[i], presetHold?.index === i ? 1 : 0, Math.min(1, dt * 18));
      buttons[i].position.z = 0.09 - buttonDip[i] * 0.035;
      if (buttonFlash[i] > 0) {
        buttonFlash[i] = Math.max(0, buttonFlash[i] - dt * 2.2);
        const pulse = Math.sin(buttonFlash[i] * Math.PI * 4) * 0.5 + 0.5;
        buttons[i].scale.setScalar(1 + pulse * 0.06 * buttonFlash[i]);
      } else {
        buttons[i].scale.setScalar(1);
      }
    }

    // A whisper of parallax so the chrome shifts as you move the pointer.
    if (!reduced) {
      camera.position.x = lerp(camera.position.x, parallax.x * 0.22, Math.min(1, dt * 4));
      camera.position.y = lerp(camera.position.y, 0.42 - parallax.y * 0.1, Math.min(1, dt * 4));
      camera.lookAt(0, -0.05, 0);
    }

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function stopLoop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function syncLoop() {
    if (onScreen && !document.hidden) startLoop();
    else stopLoop();
  }

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncLoop();
  });
  observer.observe(canvas);
  const onVisibility = () => syncLoop();
  document.addEventListener("visibilitychange", onVisibility);

  const resize = new ResizeObserver(() => {
    const host = canvas.parentElement ?? canvas;
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(canvas.parentElement ?? canvas);

  syncLoop();

  return {
    setDial(dial, nextBand) {
      band = nextBand;
      targetDial = dial;
    },
    setVolume(next) {
      volume = clamp(next, 0, 1);
    },
    setPower(on) {
      power = on;
    },
    setBand(next) {
      band = next;
      drawBandWindow(bandWindow.canvas, bandWindow.texture, band);
    },
    setLock(next) {
      lock = clamp(next, 0, 1);
    },
    flashPreset(index) {
      if (index >= 0 && index < 5) buttonFlash[index] = 1;
    },
    dispose() {
      stopLoop();
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      for (const resource of disposables) resource.dispose();
    },
  };
}
