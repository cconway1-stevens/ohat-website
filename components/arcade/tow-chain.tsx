"use client";

import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";
import { arcadePresets } from "@/lib/arcade";

const BEST_KEY = "ohat-towchain-best";
// Five pickups is a couple of laps of the lot — reachable on a first shift.
const CARS_TO_WIN = arcadePresets.towChain.carsToWin;
const GRID = 13;
const CELL = 24;
const SIZE = GRID * CELL;
const TICK_MS = arcadePresets.towChain.tickMs;

type Point = { x: number; y: number };

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function randomCell(exclude: Point[]): Point {
  while (true) {
    const cell = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
    if (!exclude.some((point) => point.x === cell.x && point.y === cell.y)) return cell;
  }
}

/**
 * The classic snake, garage edition: a tow truck collects stranded cars
 * around the lot, and every hook-up makes the tow chain one car longer.
 * Arrow keys or swipes; running into the fence or your own chain ends the
 * shift.
 */
export function TowChain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);
  const state = useRef({
    chain: [{ x: 6, y: 6 }] as Point[],
    dir: { x: 1, y: 0 } as Point,
    nextDir: { x: 1, y: 0 } as Point,
    pickup: { x: 9, y: 6 } as Point,
  });
  const runningRef = useRef(false);
  const touchStart = useRef<Point | null>(null);

  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);

  function turn(direction: Point) {
    const s = state.current;
    // No U-turns — the chain is right behind the truck.
    if (direction.x === -s.dir.x && direction.y === -s.dir.y) return;
    s.nextDir = direction;
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!runningRef.current) return;
      if (event.key === "ArrowUp") turn({ x: 0, y: -1 });
      if (event.key === "ArrowDown") turn({ x: 0, y: 1 });
      if (event.key === "ArrowLeft") turn({ x: -1, y: 0 });
      if (event.key === "ArrowRight") turn({ x: 1, y: 0 });
      if (event.key.startsWith("Arrow")) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const draw = () => {
      const s = state.current;
      ctx.fillStyle = "#2b2725";
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Lot markings
      ctx.strokeStyle = "rgba(246,189,56,.18)";
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID; i += 1) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
      }
      // Stranded car: pale body, dark windows, red hazard marker.
      const pickupX = s.pickup.x * CELL;
      const pickupY = s.pickup.y * CELL;
      ctx.fillStyle = "#dff0f3";
      ctx.fillRect(pickupX + 3, pickupY + 7, 18, 11);
      ctx.fillStyle = "#171412";
      ctx.fillRect(pickupX + 7, pickupY + 4, 9, 5);
      ctx.fillStyle = "#f6bd38";
      ctx.fillRect(pickupX + 10, pickupY + 1, 4, 3);

      // Tow truck at the head, then a visible chain of recovered cars.
      s.chain.forEach((cell, index) => {
        const x = cell.x * CELL;
        const y = cell.y * CELL;
        ctx.fillStyle = index === 0 ? "#f6bd38" : index % 2 ? "#a8161c" : "#1a7183";
        ctx.fillRect(x + 2, y + 7, 20, 12);
        ctx.fillStyle = "#171412";
        ctx.fillRect(x + 6, y + 4, index === 0 ? 11 : 10, 6);
        ctx.fillRect(x + 4, y + 18, 5, 3);
        ctx.fillRect(x + 15, y + 18, 5, 3);
        if (index === 0) {
          ctx.strokeStyle = "#f7efd9";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 18, y + 6);
          ctx.lineTo(x + 22, y + 2);
          ctx.stroke();
        }
      });
    };

    const id = window.setInterval(() => {
      const s = state.current;
      s.dir = s.nextDir;
      const head = { x: s.chain[0].x + s.dir.x, y: s.chain[0].y + s.dir.y };
      const hitFence = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
      const hitChain = s.chain.some((cell) => cell.x === head.x && cell.y === head.y);
      if (hitFence || hitChain) {
        runningRef.current = false;
        setRunning(false);
        setOver(true);
        if (soundOn.current) garageAudio.skid();
        const total = s.chain.length - 1;
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
      s.chain.unshift(head);
      if (head.x === s.pickup.x && head.y === s.pickup.y) {
        if (soundOn.current) garageAudio.horn();
        const towed = s.chain.length - 1;
        setScore(towed);
        if (towed >= CARS_TO_WIN) setWon(true);
        s.pickup = randomCell(s.chain);
      } else {
        s.chain.pop();
      }
      draw();
    }, TICK_MS);

    draw();
    return () => window.clearInterval(id);
  }, [running]);

  function start(initialDirection: Point = { x: 1, y: 0 }) {
    state.current = {
      chain: [{ x: 6, y: 6 }],
      dir: initialDirection,
      nextDir: initialDirection,
      pickup: randomCell([{ x: 6, y: 6 }]),
    };
    setBest(readBest());
    setScore(0);
    setOver(false);
    setWon(false);
    if (soundOn.current) garageAudio.ignition();
    runningRef.current = true;
    setRunning(true);
  }

  function drive(direction: Point) {
    if (!runningRef.current) start(direction);
    else turn(direction);
  }

  return (
    <div className="tow-chain">
      <div className="match-game-bar">
        <dl className="match-game-score">
          <div>
            <dt>Cars towed</dt>
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
            <button type="button" onClick={() => start()}>{over ? "New shift" : "Start the shift"}</button>
          ) : null}
        </div>
      </div>
      <p className="match-game-status" role="status">
        {running
          ? won
            ? "Prize earned - keep towing. We'll show it when the shift ends."
            : `Hook the stranded cars — arrows or swipe. ${Math.max(0, CARS_TO_WIN - score)} more for the prize.`
          : over
            ? `Shift over: ${score} car${score === 1 ? "" : "s"} towed back to the shop.`
            : `Every pickup makes the chain longer. Tow ${CARS_TO_WIN} to win a coupon.`}
      </p>
      {won && over ? <PrizeBanner achievement={`${CARS_TO_WIN} cars towed in one shift.`} /> : null}
      <canvas
        ref={canvasRef}
        className="tow-chain-lot"
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label="Snake-style game: steer the tow truck around the lot collecting cars"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const from = touchStart.current;
          touchStart.current = null;
          if (!from || !runningRef.current) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - from.x;
          const dy = touch.clientY - from.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
          if (Math.abs(dx) > Math.abs(dy)) turn({ x: dx > 0 ? 1 : -1, y: 0 });
          else turn({ x: 0, y: dy > 0 ? 1 : -1 });
        }}
      />
      <div className="tow-controls" aria-label="Tow truck steering controls">
        <button type="button" className="tow-up" onPointerDown={() => drive({ x: 0, y: -1 })} aria-label="Drive up">↑</button>
        <button type="button" className="tow-left" onPointerDown={() => drive({ x: -1, y: 0 })} aria-label="Drive left">←</button>
        <span aria-hidden="true">OHAT</span>
        <button type="button" className="tow-right" onPointerDown={() => drive({ x: 1, y: 0 })} aria-label="Drive right">→</button>
        <button type="button" className="tow-down" onPointerDown={() => drive({ x: 0, y: 1 })} aria-label="Drive down">↓</button>
      </div>
    </div>
  );
}
