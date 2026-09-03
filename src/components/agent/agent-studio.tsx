"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { type JSX, useEffect, useRef, useState } from "react";
import {
  answerQuestion,
  type ChatChip,
  debugAnswer,
  type MatcherConfig,
  quickPrompts,
  STUDIO_CONFIG,
  treadGreeting,
} from "@/lib/chat/answers";
import { services } from "@/lib/services";
import { shop } from "@/lib/shop/shop";
import {
  PART_ICONS,
  PIXEL_CREW,
  PIXEL_GRID,
  type PixelCharacter,
  type PixelEmote,
  type PixelLook,
  RETRO_CREW,
  TIRE_BOTS,
} from "./pixel-crew";
import { readStorage, useLocalStorage, writeStorage } from "./use-local-storage";

// The 3D objects stage rides in its own chunk (Three.js is heavy) and only
// downloads when the 3D Objects set is picked in Character mode.
const Object3DCanvas = dynamic(() => import("./object-3d-canvas"), { ssr: false });

/**
 * Agent Studio — a noindex dev playground for the pixel crew and Tread's
 * chat brain, styled like a retro game menu: framed panels, a character
 * dossier with stat bars, and feature call-out badges. A left nav links to
 * each of the nine modes as its own route.
 */

export type Mode =
  | "character"
  | "motion"
  | "testdrive"
  | "brain"
  | "engine"
  | "results"
  | "feedback"
  | "options"
  | "source";

const MODES: { id: Mode; label: string; sub: string }[] = [
  {
    id: "character",
    label: "Character",
    sub: "Pick a character set, pick a member, tune its look.",
  },
  { id: "motion", label: "Motion", sub: "Every emote the crew can play." },
  {
    id: "testdrive",
    label: "Test Drive",
    sub: "Chat with the live agent — rate each answer ▲/▼.",
  },
  {
    id: "brain",
    label: "Brain",
    sub: "Ask questions and see why the brain answers the way it does.",
  },
  { id: "engine", label: "Engine", sub: "What the brain runs on, and how backends compare." },
  { id: "results", label: "Results", sub: "Every test query, saved locally." },
  { id: "feedback", label: "Feedback", sub: "Your likes and hates — export and hand over." },
  { id: "options", label: "Options", sub: "Studio display and motion preferences." },
  { id: "source", label: "Source", sub: "Read the code behind the brain and the crew." },
];

const EMOTES: { id: PixelEmote; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "celebrate", label: "Celebrate" },
  { id: "thinking", label: "Thinking" },
  { id: "happy", label: "Happy" },
  { id: "sleep", label: "Sleep" },
];

const FAQ_COUNT = services.reduce((n, s) => n + s.faqs.length, 0);
const FEATURES = [
  "100% LOCAL",
  "NO API KEY",
  `${FAQ_COUNT} FAQs`,
  `${PIXEL_CREW.length} CREW`,
  "0 NETWORK",
  "TF-IDF",
];

/** Fun RPG-style stats per crew member, just for the dossier flavor. */
const CREW_STATS: Record<string, { label: string; value: number }[]> = {
  tread: [
    { label: "CHARM", value: 9 },
    { label: "TORQUE", value: 8 },
    { label: "BOUNCE", value: 7 },
  ],
  wrenchy: [
    { label: "CHARM", value: 7 },
    { label: "TORQUE", value: 9 },
    { label: "GRIP", value: 8 },
  ],
  volt: [
    { label: "CHARM", value: 6 },
    { label: "SPARK", value: 9 },
    { label: "SMARTS", value: 9 },
  ],
  drip: [
    { label: "CHARM", value: 8 },
    { label: "FLOW", value: 7 },
    { label: "SMARTS", value: 7 },
  ],
  sparky: [
    { label: "CHARM", value: 8 },
    { label: "SPARK", value: 9 },
    { label: "IGNITE", value: 7 },
  ],
  bit: [
    { label: "CHARM", value: 8 },
    { label: "UPTIME", value: 9 },
    { label: "SMARTS", value: 8 },
  ],
  pico: [
    { label: "CHARM", value: 8 },
    { label: "SPEED", value: 9 },
    { label: "BOUNCE", value: 6 },
  ],
  dot: [
    { label: "CHARM", value: 9 },
    { label: "PIXELS", value: 9 },
    { label: "SMARTS", value: 7 },
  ],
  chip: [
    { label: "CHARM", value: 7 },
    { label: "WARMTH", value: 9 },
    { label: "TORQUE", value: 8 },
  ],
  torque: [
    { label: "GRIP", value: 9 },
    { label: "TORQUE", value: 9 },
    { label: "CHARM", value: 7 },
  ],
  whitewall: [
    { label: "STYLE", value: 9 },
    { label: "GRIP", value: 7 },
    { label: "CHARM", value: 8 },
  ],
  blaze: [
    { label: "HEAT", value: 9 },
    { label: "SPEED", value: 8 },
    { label: "GRIP", value: 7 },
  ],
  slick: [
    { label: "SPEED", value: 10 },
    { label: "GRIP", value: 5 },
    { label: "SMARTS", value: 8 },
  ],
  rotor: [
    { label: "STOP", value: 9 },
    { label: "VENT", value: 8 },
    { label: "GRIP", value: 7 },
  ],
  piston: [
    { label: "PUMP", value: 9 },
    { label: "TORQUE", value: 8 },
    { label: "HEAT", value: 7 },
  ],
  gear: [
    { label: "MESH", value: 9 },
    { label: "RATIO", value: 8 },
    { label: "SPIN", value: 8 },
  ],
  wheel: [
    { label: "STEER", value: 9 },
    { label: "GRIP", value: 8 },
    { label: "CHARM", value: 6 },
  ],
  bulb: [
    { label: "GLOW", value: 9 },
    { label: "BEAM", value: 8 },
    { label: "WATTS", value: 7 },
  ],
  tire3d: [
    { label: "GRIP", value: 9 },
    { label: "TREAD", value: 8 },
    { label: "BOUNCE", value: 7 },
  ],
  gear3d: [
    { label: "MESH", value: 9 },
    { label: "RATIO", value: 8 },
    { label: "SPIN", value: 8 },
  ],
  wrench3d: [
    { label: "TORQUE", value: 9 },
    { label: "GRIP", value: 8 },
    { label: "REACH", value: 7 },
  ],
  piston3d: [
    { label: "PUMP", value: 9 },
    { label: "TORQUE", value: 8 },
    { label: "HEAT", value: 7 },
  ],
  rotor3d: [
    { label: "STOP", value: 9 },
    { label: "VENT", value: 8 },
    { label: "GRIP", value: 7 },
  ],
};

/**
 * Themed character sets for Character mode — the auto-parts crew, the
 * faceless part icons, and the bot families — so different mascot themes can
 * be evaluated side by side. `supportsLook` marks sets whose draw functions
 * take a PixelLook (eye/mouth customization); icons and bots draw fixed faces.
 */
const CHARACTER_SETS: {
  id: string;
  label: string;
  characters: PixelCharacter[];
  supportsLook: boolean;
}[] = [
  { id: "crew", label: "Auto Parts", characters: PIXEL_CREW, supportsLook: true },
  { id: "icons", label: "Part Icons", characters: PART_ICONS, supportsLook: false },
  { id: "retro", label: "Retro Bots", characters: RETRO_CREW, supportsLook: false },
  { id: "tirebots", label: "Tire Bots", characters: TIRE_BOTS, supportsLook: false },
];

/**
 * The 3D Objects theme — faceless low-poly parts rendered in real Three.js
 * (part-objects-3d.ts behind the lazy Object3DCanvas). Metadata lives here so
 * the studio never imports Three.js eagerly; the canvas resolves the mesh
 * builder by id. View-only: 3D objects can't be your chat agent (the
 * sidebar, Motion mode and Test Drive all draw pixel sprites), so the set
 * stays out of CHARACTER_SETS and findCharacter.
 */
const OBJECTS_3D_SET = { id: "objects3d", label: "3D Objects" };
const OBJECTS_3D: { id: string; name: string; blurb: string }[] = [
  {
    id: "tire3d",
    name: "Tire",
    blurb: "A clean rubber torus on a five-spoke steel rim. No face — just tire.",
  },
  {
    id: "gear3d",
    name: "Gear",
    blurb: "A steel cog with eight teeth and a dark center bore, built to turn.",
  },
  {
    id: "wrench3d",
    name: "Wrench",
    blurb: "Open jaw up top, ring end at the bottom — the shop classic in low-poly steel.",
  },
  {
    id: "piston3d",
    name: "Piston",
    blurb: "Ring-grooved crown, skirt and connecting rod with a big-end bore.",
  },
  {
    id: "rotor3d",
    name: "Rotor",
    blurb: "A drilled brake disc with a center hat and lug holes — flat, steel, honest.",
  },
];

/** First selectable id of any set, pixel or 3D. */
function firstIdOf(setId: string): string {
  if (setId === OBJECTS_3D_SET.id) return OBJECTS_3D[0].id;
  const set = CHARACTER_SETS.find((s) => s.id === setId) ?? CHARACTER_SETS[0];
  return set.characters[0].id;
}

/** Find a character across every themed set (falls back to Tread). */
function findCharacter(id: string): PixelCharacter {
  for (const s of CHARACTER_SETS) {
    const hit = s.characters.find((c) => c.id === id);
    if (hit) return hit;
  }
  return PIXEL_CREW[0];
}

type Settings = {
  scanlines: "off" | "subtle" | "full";
  fontSize: 16 | 18 | 20;
  speed: 0.5 | 1 | 2;
  reducedMotion: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  scanlines: "full",
  fontSize: 18,
  speed: 1,
  reducedMotion: false,
};

type Looks = {
  setId: string;
  characterId: string;
  eyeSize: "small" | "medium" | "big";
  mouth: "smile" | "cat" | "open";
  tint: number;
};

const DEFAULT_LOOKS: Looks = {
  setId: "crew",
  characterId: "tread",
  eyeSize: "medium",
  mouth: "smile",
  tint: 0,
};

/** Stable empty-list fallback so useLocalStorage's snapshot memo stays stable. */
const EMPTY_LIST: never[] = [];

type HistoryEntry = {
  id: string;
  question: string;
  answer: string;
  matched: string | null;
  score: number | null;
  /** Set when Test Drive writes the entry; Brain mode leaves it undefined. */
  characterId?: string;
  timestamp: number;
};

/** A research note — the user's like/hate/observation about the agent. */
type Note = {
  id: string;
  mode: string;
  characterId: string;
  rating: "like" | "hate" | "note";
  text: string;
  /** Optional element the user pointed at with the picker. */
  target?: string;
  timestamp: number;
};

/* --- Game-panel primitives ------------------------------------------------ */

function Frame({
  title,
  dark = false,
  className = "",
  children,
}: {
  title?: string;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`agent-frame ${dark ? "is-dark" : ""} ${className}`}>
      {title ? <header className="agent-frame-head">{title}</header> : null}
      <div className="agent-frame-body">{children}</div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="agent-badge">{children}</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="agent-stat">
      <span className="agent-stat-label">{label}</span>
      <span className="agent-stat-bar">
        <i style={{ width: `${value * 10}%` }} />
      </span>
      <span className="agent-stat-val">{value}</span>
    </div>
  );
}

/* --- Pixel canvas --------------------------------------------------------- */

function PixelCanvas({
  character,
  emote,
  speed,
  reducedMotion,
  tint,
  look,
  size,
  className,
}: {
  character: PixelCharacter;
  emote: PixelEmote;
  speed: number;
  reducedMotion: boolean;
  tint: number;
  look?: PixelLook;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const render = () => {
      ctx.clearRect(0, 0, PIXEL_GRID, PIXEL_GRID);
      character.draw(ctx, frame, emote, look);
      if (!reducedMotion) {
        frame += speed;
        raf = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [character, emote, speed, reducedMotion, look]);

  return (
    <canvas
      ref={canvasRef}
      width={PIXEL_GRID}
      height={PIXEL_GRID}
      className={className}
      style={{
        filter: tint ? `hue-rotate(${tint}deg)` : undefined,
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
      }}
      aria-label={`${character.name} pixel character`}
    />
  );
}

/* --- Shared bits ---------------------------------------------------------- */

function ChipLink({ chip }: { chip: ChatChip }) {
  return (
    <a
      href={chip.href}
      className="agent-chip"
      {...(chip.kind === "download" ? { download: true } : {})}
      {...(chip.kind === "directions" ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {chip.label}
    </a>
  );
}

function Terminal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`agent-terminal ${className}`}>{children}</div>;
}

/* --- Mode: Looks ---------------------------------------------------------- */

/** The set picker row shared by the pixel and 3D branches of Character mode. */
function SetPicker({ activeId, onPick }: { activeId: string; onPick: (setId: string) => void }) {
  return (
    <div className="agent-seg">
      {[...CHARACTER_SETS, OBJECTS_3D_SET].map((s) => (
        <button
          key={s.id}
          type="button"
          className={s.id === activeId ? "is-active" : ""}
          onClick={() => onPick(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** Character mode dispatcher — pixel sets and the 3D set are separate
 * components so neither ever calls hooks conditionally. */
function LooksMode({
  looks,
  setLooks,
  settings,
}: {
  looks: Looks;
  setLooks: (l: Looks) => void;
  settings: Settings;
}) {
  if (looks.setId === OBJECTS_3D_SET.id) {
    return <Objects3DLooks looks={looks} setLooks={setLooks} settings={settings} />;
  }
  return <PixelLooks looks={looks} setLooks={setLooks} settings={settings} />;
}

function PixelLooks({
  looks,
  setLooks,
  settings,
}: {
  looks: Looks;
  setLooks: (l: Looks) => void;
  settings: Settings;
}) {
  const set = CHARACTER_SETS.find((s) => s.id === looks.setId) ?? CHARACTER_SETS[0];
  const character = set.characters.find((c) => c.id === looks.characterId) ?? set.characters[0];
  const stats = CREW_STATS[character.id] ?? CREW_STATS.tread;
  const index = set.characters.findIndex((c) => c.id === character.id) + 1;
  const [zoom, setZoom] = useState(2);
  const stageSize = 128 * zoom;
  // The customizations are applied only to the focused stage character — the
  // crew select grid stays neutral so the swatches read as the un-edited crew.
  const focusedLook: PixelLook = { eyeSize: looks.eyeSize, mouth: looks.mouth };

  function pickSet(setId: string) {
    setLooks({ ...looks, setId, characterId: firstIdOf(setId) });
  }

  return (
    <div className="agent-mode">
      <div className="agent-looks-top">
        <Frame dark title={`STAGE · ${index}/${set.characters.length}`} className="agent-stage">
          <div className="agent-stage-screen">
            <PixelCanvas
              character={character}
              emote="idle"
              speed={settings.speed}
              reducedMotion={settings.reducedMotion}
              tint={looks.tint}
              look={focusedLook}
              size={stageSize}
              className="agent-pixel"
            />
            <div className="agent-stage-pedestal" />
          </div>
          <div className="agent-stage-name">{character.name}</div>
          <div className="agent-stage-zoom">
            <span>ZOOM</span>
            {[1, 2, 3].map((z) => (
              <button
                key={z}
                type="button"
                className={z === zoom ? "is-active" : ""}
                onClick={() => setZoom(z)}
              >
                {z}×
              </button>
            ))}
          </div>
        </Frame>

        <Frame title="DOSSIER" className="agent-dossier">
          <h3 className="agent-dossier-name">{character.name}</h3>
          <p className="agent-dossier-blurb">{character.blurb}</p>
          <div className="agent-stats">
            {stats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
          <div className="agent-badges">
            {FEATURES.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Frame>
      </div>

      <Frame title="CREW SELECT" className="agent-crewbar">
        <SetPicker activeId={set.id} onPick={pickSet} />
        <div className="agent-crew-grid">
          {set.characters.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`agent-crew-card ${c.id === looks.characterId ? "is-active" : ""}`}
              onClick={() => setLooks({ ...looks, characterId: c.id })}
            >
              <PixelCanvas
                character={c}
                emote="idle"
                speed={settings.speed}
                reducedMotion={settings.reducedMotion}
                tint={c.id === looks.characterId ? looks.tint : 0}
                look={c.id === looks.characterId ? focusedLook : undefined}
                className="agent-pixel agent-pixel-sm"
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </Frame>

      <Frame title="CUSTOMIZE" className="agent-customize">
        <div className="agent-controls">
          {set.supportsLook && (
            <>
              <label className="agent-field">
                <span>Eye size</span>
                <select
                  value={looks.eyeSize}
                  onChange={(e) =>
                    setLooks({ ...looks, eyeSize: e.target.value as Looks["eyeSize"] })
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="big">Big</option>
                </select>
              </label>
              <label className="agent-field">
                <span>Mouth</span>
                <select
                  value={looks.mouth}
                  onChange={(e) => setLooks({ ...looks, mouth: e.target.value as Looks["mouth"] })}
                >
                  <option value="smile">Smile</option>
                  <option value="cat">Cat</option>
                  <option value="open">Open</option>
                </select>
              </label>
            </>
          )}
          <label className="agent-field agent-field-grow">
            <span>Tint ({looks.tint}&deg;)</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={looks.tint}
              onChange={(e) => setLooks({ ...looks, tint: Number(e.target.value) })}
            />
          </label>
        </div>
      </Frame>
    </div>
  );
}

/* --- Mode: Looks (3D Objects set) ------------------------------------------ */

/**
 * Character mode's 3D branch — the faceless part objects on a real Three.js
 * turntable. Same stage/dossier/crew-select layout as the pixel sets, minus
 * the look controls (there are no faces to tune) and the zoom (WebGL scales
 * itself). View-only: 3D objects never become the chat agent.
 */
function Objects3DLooks({
  looks,
  setLooks,
  settings,
}: {
  looks: Looks;
  setLooks: (l: Looks) => void;
  settings: Settings;
}) {
  const object = OBJECTS_3D.find((o) => o.id === looks.characterId) ?? OBJECTS_3D[0];
  const stats = CREW_STATS[object.id] ?? CREW_STATS.tread;
  const index = OBJECTS_3D.findIndex((o) => o.id === object.id) + 1;

  function pickSet(setId: string) {
    setLooks({ ...looks, setId, characterId: firstIdOf(setId) });
  }

  return (
    <div className="agent-mode">
      <div className="agent-looks-top">
        <Frame dark title={`STAGE · ${index}/${OBJECTS_3D.length}`} className="agent-stage">
          <div className="agent-stage-screen">
            <Object3DCanvas
              objectId={object.id}
              reducedMotion={settings.reducedMotion}
              speed={settings.speed}
              className="agent-object3d agent-object3d-lg"
            />
            <div className="agent-stage-pedestal" />
          </div>
          <div className="agent-stage-name">{object.name}</div>
        </Frame>

        <Frame title="DOSSIER" className="agent-dossier">
          <h3 className="agent-dossier-name">{object.name}</h3>
          <p className="agent-dossier-blurb">{object.blurb}</p>
          <div className="agent-stats">
            {stats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
          <div className="agent-badges">
            {FEATURES.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Frame>
      </div>

      <Frame title="CREW SELECT" className="agent-crewbar">
        <SetPicker activeId={OBJECTS_3D_SET.id} onPick={pickSet} />
        <div className="agent-crew-grid">
          {OBJECTS_3D.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`agent-crew-card ${o.id === object.id ? "is-active" : ""}`}
              onClick={() => setLooks({ ...looks, characterId: o.id })}
            >
              <Object3DCanvas
                objectId={o.id}
                reducedMotion={settings.reducedMotion}
                animated={false}
                className="agent-object3d agent-object3d-sm"
              />
              <span>{o.name}</span>
            </button>
          ))}
        </div>
        <p className="agent-hint">
          Real Three.js meshes, lazy-loaded with this set. View-only for now — your chat agent is
          still a pixel sprite, so 3D objects never appear in the sidebar picker.
        </p>
      </Frame>
    </div>
  );
}

/* --- Mode: Behavior ------------------------------------------------------- */

function BehaviorMode({
  looks,
  setLooks,
  settings,
}: {
  looks: Looks;
  setLooks: (l: Looks) => void;
  settings: Settings;
}) {
  const [emote, setEmote] = useState<PixelEmote>("idle");
  const character = findCharacter(looks.characterId);
  const timers = useRef<number[]>([]);

  function pick(id: string) {
    const owner = CHARACTER_SETS.find((s) => s.characters.some((c) => c.id === id));
    setLooks({ ...looks, setId: owner?.id ?? looks.setId, characterId: id });
  }

  useEffect(
    () => () =>
      timers.current.forEach((t) => {
        window.clearTimeout(t);
      }),
    [],
  );

  function playAll() {
    timers.current.forEach((t) => {
      window.clearTimeout(t);
    });
    timers.current = [];
    const seq: PixelEmote[] = ["celebrate", "thinking", "happy", "sleep"];
    seq.forEach((e, i) => {
      timers.current.push(window.setTimeout(() => setEmote(e), i * 1200));
    });
  }

  return (
    <div className="agent-mode">
      <div className="agent-looks-top">
        <Frame dark title="STAGE" className="agent-stage">
          <div className="agent-stage-screen">
            <PixelCanvas
              character={character}
              emote={emote}
              speed={settings.speed}
              reducedMotion={settings.reducedMotion}
              tint={0}
              className="agent-pixel agent-pixel-lg"
            />
            <div className="agent-stage-pedestal" />
          </div>
          <div className="agent-stage-name">
            {character.name} · {emote.toUpperCase()}
          </div>
          <div className="agent-mini-picker">
            {CHARACTER_SETS.flatMap((s) => s.characters).map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === character.id ? "is-active" : ""}
                onClick={() => pick(c.id)}
                aria-label={`Test motion on ${c.name}`}
                title={c.name}
              >
                <PixelCanvas
                  character={c}
                  emote="idle"
                  speed={settings.speed}
                  reducedMotion={settings.reducedMotion}
                  tint={0}
                  size={36}
                  className="agent-pixel"
                />
              </button>
            ))}
          </div>
          <div className="agent-emote-row">
            {EMOTES.map((e) => (
              <button
                key={e.id}
                type="button"
                className={e.id === emote ? "is-active" : ""}
                onClick={() => setEmote(e.id)}
              >
                {e.label}
              </button>
            ))}
            <button type="button" className="agent-play" onClick={playAll}>
              Play all
            </button>
          </div>
        </Frame>

        <Frame title="MOVE LIST" className="agent-dossier">
          <dl className="agent-behavior-list">
            <div>
              <dt>Idle</dt>
              <dd>Gentle bob and sway, with a periodic blink.</dd>
            </div>
            <div>
              <dt>Celebrate</dt>
              <dd>Spin plus a burst of sparkle pixels.</dd>
            </div>
            <div>
              <dt>Thinking</dt>
              <dd>A quick wobble while the brain resolves a question.</dd>
            </div>
            <div>
              <dt>Happy</dt>
              <dd>A hop with a floating heart.</dd>
            </div>
            <div>
              <dt>Sleep</dt>
              <dd>A drifting Zzz — the shrug when nothing matches.</dd>
            </div>
          </dl>
        </Frame>
      </div>
    </div>
  );
}

/* --- Mode: Brains --------------------------------------------------------- */

function BrainsMode() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof debugAnswer> | null>(null);
  const [filter, setFilter] = useState("");
  // Brain tweaks used to live only in component state — a tester would lose
  // their threshold dial and synonym dictionary on every page refresh.
  const [threshold, setThreshold] = useLocalStorage<number>(
    "agent-brain-tweaks:threshold",
    STUDIO_CONFIG.threshold,
  );
  const [extraSynonyms, setExtraSynonyms] = useLocalStorage<Record<string, string>>(
    "agent-brain-tweaks:synonyms",
    {},
  );
  const [alias, setAlias] = useState("");
  const [canonical, setCanonical] = useState("");

  const config: MatcherConfig = { threshold, extraSynonyms };

  function run(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const res = debugAnswer(trimmed, new Date(), config);
    setResult(res);
    appendHistory(trimmed, res);
  }

  function addSynonym() {
    const a = alias.trim().toLowerCase();
    const c = canonical.trim().toLowerCase();
    if (!a || !c) return;
    setExtraSynonyms((prev) => ({ ...prev, [a]: c }));
    setAlias("");
    setCanonical("");
  }

  const faqs = services.flatMap((s) =>
    s.faqs.map((f) => ({ question: f.question, answer: f.answer, slug: s.slug, name: s.name })),
  );
  const filteredFaqs = faqs.filter(
    (f) =>
      !filter ||
      f.question.toLowerCase().includes(filter.toLowerCase()) ||
      f.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="agent-mode">
      <div className="agent-brains-grid">
        <div className="agent-brains-main">
          <Frame title="TEST QUERY" className="agent-fill">
            <form
              className="agent-lab"
              onSubmit={(e) => {
                e.preventDefault();
                run(input);
              }}
            >
              <div className="agent-lab-input">
                <input
                  type="text"
                  spellCheck={false}
                  aria-label="Ask the brain a question"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the brain a question…"
                />
                <button type="submit">Ask</button>
              </div>
              <div className="agent-prompts">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setInput(p);
                      run(p);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </form>

            {result ? (
              <div className="agent-result">
                <div className="agent-answer">
                  <p>{result.answer.text}</p>
                  {result.answer.chips.length > 0 && (
                    <div className="agent-chips">
                      {result.answer.chips.map((chip) => (
                        <ChipLink key={chip.href + chip.label} chip={chip} />
                      ))}
                    </div>
                  )}
                </div>
                <Terminal>
                  {result.matched ? (
                    <dl className="agent-debug">
                      <div>
                        <dt>kind</dt>
                        <dd>{result.matched.kind}</dd>
                      </div>
                      <div>
                        <dt>id</dt>
                        <dd>{result.matched.id}</dd>
                      </div>
                      <div>
                        <dt>score</dt>
                        <dd>{result.matched.score.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt>label</dt>
                        <dd>{result.matched.label}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="agent-fallback">no match (fallback)</p>
                  )}
                  <p className="agent-tokens">
                    tokens: {result.tokens.length > 0 ? result.tokens.join(", ") : "(none)"}
                  </p>
                </Terminal>
              </div>
            ) : (
              <p className="agent-empty">
                Ask a question or tap a prompt — the answer and why the brain chose it appear here.
                Every run is logged to Results.
              </p>
            )}
          </Frame>

          <Frame title="SIMULATE TWEAKS">
            <label className="agent-field">
              <span>Threshold ({threshold})</span>
              <input
                type="range"
                min={2}
                max={12}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </label>
            <div className="agent-synonym-add">
              <input
                type="text"
                spellCheck={false}
                aria-label="Synonym alias"
                placeholder="alias (rim)"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
              <input
                type="text"
                spellCheck={false}
                aria-label="Synonym canonical"
                placeholder="canonical (tire)"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
              />
              <button type="button" onClick={addSynonym}>
                Add
              </button>
            </div>
            {Object.keys(extraSynonyms).length > 0 && (
              <ul className="agent-synonym-list">
                {Object.entries(extraSynonyms).map(([a, c]) => (
                  <li key={a}>
                    {a} → {c}
                    <button
                      type="button"
                      onClick={() =>
                        setExtraSynonyms((prev) => {
                          const next = { ...prev };
                          delete next[a];
                          return next;
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="agent-hint">
              Tweaks live in memory only — re-run the query to see routing change. Nothing edits the
              source.
            </p>
          </Frame>
        </div>

        <Frame title={`KNOWLEDGE BASE · ${filteredFaqs.length}`} className="agent-fill agent-kb">
          <input
            type="text"
            spellCheck={false}
            aria-label="Filter knowledge base"
            className="agent-filter"
            placeholder="Filter FAQs…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="agent-faq-list">
            {filteredFaqs.map((f) => (
              <details key={f.slug + f.question} className="agent-faq">
                <summary>
                  <span className="agent-faq-name">{f.name}</span>
                  {f.question}
                </summary>
                <p>{f.answer}</p>
                <button
                  type="button"
                  className="agent-faq-test"
                  onClick={() => {
                    setInput(f.question);
                    run(f.question);
                  }}
                >
                  ▶ Test this question
                </button>
              </details>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Mode: Sources -------------------------------------------------------- */

function SourcesMode() {
  const [input, setInput] = useState("");
  const [comparison, setComparison] = useState<{
    tfidf: ReturnType<typeof debugAnswer>;
    fuse: { label: string; score: number; answer: string } | null;
    keyword: { label: string; score: number; answer: string } | null;
  } | null>(null);

  async function compare(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tfidf = debugAnswer(trimmed);
    const fuse = await runFuse(trimmed);
    const keyword = runKeyword(trimmed);
    setComparison({ tfidf, fuse, keyword });
  }

  return (
    <div className="agent-mode">
      <Frame dark title="DEPENDENCY TREE">
        <pre className="agent-tree">{`answers.ts
  ├── services.ts (${services.length} services × ${FAQ_COUNT} FAQs)
  ├── shop.mjs (hours, phone, address, email)
  ├── shop-hours.mjs (live open/closed status)
  ├── SYNONYMS map (${STUDIO_CONFIG.synonyms.length} entries)
  ├── STOPWORDS list (${STUDIO_CONFIG.stopwords.length} entries)
  └── THRESHOLD (${STUDIO_CONFIG.threshold})`}</pre>
      </Frame>

      <Frame title="BACKEND COMPARISON" className="agent-fill">
        <form
          className="agent-lab"
          onSubmit={(e) => {
            e.preventDefault();
            compare(input);
          }}
        >
          <div className="agent-lab-input">
            <input
              type="text"
              spellCheck={false}
              aria-label="Compare backends on a question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Compare backends on a question…"
            />
            <button type="submit">Compare</button>
          </div>
        </form>

        {comparison && (
          <div className="agent-compare">
            <div className="agent-compare-col">
              <h4>Custom TF-IDF</h4>
              <p>{comparison.tfidf.answer.text}</p>
              <Terminal>
                {comparison.tfidf.matched
                  ? `${comparison.tfidf.matched.kind} · ${comparison.tfidf.matched.score.toFixed(2)}`
                  : "fallback"}
              </Terminal>
            </div>
            <div className="agent-compare-col">
              <h4>Fuse.js fuzzy</h4>
              {comparison.fuse ? (
                <>
                  <p>{comparison.fuse.answer}</p>
                  <Terminal>
                    {comparison.fuse.label} · {comparison.fuse.score.toFixed(2)}
                  </Terminal>
                </>
              ) : (
                <p className="agent-fallback">no match</p>
              )}
            </div>
            <div className="agent-compare-col">
              <h4>Keyword overlap</h4>
              {comparison.keyword ? (
                <>
                  <p>{comparison.keyword.answer}</p>
                  <Terminal>
                    {comparison.keyword.label} · {comparison.keyword.score.toFixed(2)}
                  </Terminal>
                </>
              ) : (
                <p className="agent-fallback">no match</p>
              )}
            </div>
          </div>
        )}
      </Frame>
    </div>
  );
}

let fusePromise: Promise<unknown> | null = null;

async function getFuseIndex(): Promise<unknown> {
  // Build the index once per session — rebuilding it on every comparison
  // click is wasteful (and the previous version of this file did).
  if (fusePromise) return fusePromise;
  fusePromise = (async () => {
    const { default: Fuse } = await import("fuse.js");
    const docs = services.flatMap((s) =>
      s.faqs.map((f) => ({ question: f.question, answer: f.answer, name: s.name })),
    );
    return new Fuse(docs, { keys: ["question"], includeScore: true, threshold: 0.4 });
  })();
  return fusePromise;
}

async function runFuse(text: string) {
  const fuse = (await getFuseIndex()) as {
    search: (q: string) => Array<{
      item: { name: string; answer: string };
      score?: number;
    }>;
  };
  const res = fuse.search(text)[0];
  if (!res) return null;
  return { label: res.item.name, score: 1 - (res.score ?? 1), answer: res.item.answer };
}

function runKeyword(text: string) {
  const tokens = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((t) => t.length > 2),
  );
  let best: { label: string; score: number; answer: string } | null = null;
  for (const s of services) {
    for (const f of s.faqs) {
      const qTokens = new Set(
        f.question
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .split(" ")
          .filter((t) => t.length > 2),
      );
      let overlap = 0;
      for (const t of tokens) if (qTokens.has(t)) overlap++;
      if (overlap > 0 && (!best || overlap > best.score)) {
        best = { label: s.name, score: overlap, answer: f.answer };
      }
    }
  }
  return best;
}

/* --- Mode: History -------------------------------------------------------- */

function HistoryMode() {
  const [entries, setEntries] = useLocalStorage<HistoryEntry[]>("agent-history", EMPTY_LIST);
  const [filter, setFilter] = useState<"all" | "matched" | "fallback">("all");
  const [characterFilter, setCharacterFilter] = useState<string>("all");

  function clear() {
    setEntries([]);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-test-history.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const visible = entries.filter((e) => {
    if (filter === "matched" && e.matched === null) return false;
    if (filter === "fallback" && e.matched !== null) return false;
    if (characterFilter !== "all" && e.characterId !== characterFilter) return false;
    return true;
  });

  // Distinct character ids in the log, for the per-character filter dropdown.
  const characterIds = Array.from(new Set(entries.map((e) => e.characterId))).sort();

  return (
    <div className="agent-mode">
      <Frame title={`TEST LOG · ${visible.length}`} className="agent-fill">
        <div className="agent-history-toolbar">
          <div className="agent-seg">
            {(["all", "matched", "fallback"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={f === filter ? "is-active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="agent-history-actions">
            <select
              aria-label="Filter by character"
              value={characterFilter}
              onChange={(e) => setCharacterFilter(e.target.value)}
            >
              <option value="all">all characters</option>
              {characterIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <button type="button" onClick={exportJson}>
              Export JSON
            </button>
            <button type="button" onClick={clear}>
              Clear
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="agent-empty">
            No test history yet — run a query in Brain or Test Drive mode. Looking for likes, hates,
            and notes? Those live in Feedback.
          </p>
        ) : (
          <div className="agent-history-list">
            {visible.map((e) => (
              <details key={e.id} className="agent-history-row">
                <summary>
                  <span className="agent-history-time">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                  <span className="agent-history-q">{e.question}</span>
                  <span className="agent-history-match">{e.matched ?? "fallback"}</span>
                  <span className="agent-history-score">
                    {e.score !== null ? e.score.toFixed(2) : "—"}
                  </span>
                </summary>
                <p>{e.answer}</p>
                {e.characterId && <p className="agent-history-char">character: {e.characterId}</p>}
              </details>
            ))}
          </div>
        )}
      </Frame>
    </div>
  );
}

/* --- Mode: Settings ------------------------------------------------------- */

function SettingsMode({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
}) {
  function reset() {
    setSettings(DEFAULT_SETTINGS);
    // Wipe every key the studio owns instead of enumerating them — adding a
    // new key shouldn't require editing this list.
    if (typeof window !== "undefined") {
      for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("agent-")) window.localStorage.removeItem(key);
      }
      writeStorage("agent-looks", DEFAULT_LOOKS);
      writeStorage("agent-history", []);
      writeStorage("agent-notes", []);
    }
  }

  return (
    <div className="agent-mode">
      <Frame title="OPTIONS" className="agent-settings-frame">
        <div className="agent-controls agent-controls-stack">
          <label className="agent-field">
            <span>CRT scanlines</span>
            <select
              value={settings.scanlines}
              onChange={(e) =>
                setSettings({ ...settings, scanlines: e.target.value as Settings["scanlines"] })
              }
            >
              <option value="off">Off</option>
              <option value="subtle">Subtle</option>
              <option value="full">Full</option>
            </select>
          </label>
          <label className="agent-field">
            <span>Terminal font size</span>
            <select
              value={settings.fontSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fontSize: Number(e.target.value) as Settings["fontSize"],
                })
              }
            >
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
            </select>
          </label>
          <label className="agent-field">
            <span>Animation speed</span>
            <select
              value={settings.speed}
              onChange={(e) =>
                setSettings({ ...settings, speed: Number(e.target.value) as Settings["speed"] })
              }
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
            </select>
          </label>
          <label className="agent-toggle">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => setSettings({ ...settings, reducedMotion: e.target.checked })}
            />
            <span>Reduced motion</span>
          </label>
        </div>
        <button type="button" className="agent-reset" onClick={reset}>
          Reset all settings
        </button>
      </Frame>
    </div>
  );
}

/* --- Mode: Code ----------------------------------------------------------- */

const CODE_SOURCES: { id: string; label: string; get: () => string }[] = [
  {
    id: "answers",
    label: "answers.ts",
    get: () => `// src/lib/chat/answers.ts — Tread's local Q&A brain
// ${services.length} services, ${FAQ_COUNT} FAQs, ${STUDIO_CONFIG.intents.length} intents,
// ${STUDIO_CONFIG.synonyms.length} synonyms, ${STUDIO_CONFIG.stopwords.length} stopwords,
// threshold ${STUDIO_CONFIG.threshold}.
//
// Pipeline: tokenize → stem → synonym-map → drop stopwords →
// score every entry (weight × IDF) → best intent/faq/service above threshold.
// No network, no API, no model — runs in the browser and in node --test.`,
  },
  {
    id: "services",
    label: "services.ts (FAQs)",
    get: () =>
      services
        .map(
          (s) =>
            `## ${s.name} (${s.slug})\n${s.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`,
        )
        .join("\n\n"),
  },
  {
    id: "pixel",
    label: "pixel-crew.ts",
    get: () => `// src/components/agent/pixel-crew.ts — canvas-2D characters
// Crew: ${PIXEL_CREW.map((c) => c.name).join(", ")}.
// Icons: ${PART_ICONS.map((c) => c.name).join(", ")} — faceless part icons.
// Retro: ${RETRO_CREW.map((c) => c.name).join(", ")} — cloud-bots with terminal faces.
// Tire bots: ${TIRE_BOTS.map((c) => c.name).join(", ")} — tire heads on bot bodies.
// All on a ${PIXEL_GRID}×${PIXEL_GRID} grid, each a pure draw(ctx, frame, emote)
// using fillRect primitives, scaled with image-rendering: pixelated.
// No sprites, no downloads.
//
// part-objects-3d.ts — the faceless 3D Objects theme (${OBJECTS_3D.map((o) => o.name).join(", ")}):
// procedural THREE meshes behind a lazy next/dynamic canvas, so Three.js
// only downloads when the set is on screen.`,
  },
];

function CodeMode() {
  const [sourceId, setSourceId] = useState("answers");
  const source = CODE_SOURCES.find((s) => s.id === sourceId) ?? CODE_SOURCES[0];
  return (
    <div className="agent-mode">
      <Frame dark title={source.label.toUpperCase()} className="agent-fill">
        <div className="agent-code-tabs">
          {CODE_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === sourceId ? "is-active" : ""}
              onClick={() => setSourceId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <pre className="agent-code">{source.get()}</pre>
      </Frame>
    </div>
  );
}

/* --- History helper (module-level, shared) -------------------------------- */

function appendHistory(
  question: string,
  res: ReturnType<typeof debugAnswer>,
  options?: { characterId?: string },
) {
  if (typeof window === "undefined") return;
  const list = readStorage<HistoryEntry[]>("agent-history", []);
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question,
    answer: res.answer.text,
    matched: res.matched ? `${res.matched.kind}:${res.matched.id}` : null,
    score: res.matched ? res.matched.score : null,
    characterId: options?.characterId,
    timestamp: Date.now(),
  });
  writeStorage("agent-history", list.slice(0, 200));
}

function appendNote(note: Omit<Note, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  const list = readStorage<Note[]>("agent-notes", []);
  list.unshift({
    ...note,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  });
  writeStorage("agent-notes", list.slice(0, 300));
}

/* --- Mode: Demo (live agent test drive) ------------------------------------ */

type DemoMessage = {
  id: number;
  role: "tread" | "user";
  text: string;
  chips?: ChatChip[];
  question?: string;
  rated?: "like" | "hate";
};

let demoId = 0;
function nextDemoId(): number {
  demoId += 1;
  return demoId;
}

function DemoMode({ characterId, settings }: { characterId: string; settings: Settings }) {
  const character = findCharacter(characterId);
  // One persona object per sprite — the brain auto-fills greeting, identity,
  // and fallback copy from it.
  const persona = { name: character.name, ...character.persona };
  const [messages, setMessages] = useState<DemoMessage[]>([
    { id: nextDemoId(), role: "tread", text: treadGreeting(new Date(), persona) },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [emote, setEmote] = useState<PixelEmote>("idle");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking]);

  // Re-introduce when the agent changes — the chat always uses the picked
  // name. Adjusted during render (not in an effect) so the log never shows a
  // stale greeting from the previous character.
  const [greetedId, setGreetedId] = useState(character.id);
  if (greetedId !== character.id) {
    setGreetedId(character.id);
    setMessages([{ id: nextDemoId(), role: "tread", text: treadGreeting(new Date(), persona) }]);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { id: nextDemoId(), role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    setEmote("thinking");
    const delay = settings.reducedMotion ? 0 : 400;
    window.setTimeout(() => {
      const answer = answerQuestion(trimmed, new Date(), { persona });
      setMessages((m) => [
        ...m,
        {
          id: nextDemoId(),
          role: "tread",
          text: answer.text,
          chips: answer.chips,
          question: trimmed,
        },
      ]);
      setThinking(false);
      setEmote(
        answer.fallback
          ? "sleep"
          : answer.chips.some((c) => c.kind === "download")
            ? "happy"
            : "idle",
      );
      // Persist the question + answer to the same history log Brain mode
      // writes to — without this, Test Drive's audit trail is just ratings
      // in Feedback and the questions themselves are lost when the tester
      // navigates away.
      appendHistory(trimmed, debugAnswer(trimmed, new Date(), { persona }), {
        characterId: character.id,
      });
    }, delay);
  }

  function rate(message: DemoMessage, rating: "like" | "hate") {
    setMessages((m) => m.map((msg) => (msg.id === message.id ? { ...msg, rated: rating } : msg)));
    appendNote({
      mode: "demo",
      characterId: character.id,
      rating,
      text: message.question ? `Q: ${message.question}\nA: ${message.text}` : message.text,
    });
  }

  return (
    <div className="agent-mode">
      <div className="agent-demo">
        <Frame dark title="LIVE CHAT · CONTACT PAGE PREVIEW" className="agent-demo-frame">
          <div className="agent-demo-head">
            <PixelCanvas
              character={character}
              emote={emote}
              speed={settings.speed}
              reducedMotion={settings.reducedMotion}
              tint={0}
              size={72}
              className="agent-pixel"
            />
            <div className="agent-demo-title">
              <strong>{character.name}</strong>
              <span>Local answers · no data leaves your device</span>
            </div>
          </div>

          <div className="agent-demo-log" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`agent-msg agent-msg-${m.role}`}>
                <div className="agent-bubble">
                  <p>{m.text}</p>
                  {m.chips && m.chips.length > 0 && (
                    <div className="agent-chips">
                      {m.chips.map((chip) => (
                        <ChipLink key={chip.href + chip.label} chip={chip} />
                      ))}
                    </div>
                  )}
                  {m.role === "tread" && m.question && (
                    <div className="agent-rate">
                      <button
                        type="button"
                        className={m.rated === "like" ? "is-active" : ""}
                        aria-label="Like this answer"
                        onClick={() => rate(m, "like")}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className={m.rated === "hate" ? "is-active" : ""}
                        aria-label="Hate this answer"
                        onClick={() => rate(m, "hate")}
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="agent-msg agent-msg-tread">
                <div className="agent-bubble agent-thinking">
                  <span className="agent-dot" />
                  <span className="agent-dot" />
                  <span className="agent-dot" />
                </div>
              </div>
            )}
          </div>

          <div className="agent-prompts">
            {quickPrompts.map((p) => (
              <button key={p} type="button" onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>

          <form
            className="agent-lab-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Ask the agent a question"
            />
            <button type="submit">Send</button>
          </form>
        </Frame>

        <Frame title="HOW TO EVALUATE" className="agent-demo-side">
          <ol className="agent-eval-list">
            <li>Pick a crew member in Character.</li>
            <li>Chat here exactly like a customer would.</li>
            <li>
              Hit <strong>▲</strong> on answers you like, <strong>▼</strong> on ones you hate.
            </li>
            <li>Everything is logged to Feedback — export it and hand it over.</li>
          </ol>
          <div className="agent-badges">
            {FEATURES.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Frame>
      </div>
    </div>
  );
}

/* --- Mode: Notes (research feedback) --------------------------------------- */

function NotesMode() {
  const [notes, setNotes] = useLocalStorage<Note[]>("agent-notes", EMPTY_LIST);
  const [filter, setFilter] = useState<"all" | "like" | "hate" | "note">("all");

  function remove(id: string) {
    setNotes(notes.filter((n) => n.id !== id));
  }

  function clear() {
    setNotes([]);
  }

  function exportMarkdown() {
    const lines = [
      "# Agent feedback",
      "",
      ...notes.map((n) => {
        const icon = n.rating === "like" ? "👍" : n.rating === "hate" ? "👎" : "📝";
        return `## ${icon} ${n.rating.toUpperCase()} — ${n.mode} / ${n.characterId}\n_${new Date(n.timestamp).toLocaleString()}_\n\n${n.text}\n`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-feedback.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const visible = notes.filter((n) => (filter === "all" ? true : n.rating === filter));
  const counts = {
    like: notes.filter((n) => n.rating === "like").length,
    hate: notes.filter((n) => n.rating === "hate").length,
    note: notes.filter((n) => n.rating === "note").length,
  };

  return (
    <div className="agent-mode">
      <Frame title={`FEEDBACK LOG · ${visible.length}`} className="agent-fill">
        <div className="agent-history-toolbar">
          <div className="agent-seg">
            {(["all", "like", "hate", "note"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={f === filter ? "is-active" : ""}
                onClick={() => setFilter(f)}
              >
                {f} {f !== "all" && `(${counts[f]})`}
              </button>
            ))}
          </div>
          <div className="agent-history-actions">
            <button type="button" onClick={exportMarkdown}>
              Export MD
            </button>
            <button type="button" onClick={clear}>
              Clear
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="agent-empty">
            No feedback yet — rate answers in Test Drive, or add a note with the ✎ button.
          </p>
        ) : (
          <div className="agent-notes-list">
            {visible.map((n) => (
              <article key={n.id} className={`agent-note agent-note-${n.rating}`}>
                <header>
                  <span className="agent-note-icon">
                    {n.rating === "like" ? "▲" : n.rating === "hate" ? "▼" : "✎"}
                  </span>
                  <span className="agent-note-meta">
                    {n.mode} · {n.characterId} · {new Date(n.timestamp).toLocaleString()}
                  </span>
                  <button type="button" aria-label="Delete note" onClick={() => remove(n.id)}>
                    ×
                  </button>
                </header>
                {n.target && <p className="agent-note-target">◎ {n.target}</p>}
                <p>{n.text}</p>
              </article>
            ))}
          </div>
        )}
      </Frame>
    </div>
  );
}

/* --- Floating notepad (quick-add on every page) ---------------------------- */

/** Build a short human-readable descriptor for a picked element. */
function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const cls =
    typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  return `${tag}${cls}${text ? ` — "${text}"` : ""}`;
}

function NotePad({ mode, characterId }: { mode: Mode; characterId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<Note["rating"]>("note");
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [saved, setSaved] = useState(false);

  // While picking, track the hovered element and capture it on click.
  useEffect(() => {
    if (!picking) return;
    function onMove(e: MouseEvent) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) setHoverRect(el.getBoundingClientRect());
    }
    function onClick(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) setTarget(describeElement(el));
      setPicking(false);
      setHoverRect(null);
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPicking(false);
        setHoverRect(null);
        setOpen(true);
      }
    }
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [picking]);

  function startPicking() {
    setPicking(true);
    setOpen(false);
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed && !target) return;
    appendNote({ mode, characterId, rating, text: trimmed, target: target ?? undefined });
    setText("");
    setTarget(null);
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 700);
  }

  return (
    <>
      <button
        type="button"
        className="agent-notepad-fab"
        aria-label="Add a research note"
        onClick={() => setOpen((o) => !o)}
      >
        ✎
      </button>

      {picking && (
        <>
          <div className="agent-pick-banner">Click any element to target it · Esc to cancel</div>
          {hoverRect && (
            <div
              className="agent-pick-highlight"
              style={{
                top: hoverRect.top,
                left: hoverRect.left,
                width: hoverRect.width,
                height: hoverRect.height,
              }}
            />
          )}
        </>
      )}

      {open && (
        <div className="agent-notepad">
          <div className="agent-notepad-head">
            <strong>Note</strong>
            <span>
              {mode} · {characterId}
            </span>
          </div>
          <div className="agent-seg">
            {(["like", "hate", "note"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={r === rating ? "is-active" : ""}
                onClick={() => setRating(r)}
              >
                {r === "like" ? "▲" : r === "hate" ? "▼" : "✎"} {r}
              </button>
            ))}
          </div>

          {target ? (
            <div className="agent-notepad-target">
              <span>◎ {target}</span>
              <button type="button" aria-label="Clear target" onClick={() => setTarget(null)}>
                ×
              </button>
            </div>
          ) : (
            <button type="button" className="agent-notepad-pick" onClick={startPicking}>
              ◎ Target an element
            </button>
          )}

          <textarea
            value={text}
            spellCheck={false}
            aria-label="Research note"
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you like or hate here?"
            rows={3}
          />
          <button type="button" className="agent-notepad-save" onClick={submit}>
            {saved ? "Saved ✓" : "Save note"}
          </button>
        </div>
      )}
    </>
  );
}

/* --- Shell ---------------------------------------------------------------- */

export function AgentStudio({ mode }: { mode: Mode }): JSX.Element {
  // Persisted state flows through useSyncExternalStore (see use-local-storage.ts):
  // SSR-safe, no hydration mismatch, and stays in sync across components.
  const [settings, setSettings] = useLocalStorage("agent-settings", DEFAULT_SETTINGS);
  const [looks, setLooks] = useLocalStorage("agent-looks", DEFAULT_LOOKS);

  // Subscribe to OS-level prefers-reduced-motion and mirror it into the
  // studio's manual toggle. The production widget does this in a lazy init;
  // the studio needs the listener because testers flip the OS setting mid-
  // session and expect the studio to follow.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSettings({ ...settings, reducedMotion: mql.matches });
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
    // We deliberately depend on the spread so the listener always reads the
    // latest settings without forcing a re-bind each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reducedMotion]);

  const scanlineClass =
    settings.scanlines === "off"
      ? ""
      : settings.scanlines === "subtle"
        ? "agent-scan-subtle"
        : "agent-scan-full";

  const active = MODES.find((m) => m.id === mode) ?? MODES[0];
  const agent = findCharacter(looks.characterId);

  function pickAgent(id: string) {
    const owner = CHARACTER_SETS.find((s) => s.characters.some((c) => c.id === id));
    setLooks({ ...looks, setId: owner?.id ?? looks.setId, characterId: id });
  }

  return (
    <div
      className={`agent-studio ${scanlineClass}`}
      style={{ "--agent-font-size": `${settings.fontSize}px` } as React.CSSProperties}
    >
      <aside className="agent-sidebar">
        <h1 className="agent-logo">AGENT STUDIO</h1>
        <nav className="agent-nav">
          {MODES.map((m) => (
            <Link
              key={m.id}
              href={m.id === "character" ? "/agent" : `/agent/${m.id}`}
              className={m.id === mode ? "is-active" : ""}
            >
              {m.id === mode ? "▸" : " "} {m.label}
            </Link>
          ))}
        </nav>

        <div className="agent-side-agent">
          <span className="agent-side-agent-label">YOUR AGENT</span>
          <PixelCanvas
            character={agent}
            emote="idle"
            speed={settings.speed}
            reducedMotion={settings.reducedMotion}
            tint={0}
            size={56}
            className="agent-pixel agent-pixel-sm"
          />
          <span className="agent-side-agent-name">{agent.name}</span>
          <select
            value={agent.id}
            onChange={(e) => pickAgent(e.target.value)}
            aria-label="Pick your agent — used on every page"
          >
            {CHARACTER_SETS.map((s) => (
              <optgroup key={s.id} label={s.label}>
                {s.characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="agent-sidebar-foot">
          <p>noindex · dev only</p>
          <p>{shop.phone.display}</p>
        </div>
      </aside>

      <main className="agent-main">
        <header className="agent-main-head">
          <div>
            <h2>{active.label}</h2>
            <p className="agent-main-sub">{active.sub}</p>
          </div>
          <div className="agent-feature-strip">
            {FEATURES.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </header>

        {mode === "character" && (
          <LooksMode looks={looks} setLooks={setLooks} settings={settings} />
        )}
        {mode === "motion" && (
          <BehaviorMode looks={looks} setLooks={setLooks} settings={settings} />
        )}
        {mode === "testdrive" && <DemoMode characterId={looks.characterId} settings={settings} />}
        {mode === "brain" && <BrainsMode />}
        {mode === "engine" && <SourcesMode />}
        {mode === "results" && <HistoryMode />}
        {mode === "feedback" && <NotesMode />}
        {mode === "options" && <SettingsMode settings={settings} setSettings={setSettings} />}
        {mode === "source" && <CodeMode />}
      </main>

      <NotePad mode={mode} characterId={looks.characterId} />
    </div>
  );
}
