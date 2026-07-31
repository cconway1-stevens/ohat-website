"use client";

import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";
import { arcadePresets } from "@/lib/arcade";

const BEST_KEY = "ohat-shorerun-best";

// Logical canvas size. Kept small and fixed — CSS scales it to the screen —
// so the art stays chunky and the physics never depend on the viewport.
const W = 640;
const H = 200;
const GROUND = 158;

const GRAVITY = 0.62;
const JUMP_V = -11.4;
const DUCK_GRAVITY = 1.5;

// Grab this many coins and the prize unlocks. Deliberately gentle: coins sit
// at easy heights and come along often.
const COINS_TO_WIN = arcadePresets.shoreRun.coinsToWin;

// The car's roof sits at GROUND-38 standing and GROUND-24 ducking. Anything
// hanging overhead therefore has to reach below the first to threaten a
// standing car, and stop above the second to let a ducking one through. The
// signals used to stop 46px short of even the standing roof, so nothing
// overhead could ever hit you and ducking did nothing at all.
const ROOF_STANDING = GROUND - 38;
const ROOF_DUCKING = GROUND - 24;
const OVERHEAD_LOW = ROOF_DUCKING - 3;
const OVERHEAD_HIGH = ROOF_STANDING + 5;

type Obstacle =
  | { kind: "tires"; x: number; count: number }
  | { kind: "signal"; x: number; low: boolean }
  // A shore underpass: wide enough that you duck going in and hold it all
  // the way through, rather than tapping duck for a single frame.
  | { kind: "tunnel"; x: number; width: number };

type Coin = { x: number; y: number; taken: boolean };

type Cloud = { x: number; y: number; scale: number };

type Game = {
  y: number;
  vy: number;
  ducking: boolean;
  onGround: boolean;
  speed: number;
  distance: number;
  obstacles: Obstacle[];
  coins: Coin[];
  coinSpawnIn: number;
  clouds: Cloud[];
  spawnIn: number;
  night: boolean;
  nightFlash: number;
  groundOffset: number;
  wheelSpin: number;
};

function freshGame(): Game {
  return {
    y: 0,
    vy: 0,
    ducking: false,
    onGround: true,
    speed: 5.4,
    distance: 0,
    obstacles: [],
    coins: [],
    coinSpawnIn: 90,
    clouds: [
      { x: 420, y: 40, scale: 1 },
      { x: 620, y: 66, scale: 0.75 },
    ],
    spawnIn: 60,
    night: false,
    nightFlash: 0,
    groundOffset: 0,
    wheelSpin: 0,
  };
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

export function ShoreRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [coins, setCoins] = useState(0);
  const [won, setWon] = useState(false);
  const [reachedNight, setReachedNight] = useState(false);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);
  const game = useRef<Game>(freshGame());
  const coinTally = useRef(0);
  const runningRef = useRef(false);
  const touchedCanvas = useRef(false);

  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);

  function jump() {
    const g = game.current;
    if (!runningRef.current || !g.onGround) return;
    g.vy = JUMP_V;
    g.onGround = false;
    g.ducking = false;
    if (soundOn.current) garageAudio.rev();
  }

  function setDuck(on: boolean) {
    const g = game.current;
    if (!runningRef.current) return;
    g.ducking = on;
  }

  // Keyboard: space/up to hop the tires, down to duck the signal.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        if (runningRef.current) jump();
        else start();
      }
      if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        setDuck(true);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (["ArrowDown", "KeyS"].includes(event.code)) setDuck(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // `start` and `jump` only touch refs and setState, so binding once is
    // correct — they never read stale render values.
  }, []);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    // The score used to be pushed into React state on every single frame,
    // re-rendering the whole game ~60x a second just to move a counter. The
    // readout only needs to keep up with the eye, so it refreshes ~10x a
    // second instead; the crash still reports the exact final figure.
    let frame = 0;
    const step = () => {
      const g = game.current;
      frame += 1;

      g.distance += g.speed;
      // Gentler ramp than the original dino: this is a waiting-room game.
      g.speed = Math.min(11.5, 5.2 + g.distance / 7200);
      g.groundOffset = (g.groundOffset + g.speed) % 28;
      g.wheelSpin += g.speed / 9;

      // Car physics. Ducking pulls you down harder so it doubles as a
      // fast-fall, exactly like the dino.
      g.vy += g.ducking && !g.onGround ? DUCK_GRAVITY : GRAVITY;
      g.y += g.vy;
      if (g.y >= 0) {
        g.y = 0;
        g.vy = 0;
        g.onGround = true;
      }

      // Obstacles
      g.spawnIn -= 1;
      if (g.spawnIn <= 0) {
        const roll = Math.random();
        let extraGap = 0;
        // Tunnels come later than signals — by then you have met the duck.
        if (roll > 0.86 && g.distance > 3000) {
          const width = 108 + Math.round(Math.random() * 74);
          g.obstacles.push({ kind: "tunnel", x: W + 40, width });
          // Hold the next obstacle until the whole underpass has gone by.
          extraGap = Math.round(width / g.speed);
        } else if (roll > 0.62 && g.distance > 1600) {
          // Signals only start showing up once you have some speed, so the
          // opening stretch stays friendly.
          g.obstacles.push({ kind: "signal", x: W + 40, low: Math.random() > 0.45 });
        } else {
          g.obstacles.push({
            kind: "tires",
            x: W + 30,
            count: roll > 0.5 ? (roll > 0.82 ? 3 : 2) : 1,
          });
        }
        // Gap scales with speed so it stays clearable at any pace.
        g.spawnIn = Math.round((58 + Math.random() * 46) * (7.4 / g.speed)) + extraGap;
      }
      for (const ob of g.obstacles) ob.x -= g.speed;
      g.obstacles = g.obstacles.filter((ob) => ob.x > -obstacleWidth(ob) - 40);

      // Coins float at heights the car reaches with an ordinary hop, and
      // never right on top of an obstacle.
      g.coinSpawnIn -= 1;
      if (g.coinSpawnIn <= 0) {
        // Width-aware: a coin under a tunnel deck sits above the ducking roof
        // and could never be taken.
        const clear = g.obstacles.every((ob) => {
          const spawnX = W + 30;
          return spawnX < ob.x - 90 || spawnX > ob.x + obstacleWidth(ob) + 90;
        });
        if (clear) {
          g.coins.push({ x: W + 30, y: GROUND - 52 - Math.random() * 34, taken: false });
          g.coinSpawnIn = 110 + Math.random() * 90;
        } else {
          g.coinSpawnIn = 18;
        }
      }
      for (const coin of g.coins) coin.x -= g.speed;
      g.coins = g.coins.filter((coin) => coin.x > -30 && !coin.taken);

      for (const cloud of g.clouds) {
        cloud.x -= g.speed * 0.22 * cloud.scale;
        if (cloud.x < -90) {
          cloud.x = W + 40 + Math.random() * 160;
          cloud.y = 26 + Math.random() * 52;
          cloud.scale = 0.6 + Math.random() * 0.6;
        }
      }

      // Day/night flip, the detail everyone remembers from the original.
      // Set so a decent run actually reaches dusk rather than it being a
      // feature almost nobody sees.
      const phase = Math.floor(g.distance / 3400);
      const shouldBeNight = phase % 2 === 1;
      if (shouldBeNight !== g.night) {
        g.night = shouldBeNight;
        g.nightFlash = 1;
        if (shouldBeNight) setReachedNight(true);
      }
      g.nightFlash = Math.max(0, g.nightFlash - 0.02);

      // Collision
      const car = carBox(g);

      for (const coin of g.coins) {
        if (
          !coin.taken &&
          car.x < coin.x + 11 &&
          car.x + car.w > coin.x - 11 &&
          car.y < coin.y + 11 &&
          car.y + car.h > coin.y - 11
        ) {
          coin.taken = true;
          // The tally lives outside the run: crashing costs you the road,
          // never your coins, so the prize is a matter of persistence rather
          // than a clean five-coin run.
          coinTally.current += 1;
          g.distance += 240; // a coin is worth a little road
          setCoins(coinTally.current);
          if (soundOn.current) garageAudio.beep(880);
          if (coinTally.current === COINS_TO_WIN) {
            setWon(true);
            if (soundOn.current) garageAudio.horn();
          }
        }
      }

      for (const ob of g.obstacles) {
        for (const box of obstacleBoxes(ob)) {
          if (
            car.x < box.x + box.w &&
            car.x + car.w > box.x &&
            car.y < box.y + box.h &&
            car.y + car.h > box.y
          ) {
            runningRef.current = false;
            setRunning(false);
            setOver(true);
            if (soundOn.current) garageAudio.skid();
            const total = Math.floor(g.distance / 12);
            setScore(total);
            setBest((current) => {
              if (total <= current) return current;
              try {
                window.localStorage.setItem(BEST_KEY, String(total));
              } catch {
                // Fine without a stored best.
              }
              return total;
            });
            draw(ctx, g, true);
            return;
          }
        }
      }

      if (frame % 6 === 0) setScore(Math.floor(g.distance / 12));
      draw(ctx, g, false);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function start() {
    game.current = freshGame();
    setBest(readBest());
    setScore(0);
    // Coins and the prize both carry across runs on purpose.
    setOver(false);
    setReachedNight(false);
    if (soundOn.current) garageAudio.ignition();
    setRunning(true);
  }

  // Touch: tap the top half to jump, hold the bottom half to duck.
  function onTouchStart(event: React.TouchEvent<HTMLCanvasElement>) {
    event.preventDefault();
    touchedCanvas.current = true;
    if (!runningRef.current) {
      start();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.touches[0].clientY - rect.top;
    if (y > rect.height * 0.62) setDuck(true);
    else jump();
  }

  return (
    <div className="paper-game shore-run">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2>Shore run</h2>
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          {!running ? (
            <button type="button" onClick={start}>{over ? "Run again" : "Start the run"}</button>
          ) : null}
        </div>
      </header>
      <div className="match-game-bar">
        <dl className="match-game-score">
          <div>
            <dt>Score</dt>
            <dd>{String(score).padStart(5, "0")}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd>{String(best).padStart(5, "0")}</dd>
          </div>
          <div>
            <dt>Coins</dt>
            <dd>{coins}/{COINS_TO_WIN}</dd>
          </div>
        </dl>
      </div>
      <p className="match-game-status" role="status">
        {running
          ? won || reachedNight
            ? "Prize earned - keep driving. We'll show it when the run ends."
            : `Hop the tire stacks, duck the signals - ${Math.max(0, COINS_TO_WIN - coins)} more coin${COINS_TO_WIN - coins === 1 ? "" : "s"} for the prize.`
          : over
            ? `Crunch. You made ${score} down the Shore.`
            : `Space or tap to go. Grab ${COINS_TO_WIN} coins to win a coupon.`}
      </p>
      {(won || reachedNight) && over ? (
        <PrizeBanner
          sound={sound}
          achievement={won
            ? `${COINS_TO_WIN} coins collected on the Shore Run.`
            : "You drove the Shore Run all the way into night."}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        className="shore-run-strip"
        width={W}
        height={H}
        onTouchStart={onTouchStart}
        onTouchEnd={() => setDuck(false)}
        onTouchCancel={() => setDuck(false)}
        onClick={() => {
          if (touchedCanvas.current) {
            touchedCanvas.current = false;
            return;
          }
          if (runningRef.current) jump();
          else start();
        }}
        role="img"
        aria-label="Side-scrolling driving game: jump the car over stacked tires, and duck under traffic signals and low underpasses"
      />
      <div className="shore-run-touch-controls" aria-label="Driving controls">
        <button type="button" onPointerDown={() => (runningRef.current ? jump() : start())}>
          <span aria-hidden="true">↑</span> Jump
        </button>
        <button
          type="button"
          onPointerDown={() => setDuck(true)}
          onPointerUp={() => setDuck(false)}
          onPointerCancel={() => setDuck(false)}
          onPointerLeave={() => setDuck(false)}
        >
          <span aria-hidden="true">↓</span> Duck
        </button>
      </div>
      <p className="shore-run-keys">
        <span><b>Space</b> / <b>↑</b> jump</span>
        <span><b>↓</b> duck</span>
        <span>Hold the duck through an underpass</span>
        <span>On a phone: tap to jump, hold low to duck</span>
      </p>
    </div>
  );
}

/* ---------- geometry ---------- */

function carBox(g: Game) {
  const h = g.ducking && g.onGround ? 24 : 38;
  return { x: 62, y: GROUND - h + g.y, w: 62, h };
}

function obstacleWidth(ob: Obstacle) {
  return ob.kind === "tunnel" ? ob.width : 40;
}

function obstacleBoxes(ob: Obstacle) {
  if (ob.kind === "tires") {
    const h = ob.count * 20;
    return [{ x: ob.x + 4, y: GROUND - h, w: 26, h }];
  }
  if (ob.kind === "tunnel") {
    return [{ x: ob.x, y: 0, w: ob.width, h: OVERHEAD_LOW }];
  }
  // Both signal heights now sit inside the duck band: they strike a standing
  // car and clear a ducking one.
  const h = ob.low ? OVERHEAD_LOW : OVERHEAD_HIGH;
  return [{ x: ob.x + 8, y: 0, w: 22, h }];
}

/* ---------- rendering ---------- */

function draw(ctx: CanvasRenderingContext2D, g: Game, crashed: boolean) {
  const ink = g.night ? "#f7efd9" : "#171412";
  const paper = g.night ? "#171412" : "#f7efd9";
  const red = g.night ? "#e0555a" : "#a8161c";
  const gold = "#f6bd38";

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  // Clouds (day) / stars (night)
  for (const cloud of g.clouds) {
    ctx.fillStyle = g.night ? gold : ink;
    ctx.globalAlpha = g.night ? 0.9 : 0.22;
    if (g.night) {
      ctx.fillRect(cloud.x, cloud.y, 3, 3);
      ctx.fillRect(cloud.x + 26, cloud.y + 16, 2, 2);
      ctx.fillRect(cloud.x + 48, cloud.y - 10, 3, 3);
    } else {
      const s = cloud.scale;
      ctx.fillRect(cloud.x, cloud.y, 46 * s, 8 * s);
      ctx.fillRect(cloud.x + 10 * s, cloud.y - 7 * s, 26 * s, 8 * s);
    }
    ctx.globalAlpha = 1;
  }

  // Road
  ctx.fillStyle = ink;
  ctx.fillRect(0, GROUND + 2, W, 3);
  ctx.globalAlpha = 0.55;
  for (let x = -g.groundOffset; x < W; x += 28) ctx.fillRect(x, GROUND + 10, 14, 3);
  ctx.globalAlpha = 1;

  // Coins
  for (const coin of g.coins) {
    if (coin.taken) continue;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = "900 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("$", coin.x, coin.y + 4);
  }

  // Obstacles
  for (const ob of g.obstacles) {
    if (ob.kind === "tires") drawTires(ctx, ob.x, ob.count, ink, paper);
    else if (ob.kind === "tunnel") drawTunnel(ctx, ob.x, ob.width, ink, paper, gold, g.night);
    else drawSignal(ctx, ob.x, ob.low, ink, paper, red, gold, g.night);
  }

  drawCar(ctx, g, ink, paper, red, gold, crashed);

  if (crashed) {
    ctx.fillStyle = ink;
    ctx.font = "900 20px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("G A M E   O V E R", W / 2, 62);
  }
}

function drawTires(
  ctx: CanvasRenderingContext2D,
  x: number,
  count: number,
  ink: string,
  paper: string,
) {
  for (let i = 0; i < count; i += 1) {
    const cy = GROUND - 10 - i * 20;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(x + 17, cy, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.ellipse(x + 17, cy, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A shore underpass. The deck fills the top of the strip and the lit lip
 *  marks exactly how low you have to be to get through. */
function drawTunnel(
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
  ink: string,
  paper: string,
  gold: string,
  night: boolean,
) {
  const lip = OVERHEAD_LOW - 7;

  ctx.fillStyle = ink;
  ctx.fillRect(x, 0, width, lip);

  // Recessed lamps, so the underpass reads as something you drive through.
  ctx.fillStyle = night ? gold : paper;
  for (let lamp = x + 16; lamp < x + width - 14; lamp += 32) {
    ctx.fillRect(lamp, lip - 13, 12, 4);
  }

  // Portal edges catch the light at both ends.
  ctx.fillStyle = paper;
  ctx.fillRect(x + 3, 0, 3, lip);
  ctx.fillRect(x + width - 6, 0, 3, lip);

  // Hazard stripe along the lip — the line your roof has to clear.
  ctx.fillStyle = gold;
  ctx.fillRect(x, lip, width, 7);
  ctx.fillStyle = ink;
  for (let stripe = x; stripe < x + width; stripe += 14) {
    ctx.fillRect(stripe, lip, 7, 7);
  }

  ctx.fillStyle = paper;
  ctx.font = "900 9px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("LOW CLEARANCE", x + width / 2, 26);
}

function drawSignal(
  ctx: CanvasRenderingContext2D,
  x: number,
  low: boolean,
  ink: string,
  paper: string,
  red: string,
  gold: string,
  night: boolean,
) {
  const h = low ? OVERHEAD_LOW : OVERHEAD_HIGH;
  ctx.fillStyle = ink;
  ctx.fillRect(x - 6, 0, 4, h - 26); // hanger
  ctx.fillRect(x - 22, 0, 40, 4); // arm
  ctx.fillRect(x, h - 30, 22, 30); // housing
  // Lamps: red on top, gold beneath — lit at night for a bit of glow.
  ctx.fillStyle = night ? red : paper;
  ctx.beginPath();
  ctx.arc(x + 11, h - 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night ? gold : paper;
  ctx.beginPath();
  ctx.arc(x + 11, h - 9, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  g: Game,
  ink: string,
  paper: string,
  red: string,
  gold: string,
  crashed: boolean,
) {
  const ducking = g.ducking && g.onGround;
  const h = ducking ? 24 : 38;
  const x = 62;
  const y = GROUND - h + g.y;
  const w = 62;

  // Body
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.roundRect(x, y + (ducking ? 4 : 10), w, h - (ducking ? 4 : 10), 5);
  ctx.fill();
  // Roof — flattens right down when ducking
  ctx.beginPath();
  ctx.roundRect(x + 13, y, ducking ? 30 : 34, ducking ? 8 : 14, [7, 7, 0, 0]);
  ctx.fill();
  // Window
  ctx.fillStyle = paper;
  ctx.fillRect(x + 18, y + (ducking ? 2 : 4), ducking ? 18 : 22, ducking ? 4 : 8);
  // Headlight
  ctx.fillStyle = gold;
  ctx.fillRect(x + w - 6, y + h - 16, 6, 5);

  // Wheels — spinning spokes while rolling, still on a crash.
  for (const wx of [x + 14, x + w - 14]) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(wx, GROUND - 4 + g.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.arc(wx, GROUND - 4 + g.y, 3.4, 0, Math.PI * 2);
    ctx.fill();
    if (!crashed) {
      ctx.strokeStyle = paper;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(wx, GROUND - 4 + g.y);
      ctx.lineTo(
        wx + Math.cos(g.wheelSpin) * 7,
        GROUND - 4 + g.y + Math.sin(g.wheelSpin) * 7,
      );
      ctx.stroke();
    }
  }
}
