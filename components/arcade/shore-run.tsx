"use client";

import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";

const BEST_KEY = "ohat-shorerun-best";
const LANES = 3;
const W = 300;
const H = 440;
const LANE_W = W / LANES;
const CAR_W = 44;
const CAR_H = 72;

type Rival = { lane: number; y: number; hue: string };

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

/**
 * A three-lane Shore road, oncoming traffic, one family sedan: steer with
 * arrow keys or by tapping the lane to move toward. Distance is the score.
 */
export function ShoreRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);
  const state = useRef({ lane: 1, rivals: [] as Rival[], distance: 0, speed: 2.6, spawnIn: 0 });
  const runningRef = useRef(false);

  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let dashOffset = 0;

    const draw = () => {
      const s = state.current;
      // Road
      ctx.fillStyle = "#2b2725";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#f6bd38";
      ctx.lineWidth = 4;
      ctx.setLineDash([26, 22]);
      dashOffset -= s.speed * 2;
      ctx.lineDashOffset = dashOffset;
      for (let lane = 1; lane < LANES; lane += 1) {
        ctx.beginPath();
        ctx.moveTo(lane * LANE_W, -30);
        ctx.lineTo(lane * LANE_W, H + 30);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Traffic
      for (const rival of s.rivals) {
        drawCar(ctx, rival.lane * LANE_W + (LANE_W - CAR_W) / 2, rival.y, rival.hue);
      }
      // Player
      drawCar(ctx, s.lane * LANE_W + (LANE_W - CAR_W) / 2, H - CAR_H - 14, "#a8161c", true);
    };

    const step = () => {
      const s = state.current;
      s.distance += s.speed;
      s.speed = Math.min(7, 2.6 + s.distance / 2600);
      s.spawnIn -= 1;
      if (s.spawnIn <= 0) {
        // Never fill every lane in one wave — there is always a way through.
        const open = Math.floor(Math.random() * LANES);
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane !== open && Math.random() < 0.55) {
            s.rivals.push({
              lane,
              y: -CAR_H - Math.random() * 60,
              hue: ["#1a7183", "#f6bd38", "#6f6a63", "#fffaf0"][Math.floor(Math.random() * 4)],
            });
          }
        }
        s.spawnIn = Math.max(52, 96 - s.distance / 120);
      }
      for (const rival of s.rivals) rival.y += s.speed;
      s.rivals = s.rivals.filter((rival) => rival.y < H + CAR_H);

      const px = s.lane;
      const playerTop = H - CAR_H - 14;
      const hit = s.rivals.some(
        (rival) => rival.lane === px && rival.y + CAR_H > playerTop + 8 && rival.y < playerTop + CAR_H - 8,
      );
      if (hit) {
        runningRef.current = false;
        setRunning(false);
        setCrashed(true);
        if (soundOn.current) garageAudio.skid();
        const total = Math.round(s.distance / 10);
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
        return;
      }

      setScore(Math.round(s.distance / 10));
      draw();
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const steer = (event: KeyboardEvent) => {
      if (!runningRef.current) return;
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", steer);
    return () => window.removeEventListener("keydown", steer);
  }, []);

  function move(direction: -1 | 1) {
    const s = state.current;
    const next = Math.min(LANES - 1, Math.max(0, s.lane + direction));
    if (next !== s.lane) {
      s.lane = next;
      if (soundOn.current) garageAudio.rev();
    }
  }

  function start() {
    state.current = { lane: 1, rivals: [], distance: 0, speed: 2.6, spawnIn: 0 };
    setBest(readBest());
    setCrashed(false);
    setScore(0);
    if (soundOn.current) garageAudio.ignition();
    setRunning(true);
  }

  // Tap steering: the half of the road you tap is the direction you move.
  function tapSteer(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!runningRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    move(event.clientX - rect.left < rect.width / 2 ? -1 : 1);
  }

  return (
    <div className="shore-run">
      <div className="match-game-bar">
        <dl className="match-game-score">
          <div>
            <dt>Miles</dt>
            <dd>{score}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd>{best}</dd>
          </div>
        </dl>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          {!running ? (
            <button type="button" onClick={start}>{crashed ? "Drive again" : "Start driving"}</button>
          ) : null}
        </div>
      </div>
      <p className="match-game-status" role="status">
        {running
          ? "Dodge the traffic — arrow keys, or tap a side of the road."
          : crashed
            ? `Fender bender at ${score} miles. No one was hurt.`
            : "Take the family sedan out along the Shore. How far can you get?"}
      </p>
      <canvas
        ref={canvasRef}
        className="shore-run-road"
        width={W}
        height={H}
        onClick={tapSteer}
        role="img"
        aria-label="Top-down driving game: steer the red sedan between lanes to avoid traffic"
      />
    </div>
  );
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hue: string,
  player = false,
) {
  ctx.fillStyle = "#171412";
  ctx.fillRect(x - 4, y + 10, CAR_W + 8, 12);
  ctx.fillRect(x - 4, y + CAR_H - 20, CAR_W + 8, 12);
  ctx.fillStyle = hue;
  ctx.beginPath();
  ctx.roundRect(x, y, CAR_W, CAR_H, 10);
  ctx.fill();
  ctx.fillStyle = player ? "#ffe9b0" : "#dff0f3";
  ctx.beginPath();
  ctx.roundRect(x + 7, y + (player ? 12 : CAR_H - 26), CAR_W - 14, 14, 4);
  ctx.fill();
}
