"use client";

import { useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";

const W = 480;
const H = 270;
const BAYS = [0, 1, 2];

/**
 * Closing Time Garage — the last hour of the day. Dim each bay, roll the tool
 * carts back against the wall, pull the door down, and let the rain get on
 * with it. Nothing is scored and nothing can be got wrong.
 */
export function ClosingTime() {
  const [sound, setSound] = useState(false);
  const [lights, setLights] = useState([true, true, true]);
  const [carts, setCarts] = useState(0); // carts rolled back, 0..2
  const [doorDown, setDoorDown] = useState(false);
  const [last, setLast] = useState("The shop is still awake. Take your time.");

  const litCount = lights.filter(Boolean).length;
  const closed = litCount === 0 && carts === 2 && doorDown;

  useAmbience(sound, {
    rain: doorDown ? 0.02 : 0.055,
    shopHum: litCount > 0 ? 0.02 : 0.006,
    traffic: doorDown ? 0.004 : 0.014,
  });

  const canvasRef = useSceneCanvas(
    (ctx, frame) => {
      // Night outside, warm inside.
      ctx.fillStyle = "#141519";
      ctx.fillRect(0, 0, W, H);

      // Back wall, lit by whatever bays are still on.
      const warmth = litCount / BAYS.length;
      ctx.fillStyle = `rgb(${34 + warmth * 46}, ${30 + warmth * 34}, ${26 + warmth * 20})`;
      ctx.fillRect(0, 28, W, H - 28);

      // The open doorway, and the weather beyond it.
      const doorTop = doorDown ? H - 34 : 34;
      ctx.fillStyle = "#0b0e14";
      ctx.fillRect(300, 34, 150, H - 68);
      if (!doorDown) {
        // Rain streaks and distant tail lights on the road outside.
        ctx.strokeStyle = "rgba(180,205,225,.5)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 40; i += 1) {
          const x = 302 + ((i * 37 + frame * 2) % 146);
          const y = 36 + ((i * 61 + frame * 6) % (H - 74));
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 2, y + 9);
          ctx.stroke();
        }
        for (let i = 0; i < 3; i += 1) {
          const x = 306 + ((i * 58 + frame * 0.45) % 140);
          ctx.fillStyle = i % 2 ? "rgba(224,85,90,.85)" : "rgba(246,189,56,.7)";
          ctx.fillRect(x, 168 + i * 9, 5, 3);
        }
        // Wet reflection spilling onto the shop floor.
        ctx.fillStyle = "rgba(140,175,205,.10)";
        ctx.fillRect(300, H - 62, 150, 28);
      }
      // The roller door itself.
      ctx.fillStyle = "#4a453e";
      ctx.fillRect(300, 34, 150, doorDown ? H - 68 : 8);
      ctx.strokeStyle = "rgba(23,20,18,.5)";
      for (let y = 40; y < doorTop + (doorDown ? H : 0) && y < H - 34; y += 9) {
        ctx.beginPath();
        ctx.moveTo(300, y);
        ctx.lineTo(450, y);
        ctx.stroke();
      }

      // Three service bays with hanging lamps.
      BAYS.forEach((bay) => {
        const x = 46 + bay * 84;
        ctx.strokeStyle = "rgba(20,18,16,.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 28);
        ctx.lineTo(x, 62);
        ctx.stroke();
        // Shade
        ctx.fillStyle = "#2f2a25";
        ctx.beginPath();
        ctx.moveTo(x - 16, 74);
        ctx.lineTo(x + 16, 74);
        ctx.lineTo(x + 9, 62);
        ctx.lineTo(x - 9, 62);
        ctx.closePath();
        ctx.fill();
        if (lights[bay]) {
          // Bulb and the cone of light it throws down the bay.
          const flicker = 0.9 + Math.sin(frame / 9 + bay) * 0.05;
          const cone = ctx.createLinearGradient(x, 74, x, H - 40);
          cone.addColorStop(0, `rgba(246,189,56,${0.34 * flicker})`);
          cone.addColorStop(1, "rgba(246,189,56,0)");
          ctx.fillStyle = cone;
          ctx.beginPath();
          ctx.moveTo(x - 15, 74);
          ctx.lineTo(x + 15, 74);
          ctx.lineTo(x + 44, H - 40);
          ctx.lineTo(x - 44, H - 40);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = `rgba(255,236,170,${flicker})`;
          ctx.beginPath();
          ctx.arc(x, 76, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Floor
      ctx.fillStyle = "#211d1a";
      ctx.fillRect(0, H - 40, W, 40);
      ctx.strokeStyle = "rgba(246,189,56,.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 84, H - 40);
        ctx.lineTo(i * 84 - 16, H);
        ctx.stroke();
      }

      // Tool carts: parked out on the floor, or tucked against the wall.
      for (let cart = 0; cart < 2; cart += 1) {
        const home = cart === 0 ? 22 : 74;
        const out = cart === 0 ? 150 : 220;
        const x = cart < carts ? home : out;
        const y = cart < carts ? H - 92 : H - 66;
        ctx.fillStyle = cart === 0 ? "#a8161c" : "#1a7183";
        ctx.fillRect(x, y, 34, 26);
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(x + 3, y + 6, 28, 4);
        ctx.fillRect(x + 3, y + 14, 28, 4);
        ctx.fillStyle = "#17140f";
        ctx.beginPath();
        ctx.arc(x + 7, y + 28, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 27, y + 28, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shop sign, still lit until the last bay goes out.
      ctx.fillStyle = litCount > 0 ? "rgba(246,189,56,.92)" : "rgba(120,112,96,.5)";
      ctx.font = "900 15px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("OHAT", 20, 22);
      ctx.font = "900 8px Georgia, serif";
      ctx.fillText(closed ? "CLOSED" : "OPEN", 74, 22);
    },
    W,
    H,
  );

  function toggleLight(bay: number) {
    cozyAudio.click();
    setLights((current) => current.map((on, index) => (index === bay ? !on : on)));
    setLast(lights[bay] ? `Bay ${bay + 1} goes dark.` : `Bay ${bay + 1} warms back up.`);
  }

  return (
    <CozyShell
      edition="Ocean Heights · after hours"
      title="Closing Time Garage"
      note="The last car went out an hour ago. Dim the bays, put the carts away, and pull the door down — or leave it open and listen to the rain. Nothing here is scored."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label="A quiet garage at night with three service bays, tool carts and rain outside the open door"
        />
      </div>

      <p className="cozy-note" aria-live="polite">
        {closed ? "That's the shop put to bed. Rain on the roof, and nothing left to do." : last}
      </p>

      <div className="cozy-actions">
        {BAYS.map((bay) => (
          <button
            key={bay}
            type="button"
            className={lights[bay] ? "is-on" : ""}
            aria-pressed={lights[bay]}
            onClick={() => toggleLight(bay)}
          >
            Bay {bay + 1} {lights[bay] ? "lit" : "dark"}
          </button>
        ))}
        <button
          type="button"
          disabled={carts >= 2}
          onClick={() => {
            cozyAudio.drawer();
            setCarts((c) => c + 1);
            setLast("A cart rolls back against the wall.");
          }}
        >
          Roll a cart in ({carts}/2)
        </button>
        <button
          type="button"
          className={doorDown ? "is-on" : ""}
          aria-pressed={doorDown}
          onClick={() => {
            cozyAudio.drawer();
            setDoorDown((d) => !d);
            setLast(
              doorDown
                ? "The door rolls back up. Cool air and rain."
                : "The door comes down. The rain goes quiet.",
            );
          }}
        >
          {doorDown ? "Open the door" : "Pull the door down"}
        </button>
        <button
          type="button"
          onClick={() => {
            cozyAudio.compressor();
            setLast("The compressor tops itself up, then cuts out.");
          }}
        >
          Top up the compressor
        </button>
      </div>
    </CozyShell>
  );
}
