"use client";

import { useEffect, useRef, useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";
import { RadioPanel } from "./radio-panel";

const W = 480;
const H = 250;
const HORIZON = 96;

type Weather = "clear" | "drizzle" | "rain" | "fog";
const WEATHER_ORDER: Weather[] = ["clear", "drizzle", "rain", "fog"];
const WEATHER_NOTE: Record<Weather, string> = {
  clear: "Clear night. You can see the water off to the left.",
  drizzle: "A soft drizzle starts up. Wipers on intermittent.",
  rain: "Proper rain now, drumming on the roof.",
  fog: "Fog rolling in off the bay. Slow it down a little.",
};

/**
 * Night Drive Home — an hour of the Parkway with nothing at the end of it.
 * The road never runs out, nothing can hit you, and the only decisions are
 * what station to listen to and how warm to keep the cabin.
 */
export function NightDrive() {
  const [sound, setSound] = useState(false);
  const [heater, setHeater] = useState(1); // 0 off, 1 low, 2 high
  const [wipers, setWipers] = useState(false);
  const [weather, setWeather] = useState<Weather>("clear");
  const [note, setNote] = useState("Headlights on, windows up. Nowhere to be.");
  const [stops, setStops] = useState({ gas: 0, coffee: 0 });
  const wiperPhase = useRef(0);

  useAmbience(sound, {
    road: 0.05,
    rain: weather === "rain" ? 0.05 : weather === "drizzle" ? 0.025 : 0,
    shopHum: heater > 0 ? 0.01 * heater : 0,
  });

  // The weather turns over on its own, slowly, so the drive keeps changing.
  useEffect(() => {
    const id = window.setInterval(() => {
      setWeather((current) => {
        const next = WEATHER_ORDER[(WEATHER_ORDER.indexOf(current) + 1) % WEATHER_ORDER.length];
        setNote(WEATHER_NOTE[next]);
        return next;
      });
    }, 42000);
    return () => window.clearInterval(id);
  }, []);

  const canvasRef = useSceneCanvas(
    (ctx, frame) => {
      // Night sky, warmer near the horizon where the towns are.
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
      sky.addColorStop(0, "#0a0d18");
      sky.addColorStop(1, weather === "fog" ? "#2b3040" : "#1d2436");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HORIZON);

      if (weather === "clear") {
        ctx.fillStyle = "rgba(247,239,217,.8)";
        for (let i = 0; i < 40; i += 1) {
          ctx.fillRect((i * 97) % W, (i * 37) % (HORIZON - 20), 1.5, 1.5);
        }
        ctx.fillStyle = "rgba(247,239,217,.9)";
        ctx.beginPath();
        ctx.arc(392, 30, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0a0d18";
        ctx.beginPath();
        ctx.arc(386, 27, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Treeline and the odd house light, scrolling by.
      ctx.fillStyle = "#0e1119";
      for (let i = 0; i < 26; i += 1) {
        const x = (i * 41 - ((frame * 1.4) % 41) * 26 + frame * -1.4) % (W + 60);
        const px = (((x % (W + 60)) + W + 60) % (W + 60)) - 30;
        const h = 16 + ((i * 13) % 22);
        ctx.beginPath();
        ctx.moveTo(px, HORIZON);
        ctx.lineTo(px + 9, HORIZON - h);
        ctx.lineTo(px + 18, HORIZON);
        ctx.closePath();
        ctx.fill();
        if (i % 7 === 0) {
          ctx.fillStyle = "rgba(246,189,56,.75)";
          ctx.fillRect(px + 7, HORIZON - h + 6, 3, 3);
          ctx.fillStyle = "#0e1119";
        }
      }

      // Road
      ctx.fillStyle = "#1a1a1e";
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(168, HORIZON);
      ctx.lineTo(312, HORIZON);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Centre line, rushing toward you.
      ctx.fillStyle = "rgba(246,189,56,.85)";
      for (let i = 0; i < 10; i += 1) {
        const t = (i / 10 + ((frame * 0.012) % 0.1)) % 1;
        const y = HORIZON + t * t * (H - HORIZON);
        const wide = 1.4 + t * t * 9;
        const tall = 2 + t * t * 16;
        ctx.fillRect(W / 2 - wide / 2, y, wide, tall);
      }
      // Shoulder reflectors
      for (let i = 0; i < 8; i += 1) {
        const t = (i / 8 + ((frame * 0.009) % 0.125)) % 1;
        const y = HORIZON + t * t * (H - HORIZON);
        const spread = t * t * (W / 2 - 24);
        ctx.fillStyle = "rgba(255,120,110,.8)";
        ctx.fillRect(W / 2 - 150 - spread, y, 2 + t * 3, 2 + t * 3);
        ctx.fillStyle = "rgba(255,255,255,.65)";
        ctx.fillRect(W / 2 + 148 + spread, y, 2 + t * 3, 2 + t * 3);
      }

      // Oncoming headlights, now and then.
      const pass = (frame % 520) / 520;
      if (pass < 0.42) {
        const t = pass / 0.42;
        const y = HORIZON + t * t * (H - HORIZON - 40);
        const spread = 3 + t * t * 40;
        ctx.fillStyle = `rgba(255,246,214,${0.35 + t * 0.5})`;
        ctx.beginPath();
        ctx.arc(W / 2 - 30 - spread, y, 2 + t * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W / 2 - 8 - spread, y, 2 + t * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Weather over the glass.
      if (weather === "rain" || weather === "drizzle") {
        const drops = weather === "rain" ? 70 : 28;
        ctx.strokeStyle = "rgba(190,215,235,.45)";
        ctx.lineWidth = 1;
        for (let i = 0; i < drops; i += 1) {
          const x = (i * 71 + frame * 3) % W;
          const y = (i * 53 + frame * 11) % H;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 2, y + 10);
          ctx.stroke();
        }
      }
      if (weather === "fog") {
        ctx.fillStyle = "rgba(190,200,215,.16)";
        ctx.fillRect(0, HORIZON - 20, W, H - HORIZON + 20);
      }

      // Wiper blade sweeping the windscreen.
      if (wipers) {
        wiperPhase.current += 0.035;
        const angle = Math.sin(wiperPhase.current) * 0.7;
        ctx.save();
        ctx.translate(W / 2, H + 26);
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(18,18,20,.85)";
        ctx.fillRect(-4, -H - 20, 8, H + 20);
        ctx.restore();
      }

      // Cabin: dash lit by the instruments, warm when the heater is up.
      const dash = ctx.createLinearGradient(0, H - 52, 0, H);
      dash.addColorStop(0, "rgba(12,12,16,.2)");
      dash.addColorStop(1, "#0b0b0e");
      ctx.fillStyle = dash;
      ctx.fillRect(0, H - 52, W, 52);
      ctx.fillStyle = `rgba(246,189,56,${0.12 + heater * 0.06})`;
      ctx.fillRect(0, H - 52, W, 3);
      // Instrument glow
      ctx.strokeStyle = "rgba(246,189,56,.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(78, H - 22, 15, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W - 78, H - 22, 15, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
      ctx.fillStyle = "rgba(246,189,56,.85)";
      ctx.font = "900 8px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("FM", W / 2, H - 20);
    },
    W,
    H,
  );

  return (
    <CozyShell
      edition="Ocean Heights · the long way home"
      title="Night Drive Home"
      note="The Parkway at night with nothing at the end of it. Nothing can hit you and there is nowhere to be — pick a station, set the heater, and let the weather come and go."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label="Driving a dark road at night, seen over the dashboard"
        />
      </div>

      <p className="cozy-note" aria-live="polite">
        {note}
      </p>

      <RadioPanel />

      <div className="cozy-actions">
        <button
          type="button"
          onClick={() => {
            cozyAudio.click();
            const next = (heater + 1) % 3;
            setHeater(next);
            setNote(
              next === 0
                ? "Heater off. The glass starts to mist."
                : next === 1
                  ? "Heater on low. Just enough."
                  : "Heater on high. Toes are happy.",
            );
          }}
        >
          Heater: {["off", "low", "high"][heater]}
        </button>
        <button
          type="button"
          className={wipers ? "is-on" : ""}
          aria-pressed={wipers}
          onClick={() => {
            cozyAudio.wiper();
            setWipers((on) => !on);
            setNote(wipers ? "Wipers off." : "Wipers on. Steady rhythm.");
          }}
        >
          Wipers {wipers ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={() => {
            cozyAudio.pour();
            setStops((s) => ({ ...s, coffee: s.coffee + 1 }));
            setNote("You pull into a lit-up Wawa and come out with a coffee. Back on the road.");
          }}
        >
          Stop for coffee
        </button>
        <button
          type="button"
          onClick={() => {
            cozyAudio.compressor();
            setStops((s) => ({ ...s, gas: s.gas + 1 }));
            setNote("Full-serve. Somebody fills it while you sit with the window half down.");
          }}
        >
          Stop for gas
        </button>
        <button
          type="button"
          onClick={() => {
            const next = WEATHER_ORDER[(WEATHER_ORDER.indexOf(weather) + 1) % WEATHER_ORDER.length];
            setWeather(next);
            setNote(WEATHER_NOTE[next]);
          }}
        >
          Weather: {weather}
        </button>
      </div>

      <p className="cozy-note">
        {stops.coffee + stops.gas === 0
          ? "Straight through so far."
          : `${stops.coffee} coffee stop${stops.coffee === 1 ? "" : "s"} · ${stops.gas} fill-up${stops.gas === 1 ? "" : "s"} this drive.`}
      </p>
    </CozyShell>
  );
}
