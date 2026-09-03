"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { arcadePresets } from "@/lib/arcade/arcade";
import { garageAudio } from "@/lib/arcade/garage-audio";
import { PrizeBanner } from "./prize";

const CONFIG = arcadePresets.lotDefender;
type Intensity = keyof typeof CONFIG.levels;

const BEST_KEY = "ohat-lotdefender-best";

// Fixed logical canvas; CSS scales it. Same trick the other canvas games use,
// so the physics never depend on the viewport.
const W = 320;
const H = 240;
// The defended cars sit on their own line, clear of the sweeper's lane below
// them — otherwise the truck is drawn straight over the row it is protecting.
const CAR_TOP = H - 56;
const TRUCK_Y = H - 18;
const TRUCK_W = 30;

type Hazard = { x: number; y: number; kind: number; alive: boolean };
type Shot = { x: number; y: number };

// Shop crates a cleared hazard sometimes leaves behind.
type PowerKind = "spare" | "rapid" | "twin" | "slow";
type Crate = { x: number; y: number; kind: PowerKind };

const POWER_FRAMES = 420; // ~7 seconds of a timed upgrade
const POWER_BADGE: Record<PowerKind, { mark: string; label: string; tint: string }> = {
  spare: { mark: "+", label: "Spare sweeper", tint: "#68a56f" },
  rapid: { mark: "R", label: "Rapid magnet", tint: "#f6bd38" },
  twin: { mark: "W", label: "Twin pulse", tint: "#8fb7c4" },
  slow: { mark: "S", label: "Slow drift", tint: "#e0555a" },
};

type Run = {
  truckX: number;
  moving: -1 | 0 | 1;
  hazards: Hazard[];
  shots: Shot[];
  falling: Shot[];
  marchDir: 1 | -1;
  marchIn: number;
  fireIn: number;
  cooldown: number;
  wave: number;
  lives: number;
  cleared: number;
  flash: number;
  crates: Crate[];
  // Frames remaining on each timed upgrade.
  rapid: number;
  twin: number;
  slow: number;
};

function buildWave(level: Intensity, wave: number): Hazard[] {
  const settings = CONFIG.levels[level];
  const hazards: Hazard[] = [];
  for (let row = 0; row < settings.rows; row += 1) {
    for (let col = 0; col < settings.cols; col += 1) {
      hazards.push({
        x: 26 + col * 34,
        // Each wave starts a touch lower — the squeeze, not extra speed, is
        // what makes a later wave harder.
        y: 26 + row * 24 + (wave - 1) * 8,
        kind: row % 3,
        alive: true,
      });
    }
  }
  return hazards;
}

function freshRun(
  level: Intensity,
  wave = 1,
  // Explicitly numbers: the presets are `as const`, so inferring from them
  // would narrow these to the literal values in the table.
  lives: number = CONFIG.levels[level].lives,
  cleared: number = 0,
): Run {
  return {
    truckX: W / 2,
    moving: 0,
    hazards: buildWave(level, wave),
    shots: [],
    falling: [],
    marchDir: 1,
    marchIn: CONFIG.levels[level].marchFrames,
    fireIn: CONFIG.levels[level].fireFrames,
    cooldown: 0,
    wave,
    lives,
    cleared,
    flash: 0,
    crates: [],
    rapid: 0,
    twin: 0,
    slow: 0,
  };
}

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Lot Defender — Space Invaders reimagined as the night before a busy day:
 * a storm of nails, screws and bolts drifts down onto the cars parked in the
 * lot, and the shop's magnet sweeper runs the bottom line picking them off
 * before they reach the tires.
 */
export function LotDefender() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState<Intensity>(CONFIG.defaultLevel);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hud, setHud] = useState<{
    cleared: number;
    lives: number;
    wave: number;
    powers: readonly PowerKind[];
  }>({ cleared: 0, lives: 0, wave: 1, powers: [] });
  const [best, setBest] = useState(0);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);
  const runningRef = useRef(false);
  const levelRef = useRef<Intensity>(CONFIG.defaultLevel);
  const run = useRef<Run>(freshRun(CONFIG.defaultLevel));
  // Touch play: the sweeper follows the finger across the lot, and a tap
  // (touch with no real travel) fires. The buttons below stay as the
  // alternative — some players prefer them.
  const touchMoved = useRef(false);

  /** Maps a touch's client x onto the logical canvas and parks the sweeper. */
  function sweepToTouch(event: React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.touches[0].clientX - rect.left) / rect.width) * W;
    run.current.truckX = Math.max(TRUCK_W / 2, Math.min(W - TRUCK_W / 2, x));
  }

  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const fire = useCallback(() => {
    const r = run.current;
    if (!runningRef.current || r.cooldown > 0) return;
    // Twin pulse throws a magnet either side of the head.
    if (r.twin > 0) {
      r.shots.push({ x: r.truckX - 8, y: TRUCK_Y - 8 }, { x: r.truckX + 8, y: TRUCK_Y - 8 });
    } else {
      r.shots.push({ x: r.truckX, y: TRUCK_Y - 8 });
    }
    const base = CONFIG.levels[levelRef.current].shotCooldown;
    r.cooldown = r.rapid > 0 ? Math.max(4, Math.round(base / 2)) : base;
    if (soundOn.current) garageAudio.beep(r.twin > 0 ? 990 : 880);
  }, []);

  const start = useCallback((nextLevel = levelRef.current) => {
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    run.current = freshRun(nextLevel);
    setHud({ cleared: 0, lives: CONFIG.levels[nextLevel].lives, wave: 1, powers: [] });
    setBest(readBest());
    setOver(false);
    setWon(false);
    if (soundOn.current) garageAudio.ignition();
    runningRef.current = true;
    setRunning(true);
  }, []);

  // Keyboard: arrows or A/D to sweep, space to fire.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const r = run.current;
      if (["ArrowLeft", "KeyA"].includes(event.code)) {
        r.moving = -1;
        event.preventDefault();
      }
      if (["ArrowRight", "KeyD"].includes(event.code)) {
        r.moving = 1;
        event.preventDefault();
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (runningRef.current) fire();
        else start();
      }
    };
    const up = (event: KeyboardEvent) => {
      const r = run.current;
      if (["ArrowLeft", "KeyA"].includes(event.code) && r.moving === -1) r.moving = 0;
      if (["ArrowRight", "KeyD"].includes(event.code) && r.moving === 1) r.moving = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [fire, start]);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const settings = CONFIG.levels[levelRef.current];

    let raf = 0;
    let frame = 0;

    const endRun = (didWin: boolean) => {
      runningRef.current = false;
      setRunning(false);
      setOver(true);
      setWon(didWin);
      const total = run.current.cleared;
      setBest((current) => {
        if (total <= current) return current;
        try {
          window.localStorage.setItem(BEST_KEY, String(total));
        } catch {
          /* fine without */
        }
        return total;
      });
      if (soundOn.current) (didWin ? garageAudio.fanfare : garageAudio.skid)();
      draw(ctx, run.current, true, didWin);
    };

    const step = () => {
      const r = run.current;
      frame += 1;

      r.truckX = Math.max(
        TRUCK_W / 2,
        Math.min(W - TRUCK_W / 2, r.truckX + r.moving * settings.truckSpeed),
      );
      if (r.cooldown > 0) r.cooldown -= 1;
      if (r.flash > 0) r.flash -= 1;
      if (r.rapid > 0) r.rapid -= 1;
      if (r.twin > 0) r.twin -= 1;
      if (r.slow > 0) r.slow -= 1;

      // Crates fall to the sweeper's lane and are picked up by driving into them.
      for (const crate of r.crates) crate.y += 1.3;
      for (const crate of r.crates) {
        if (
          Math.abs(crate.x - r.truckX) < TRUCK_W / 2 + 4 &&
          crate.y > TRUCK_Y - 12 &&
          crate.y < TRUCK_Y + 12
        ) {
          crate.y = H + 99;
          if (crate.kind === "spare") r.lives = Math.min(6, r.lives + 1);
          if (crate.kind === "rapid") r.rapid = POWER_FRAMES;
          if (crate.kind === "twin") r.twin = POWER_FRAMES;
          if (crate.kind === "slow") r.slow = POWER_FRAMES;
          if (soundOn.current) garageAudio.rev();
        }
      }
      r.crates = r.crates.filter((crate) => crate.y < H);

      // March: the swarm steps sideways, then drops a row at the edge.
      r.marchIn -= 1;
      if (r.marchIn <= 0) {
        const alive = r.hazards.filter((h) => h.alive);
        const hitEdge = alive.some(
          (h) => h.x + r.marchDir * 8 < 12 || h.x + r.marchDir * 8 > W - 12,
        );
        if (hitEdge) {
          r.marchDir = (r.marchDir * -1) as 1 | -1;
          for (const h of alive) h.y += settings.dropStep;
        } else {
          for (const h of alive) h.x += r.marchDir * 8;
        }
        // Fewer left = faster, the pressure everyone remembers from the original.
        const pace = Math.max(
          6,
          Math.round(settings.marchFrames * (alive.length / r.hazards.length)),
        );
        r.marchIn = r.slow > 0 ? Math.round(pace * 1.75) : pace;
        if (soundOn.current && frame > 30) garageAudio.beep(120 + alive.length);
      }

      // Hazards shake loose and fall.
      r.fireIn -= 1;
      if (r.fireIn <= 0) {
        const alive = r.hazards.filter((h) => h.alive);
        if (alive.length > 0 && settings.fireFrames < 9999) {
          const from = alive[Math.floor(Math.random() * alive.length)];
          r.falling.push({ x: from.x, y: from.y + 6 });
        }
        r.fireIn = settings.fireFrames;
      }

      for (const shot of r.shots) shot.y -= 5;
      r.shots = r.shots.filter((shot) => shot.y > -6);
      for (const drop of r.falling) drop.y += settings.dropSpeed;
      r.falling = r.falling.filter((drop) => drop.y < H);

      // Shots vs hazards
      for (const shot of r.shots) {
        for (const h of r.hazards) {
          if (!h.alive) continue;
          if (Math.abs(h.x - shot.x) < 10 && Math.abs(h.y - shot.y) < 9) {
            h.alive = false;
            shot.y = -99;
            r.cleared += 1;
            if (Math.random() < settings.powerChance) {
              const pool = settings.powers;
              r.crates.push({
                x: h.x,
                y: h.y,
                kind: pool[Math.floor(Math.random() * pool.length)] as PowerKind,
              });
            }
            if (soundOn.current) garageAudio.horn();
            break;
          }
        }
      }
      r.shots = r.shots.filter((shot) => shot.y > -6);

      // Falling hazards vs the sweeper
      for (const drop of r.falling) {
        if (
          Math.abs(drop.x - r.truckX) < TRUCK_W / 2 &&
          drop.y > TRUCK_Y - 8 &&
          drop.y < TRUCK_Y + 10
        ) {
          drop.y = H + 1;
          r.lives -= 1;
          r.flash = 12;
          if (soundOn.current) garageAudio.skid();
        }
      }
      r.falling = r.falling.filter((drop) => drop.y < H);

      // Reached the parked cars, or the sweeper is out of lives.
      const alive = r.hazards.filter((h) => h.alive);
      if (r.lives <= 0 || alive.some((h) => h.y >= CAR_TOP - 6)) {
        endRun(false);
        return;
      }

      if (alive.length === 0) {
        if (r.wave >= settings.wavesToWin) {
          endRun(true);
          return;
        }
        const next = freshRun(levelRef.current, r.wave + 1, r.lives, r.cleared);
        // An upgrade you just earned should survive into the next wave.
        next.truckX = r.truckX;
        next.rapid = r.rapid;
        next.twin = r.twin;
        next.slow = r.slow;
        run.current = next;
        if (soundOn.current) garageAudio.fanfare();
      }

      if (frame % 6 === 0) {
        setHud({
          cleared: r.cleared,
          lives: r.lives,
          wave: r.wave,
          powers: (["rapid", "twin", "slow"] as const).filter((key) => r[key] > 0),
        });
      }
      draw(ctx, run.current, false, false);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const levelControls = (
    <div className="paper-game-difficulty" aria-label="Lot Defender intensity">
      {(Object.keys(CONFIG.levels) as Intensity[]).map((option) => (
        <button
          key={option}
          type="button"
          className={level === option ? "is-active" : ""}
          aria-pressed={level === option}
          onClick={() => (running ? start(option) : setLevel(option))}
        >
          {CONFIG.levels[option].label}
        </button>
      ))}
    </div>
  );

  if (!running && !over) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">Ocean Heights Overnight Lot</p>
        <h2>Lot Defender</h2>
        <p>
          A storm of nails and bolts is drifting down onto the cars parked out back. Run the magnet
          sweeper along the bottom line and pick them off before they reach the tires.
        </p>
        {levelControls}
        <p className="lot-defender-brief">{CONFIG.levels[level].brief}</p>
        <button type="button" className="button button-primary" onClick={() => start()}>
          Start the sweep
        </button>
      </div>
    );
  }

  const settings = CONFIG.levels[level];

  return (
    <div className="paper-game lot-defender">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">Ocean Heights Overnight Lot</p>
          <h2>Lot Defender</h2>
          {levelControls}
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          {!running ? (
            <button type="button" onClick={() => start()}>
              {over ? "New sweep" : "Start the sweep"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="match-game-bar">
        <dl className="match-game-score">
          <div>
            <dt>Swept</dt>
            <dd>{hud.cleared}</dd>
          </div>
          <div>
            <dt>Wave</dt>
            <dd>
              {hud.wave}/{settings.wavesToWin}
            </dd>
          </div>
          <div>
            <dt>Sweeper</dt>
            <dd>{"●".repeat(Math.max(0, hud.lives)) || "—"}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd>{best}</dd>
          </div>
        </dl>
        {hud.powers.length > 0 ? (
          <ul className="lot-defender-powers" aria-label="Active upgrades">
            {hud.powers.map((key) => (
              <li key={key}>{POWER_BADGE[key].label}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="match-game-status" role="status">
        {over
          ? won
            ? `Lot clear. ${hud.cleared} picked up across ${settings.wavesToWin} wave${settings.wavesToWin === 1 ? "" : "s"}.`
            : `The lot took a hit. You swept ${hud.cleared} before it got away.`
          : `Wave ${hud.wave} of ${settings.wavesToWin}. Keep them off the tires.`}
      </p>

      <canvas
        ref={canvasRef}
        className="lot-defender-lot"
        width={W}
        height={H}
        role="img"
        aria-label="Lot Defender: sweep falling nails and bolts away from the parked cars"
        onTouchStart={(event) => {
          touchMoved.current = false;
          if (!runningRef.current) {
            start();
            return;
          }
          sweepToTouch(event);
        }}
        onTouchMove={(event) => {
          if (!runningRef.current) return;
          touchMoved.current = true;
          sweepToTouch(event);
        }}
        onTouchEnd={() => {
          // A tap is a touch that never really travelled — sweep on release.
          if (runningRef.current && !touchMoved.current) fire();
        }}
      />

      <div className="lot-defender-controls" aria-label="Sweeper controls">
        <button
          type="button"
          aria-label="Sweep left"
          onPointerDown={() => {
            run.current.moving = -1;
          }}
          onPointerUp={() => {
            run.current.moving = 0;
          }}
          onPointerLeave={() => {
            run.current.moving = 0;
          }}
          onPointerCancel={() => {
            run.current.moving = 0;
          }}
        >
          ←
        </button>
        <button type="button" className="is-fire" onPointerDown={fire}>
          Sweep
        </button>
        <button
          type="button"
          aria-label="Sweep right"
          onPointerDown={() => {
            run.current.moving = 1;
          }}
          onPointerUp={() => {
            run.current.moving = 0;
          }}
          onPointerLeave={() => {
            run.current.moving = 0;
          }}
          onPointerCancel={() => {
            run.current.moving = 0;
          }}
        >
          →
        </button>
      </div>
      <p className="shore-run-keys">
        <span>
          <b>←</b> <b>→</b> move
        </span>
        <span>
          <b>Space</b> sweep
        </span>
        <span>On a phone: drag on the lot, tap to sweep</span>
      </p>

      {won && over ? (
        <PrizeBanner
          sound={sound}
          achievement={`Lot Defender cleared on ${settings.label.toLowerCase()}.`}
        />
      ) : null}
    </div>
  );
}

/* ---------------- rendering ---------------- */

function draw(ctx: CanvasRenderingContext2D, r: Run, ended: boolean, didWin: boolean) {
  // Night lot
  ctx.fillStyle = r.flash > 0 ? "#3d2422" : "#2b2725";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(246,189,56,.13)";
  ctx.lineWidth = 1;
  for (let x = 20; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CAR_TOP - 6);
    ctx.stroke();
  }

  // The cars being defended — the line you cannot let anything past.
  for (let i = 0; i < 5; i += 1) {
    const x = 14 + i * 62;
    ctx.fillStyle = ["#a8161c", "#1a7183", "#dff0f3", "#f6bd38", "#8d8676"][i];
    ctx.fillRect(x, CAR_TOP + 6, 44, 13);
    ctx.fillStyle = "#171412";
    ctx.fillRect(x + 9, CAR_TOP + 1, 24, 7);
    ctx.fillRect(x + 5, CAR_TOP + 18, 9, 4);
    ctx.fillRect(x + 30, CAR_TOP + 18, 9, 4);
  }

  // Hazards: a nail, a hex bolt, a screw.
  for (const h of r.hazards) {
    if (!h.alive) continue;
    if (h.kind === 0) {
      ctx.fillStyle = "#cfc9b8";
      ctx.fillRect(h.x - 1.5, h.y - 6, 3, 12);
      ctx.fillRect(h.x - 6, h.y - 8, 12, 3);
    } else if (h.kind === 1) {
      ctx.fillStyle = "#f6bd38";
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = h.x + Math.cos(a) * 7;
        const py = h.y + Math.sin(a) * 7;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2b2725";
      ctx.fillRect(h.x - 2.5, h.y - 2.5, 5, 5);
    } else {
      ctx.fillStyle = "#8fb7c4";
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + 7);
      ctx.lineTo(h.x - 5, h.y - 4);
      ctx.lineTo(h.x + 5, h.y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dff0f3";
      ctx.fillRect(h.x - 7, h.y - 7, 14, 3);
    }
  }

  // Magnet pulses going up, loose hardware coming down.
  ctx.fillStyle = "#f6bd38";
  for (const shot of r.shots) ctx.fillRect(shot.x - 1.5, shot.y - 6, 3, 8);
  ctx.fillStyle = "#e0555a";
  for (const drop of r.falling) ctx.fillRect(drop.x - 1.5, drop.y, 3, 7);

  // Shop crates on the way down, each marked with what it gives you.
  for (const crate of r.crates) {
    const badge = POWER_BADGE[crate.kind];
    ctx.fillStyle = badge.tint;
    ctx.fillRect(crate.x - 7, crate.y - 7, 14, 14);
    ctx.fillStyle = "#171412";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#171412";
    ctx.strokeRect(crate.x - 7.5, crate.y - 7.5, 15, 15);
    ctx.font = "900 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(badge.mark, crate.x, crate.y + 4);
  }

  // The sweeper truck
  const x = r.truckX;
  ctx.fillStyle = "#f6bd38";
  ctx.fillRect(x - TRUCK_W / 2, TRUCK_Y - 6, TRUCK_W, 12);
  ctx.fillStyle = "#171412";
  ctx.fillRect(x - 9, TRUCK_Y - 10, 14, 5);
  ctx.fillRect(x - 11, TRUCK_Y + 5, 7, 4);
  ctx.fillRect(x + 5, TRUCK_Y + 5, 7, 4);
  // Magnet head
  // Magnet head — wider and lit while the twin pulse is running.
  ctx.fillStyle = r.twin > 0 ? "#8fb7c4" : "#1a7183";
  ctx.fillRect(x - (r.twin > 0 ? 11 : 5), TRUCK_Y - 14, r.twin > 0 ? 22 : 10, 5);

  if (ended) {
    ctx.fillStyle = "rgba(23,20,18,.72)";
    ctx.fillRect(0, H / 2 - 22, W, 44);
    ctx.fillStyle = didWin ? "#f6bd38" : "#f7efd9";
    ctx.font = "900 17px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(didWin ? "L O T   C L E A R" : "G A M E   O V E R", W / 2, H / 2 + 6);
  }
}
