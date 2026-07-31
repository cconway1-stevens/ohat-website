"use client";

import { useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";
import { RadioSet } from "./radio-set";

const W = 480;
const H = 250;

// Old magazines on the low table, for when the wait gets long.
const MAGAZINES = [
  "“Ten shore cruisers that never left the county.” A double-page spread of somebody's restored wagon.",
  "A 1987 buyer's guide. Every price in it looks like a misprint now.",
  "“How to read a tire sidewall.” You already knew most of it, but the diagrams are nice.",
  "A crossword somebody half-finished in pen. Two answers are definitely wrong.",
  "A road atlas of New Jersey, coffee ring on the Pine Barrens.",
];

/**
 * Garage Radio — the customer chair, the window onto the shop, and an hour to
 * fill. Everything in the room can be tapped for the sound it makes.
 */
export function GarageRadio() {
  const [sound, setSound] = useState(false);
  const [radioOn, setRadioOn] = useState(false);
  const [note, setNote] = useState("Somebody's car is up on the lift out there. You have a chair and a coffee machine.");
  const [magazine, setMagazine] = useState(-1);
  const [coffees, setCoffees] = useState(0);
  const [raining, setRaining] = useState(true);

  useAmbience(sound, {
    fluorescent: 0.012,
    shopHum: 0.018,
    rain: raining ? 0.03 : 0,
  });

  const canvasRef = useSceneCanvas((ctx, frame) => {
    // Waiting room: warm, slightly tired.
    ctx.fillStyle = "#e2d9c2";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#cdc2a7";
    ctx.fillRect(0, H - 58, W, 58);

    // The window onto the shop floor.
    ctx.fillStyle = "#2a2b30";
    ctx.fillRect(150, 26, 300, 132);
    ctx.strokeStyle = "#8d8676";
    ctx.lineWidth = 5;
    ctx.strokeRect(150, 26, 300, 132);

    // Beyond the glass: a car on a lift and a mechanic crossing the bay.
    ctx.fillStyle = "#3a3b42";
    ctx.fillRect(150, 128, 300, 30);
    ctx.fillStyle = "#8d8676";
    ctx.fillRect(238, 96, 8, 34);
    ctx.fillRect(320, 96, 8, 34);
    ctx.fillStyle = "#a8161c";
    ctx.fillRect(214, 74, 140, 24);
    ctx.fillStyle = "#1b1c20";
    ctx.fillRect(240, 62, 82, 14);
    for (const wx of [236, 336]) {
      ctx.fillStyle = "#17140f";
      ctx.beginPath(); ctx.arc(wx, 98, 9, 0, Math.PI * 2); ctx.fill();
    }
    // Mechanic pacing across, behind the glass.
    const walk = 165 + ((frame * 0.5) % 260);
    ctx.fillStyle = "#20303c";
    ctx.fillRect(walk, 112, 12, 30);
    ctx.fillStyle = "#c99f76";
    ctx.beginPath(); ctx.arc(walk + 6, 106, 6, 0, Math.PI * 2); ctx.fill();

    // Rain running down the outside of the glass.
    if (raining) {
      ctx.strokeStyle = "rgba(190,215,235,.45)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 34; i += 1) {
        const x = 156 + ((i * 43) % 288);
        const y = 30 + ((i * 57 + frame * 4) % 124);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1.5, y + 11);
        ctx.stroke();
      }
    }

    // Coffee machine on the left.
    ctx.fillStyle = "#5c564b";
    ctx.fillRect(22, 60, 62, 96);
    ctx.fillStyle = "#2f2a25";
    ctx.fillRect(32, 78, 42, 30);
    ctx.fillStyle = "#c9a875";
    ctx.fillRect(40, 118, 26, 22);
    ctx.fillStyle = "rgba(246,189,56,.85)";
    ctx.fillRect(30, 66, 8, 5);

    // Vending machine on the right.
    ctx.fillStyle = "#a8161c";
    ctx.fillRect(W - 88, 52, 66, 106);
    ctx.fillStyle = "#1b1c20";
    ctx.fillRect(W - 80, 60, 42, 66);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        ctx.fillStyle = ["#f6bd38", "#68a56f", "#8fb7c4"][(row + col) % 3];
        ctx.fillRect(W - 76 + col * 13, 64 + row * 21, 9, 15);
      }
    }

    // Low table with magazines, and the chair you are sitting in.
    ctx.fillStyle = "#7a5c3a";
    ctx.fillRect(140, H - 46, 190, 10);
    MAGAZINES.slice(0, 3).forEach((_, index) => {
      ctx.fillStyle = ["#dff0f3", "#f6bd38", "#e0555a"][index];
      ctx.save();
      ctx.translate(160 + index * 54, H - 52);
      ctx.rotate((index - 1) * 0.09);
      ctx.fillRect(0, 0, 46, 8);
      ctx.restore();
    });
    ctx.fillStyle = "#1a7183";
    ctx.fillRect(24, H - 52, 72, 16);
    ctx.fillRect(24, H - 90, 12, 42);
  }, W, H);

  const tap = (message: string, effect: () => void) => () => {
    effect();
    setNote(message);
  };

  return (
    <CozyShell
      edition="Ocean Heights · waiting room"
      title="Garage Radio"
      note="Your car is up on the lift and the coffee is free. Turn the radio on, flip through what's on the table, and tap anything in the room to hear it."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="A garage waiting room looking through glass at a car on a lift" />
      </div>

      <p className="cozy-note" aria-live="polite">{note}</p>

      <RadioSet on={radioOn} onPowerChange={setRadioOn} />

      <div className="cozy-actions">
        <button
          type="button"
          onClick={tap("The machine grinds, spits, and fills a paper cup most of the way.", () => {
            cozyAudio.pour();
            setCoffees((count) => count + 1);
          })}
        >
          Coffee machine
        </button>
        <button
          type="button"
          onClick={tap("Two quarters go in and something lands at the bottom with a thud.", cozyAudio.coin)}
        >
          Vending machine
        </button>
        <button
          type="button"
          onClick={tap("A drawer of sockets rolls open somewhere out in the bay.", cozyAudio.drawer)}
        >
          Tool drawer
        </button>
        <button
          type="button"
          onClick={() => {
            cozyAudio.page();
            const next = (magazine + 1) % MAGAZINES.length;
            setMagazine(next);
            setNote(MAGAZINES[next]);
          }}
        >
          Old magazines
        </button>
        <button
          type="button"
          className={raining ? "is-on" : ""}
          aria-pressed={raining}
          onClick={() => {
            cozyAudio.click();
            setRaining((on) => !on);
            setNote(raining ? "The rain lets up. Somebody props the side door open." : "It starts up again against the glass.");
          }}
        >
          {raining ? "Rain on the glass" : "Rain stopped"}
        </button>
        <button
          type="button"
          onClick={tap("The bell over the door goes as somebody else comes in to wait.", cozyAudio.doorBell)}
        >
          Door bell
        </button>
      </div>

      <p className="cozy-note">
        {coffees === 0 ? "The chair is comfortable enough." : `${coffees} free coffee${coffees === 1 ? "" : "s"} in. They should be done soon.`}
      </p>
    </CozyShell>
  );
}
