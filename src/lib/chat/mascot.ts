import type { ChatPersona } from "./answers";

/**
 * The mascot roster — one place to add a character. Persona copy must match
 * the sprite's own metadata in src/components/agent/pixel-crew.ts, so the
 * studio and the widget always agree on who is talking.
 */
export type MascotId = "tread" | "sparky";

export type MascotConfig = {
  persona: ChatPersona;
  /** The static inline-SVG face: FAB, header, message avatars, load fallback. */
  face: "tire" | "spark";
  /** The animated scene: the 3D tire rig, or the pixel-crew canvas renderer. */
  scene: "tire-3d" | "pixel";
};

export const MASCOTS: Record<MascotId, MascotConfig> = {
  tread: {
    persona: { name: "Tread", kind: "the shop tire", self: "a tire" },
    face: "tire",
    scene: "tire-3d",
  },
  sparky: {
    persona: { name: "Sparky", kind: "the shop spark plug", self: "a spark plug" },
    face: "spark",
    scene: "pixel",
  },
};

/**
 * THE swap point: change this one id and the whole production widget
 * re-brands — greeting, identity, small talk, fallback copy, the FAB and
 * header faces, and the animated scene all follow.
 */
export const PRODUCTION_MASCOT: MascotId = "sparky";

export const PRODUCTION_PERSONA: ChatPersona = MASCOTS[PRODUCTION_MASCOT].persona;
