"use client";

import { useState } from "react";
import { ambience, cozyAudio, garageAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";

const W = 480;
const H = 250;

// The bay never runs out of work: old trucks, hybrids, classics, work vans.
const VEHICLES = [
  { name: "a work van", body: "#dff0f3", roof: 46, length: 190, tall: true },
  { name: "a '68 classic", body: "#a8161c", roof: 30, length: 176, tall: false },
  { name: "a pickup", body: "#1a7183", roof: 28, length: 196, tall: false },
  { name: "a hybrid hatch", body: "#68a56f", roof: 34, length: 158, tall: false },
  { name: "a shore wagon", body: "#f6bd38", roof: 32, length: 184, tall: false },
];

const STEPS = [
  { key: "spray", label: "Spray it off", done: "Loose grit rinses down the drain." },
  { key: "foam", label: "Lay the foam", done: "Foam settles over the panels." },
  { key: "rinse", label: "Rinse it down", done: "The foam sheets away clean." },
  { key: "dry", label: "Dry it off", done: "Warm air chases the last drops." },
  { key: "shine", label: "Tire shine", done: "Black sidewalls, and that's a Sunday shine." },
] as const;

/**
 * Sunday Car Wash — five unhurried passes over whatever rolled into the bay.
 * The steps only go forward, there is no timer, and the next car is always
 * along in a moment.
 */
export function SundayWash() {
  const [sound, setSound] = useState(false);
  const [vehicle, setVehicle] = useState(0);
  const [step, setStep] = useState(0);
  const [washed, setWashed] = useState(0);
  const [note, setNote] = useState("A car rolls into the bay, still wearing the week.");

  const car = VEHICLES[vehicle];
  const finished = step >= STEPS.length;

  useAmbience(sound, { water: step > 0 && !finished ? 0.03 : 0.008, shopHum: 0.014, rain: 0.006 });

  const canvasRef = useSceneCanvas(
    (ctx, frame) => {
      // Warm morning light in an open wash bay.
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#bfe0e6");
      sky.addColorStop(1, "#e9dcc0");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Sun and a couple of lazy birds.
      ctx.fillStyle = "rgba(255,240,190,.85)";
      ctx.beginPath();
      ctx.arc(408, 44, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,60,70,.45)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 2; i += 1) {
        const bx = 70 + i * 46 + ((frame * 0.25 + i * 30) % 260);
        const by = 44 + Math.sin((frame + i * 40) / 44) * 5;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.quadraticCurveTo(bx, by - 4, bx + 5, by);
        ctx.stroke();
      }

      // Bay walls and floor
      ctx.fillStyle = "#cdc6b4";
      ctx.fillRect(0, 150, W, 40);
      ctx.fillStyle = "#8f8878";
      ctx.fillRect(0, 190, W, H - 190);
      // Wet floor sheen once water is involved
      if (step > 0 && step < 4) {
        ctx.fillStyle = "rgba(150,200,220,.28)";
        ctx.fillRect(0, 190, W, H - 190);
      }

      const baseX = 140;
      const baseY = 150;
      const len = car.length;

      // Body
      ctx.fillStyle = car.body;
      ctx.beginPath();
      ctx.roundRect(baseX, baseY - 34, len, 34, 7);
      ctx.fill();
      // Roof / cab
      ctx.beginPath();
      ctx.roundRect(baseX + 34, baseY - 34 - car.roof, len * 0.52, car.roof, [9, 9, 0, 0]);
      ctx.fill();
      // Glass
      ctx.fillStyle = "rgba(226,240,246,.92)";
      ctx.fillRect(baseX + 42, baseY - 30 - car.roof + 6, len * 0.44, car.roof - 12);
      // Wheels
      for (const wx of [baseX + 34, baseX + len - 40]) {
        ctx.fillStyle = "#17140f";
        ctx.beginPath();
        ctx.arc(wx, baseY + 2, 17, 0, Math.PI * 2);
        ctx.fill();
        // Tire shine is the last pass, and it shows.
        ctx.fillStyle = step > 4 ? "#4b4741" : "#2e2b27";
        ctx.beginPath();
        ctx.arc(wx, baseY + 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cfc9b8";
        ctx.beginPath();
        ctx.arc(wx, baseY + 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dirt, thinning with each of the first three passes.
      const grime = Math.max(0, 1 - step / 3);
      if (grime > 0) {
        ctx.fillStyle = `rgba(96,80,58,${0.5 * grime})`;
        for (let i = 0; i < 90; i += 1) {
          const gx = baseX + ((i * 53) % len);
          const gy = baseY - 34 - (i % 5 === 0 ? car.roof * 0.6 : 0) + ((i * 29) % 32);
          ctx.fillRect(gx, gy, 4, 3);
        }
      }

      // Foam sits on the car between the foam and rinse passes.
      if (step === 2) {
        ctx.fillStyle = "rgba(255,255,255,.86)";
        for (let i = 0; i < 60; i += 1) {
          const fx = baseX + ((i * 37 + frame) % len);
          const fy = baseY - 66 + ((i * 23) % 60);
          ctx.beginPath();
          ctx.arc(fx, fy, 6 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Water while spraying or rinsing.
      if (step === 1 || step === 3) {
        ctx.strokeStyle = "rgba(150,205,230,.8)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 46; i += 1) {
          const wx = baseX - 30 + ((i * 41 + frame * 7) % (len + 60));
          const wy = 40 + ((i * 67 + frame * 9) % 120);
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx - 3, wy + 12);
          ctx.stroke();
        }
      }

      // The finished shine: a travelling highlight along the flank.
      if (finished) {
        const sweep = baseX + ((frame * 2.2) % (len + 60)) - 30;
        const shine = ctx.createLinearGradient(sweep - 26, 0, sweep + 26, 0);
        shine.addColorStop(0, "rgba(255,255,255,0)");
        shine.addColorStop(0.5, "rgba(255,255,255,.5)");
        shine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = shine;
        ctx.fillRect(baseX, baseY - 34 - car.roof, len, 34 + car.roof);
      }

      // Bay sign
      ctx.fillStyle = "rgba(23,20,18,.75)";
      ctx.font = "900 13px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText("WASH BAY · SUNDAY", 18, 30);
    },
    W,
    H,
  );

  function advance() {
    if (finished) return;
    const current = STEPS[step];
    if (current.key === "spray" || current.key === "rinse") {
      garageAudio.spray();
      ambience.set("water", sound ? 0.05 : 0, 0.1);
    } else if (current.key === "foam") garageAudio.spray();
    else if (current.key === "dry") cozyAudio.compressor();
    else cozyAudio.drawer();
    setNote(current.done);
    setStep((value) => value + 1);
  }

  function nextCar() {
    cozyAudio.doorBell();
    setWashed((value) => value + 1);
    setVehicle((value) => (value + 1) % VEHICLES.length);
    setStep(0);
    setNote(
      `Here comes ${VEHICLES[(vehicle + 1) % VEHICLES.length].name}, still wearing the week.`,
    );
  }

  return (
    <CozyShell
      edition="Ocean Heights · wash bay"
      title="Sunday Car Wash"
      note="Whatever rolls in gets the full five passes. There is no clock and no way to do it wrong — the next car is always along in a minute."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`A wash bay with ${car.name} part way through a wash`}
        />
      </div>

      <p className="cozy-note" aria-live="polite">
        <b>{car.name[0].toUpperCase() + car.name.slice(1)}.</b> {note}
        {washed > 0 ? ` · ${washed} sent out shining today.` : ""}
      </p>

      <div className="cozy-actions">
        {STEPS.map((entry, index) => (
          <button
            key={entry.key}
            type="button"
            className={index < step ? "is-on" : ""}
            disabled={index !== step}
            onClick={advance}
          >
            {index + 1}. {entry.label}
          </button>
        ))}
        <button type="button" onClick={nextCar}>
          {finished ? "Wave the next car in" : "Skip to the next car"}
        </button>
      </div>
    </CozyShell>
  );
}
