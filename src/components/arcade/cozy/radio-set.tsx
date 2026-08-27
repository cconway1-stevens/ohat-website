"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AmbienceLayer,
  type Band,
  BANDS,
  ambience,
  cozyAudio,
  radio,
  stationLock,
  stations,
} from "@/lib/arcade/garage-audio";

const PRESET_KEY = "ohat-radio-presets";
const PRESET_COUNT = 5;

// The blend-your-own background panel. Each one is a bed the ambience engine
// already knows how to make, so nothing extra is downloaded.
const NOISE: { layer: AmbienceLayer; label: string }[] = [
  { layer: "rain", label: "Rain" },
  { layer: "road", label: "Road" },
  { layer: "shopHum", label: "Shop hum" },
  { layer: "fluorescent", label: "Strip light" },
  { layer: "traffic", label: "Traffic" },
  { layer: "water", label: "Wash bay" },
];

function readPresets(): number[] {
  const fallback = stations
    .filter((s) => s.band === "FM")
    .slice(0, PRESET_COUNT)
    .map((s) => s.dial);
  try {
    const stored = JSON.parse(window.localStorage.getItem(PRESET_KEY) ?? "null");
    if (Array.isArray(stored) && stored.length === PRESET_COUNT) return stored;
  } catch {
    // A private browser just gets the factory presets.
  }
  return fallback;
}

/**
 * A vintage dash radio: chrome faceplate, amber dial glass, two ribbed knobs
 * on stalks, five mechanical presets that depress and latch, an AM/FM switch,
 * tone and balance sliders, and a stereo lamp.
 *
 * Hold a preset to store whatever you are tuned to — saved on the device.
 * Nothing streams: every station is synthesised in lib/garage-audio.ts.
 */
export function RadioSet({
  on,
  onPowerChange,
}: {
  on: boolean;
  onPowerChange: (on: boolean) => void;
}) {
  const [band, setBand] = useState<Band>("FM");
  const [dial, setDial] = useState(89.9);
  const [volume, setVolume] = useState(0.6);
  const [tone, setTone] = useState(0.6);
  const [balance, setBalance] = useState(0);
  // State rather than a ref: pressing a knob must re-render so the drag effect
  // below actually attaches its listeners.
  const [dragging, setDragging] = useState<"tune" | "volume" | null>(null);
  const [presets, setPresets] = useState<number[]>(() =>
    stations
      .filter((s) => s.band === "FM")
      .slice(0, PRESET_COUNT)
      .map((s) => s.dial),
  );
  const [held, setHeld] = useState(-1);
  const [flash, setFlash] = useState("");

  const range = BANDS[band];
  const { station, lock } = stationLock(dial, band);
  const tuned = lock > 0.45;

  useEffect(() => {
    // localStorage is browser-only, so presets load after mount — deferred a
    // frame so it reads as its own render rather than a cascading one.
    const id = window.setTimeout(() => setPresets(readPresets()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (on) radio.tune(dial, { volume, tone, balance, band });
    else radio.off();
  }, [on, dial, volume, tone, balance, band]);

  // Leaving the scene must not leave the radio playing.
  useEffect(() => () => radio.off(), []);

  const nudge = useCallback(
    (steps: number) => {
      setDial((value) => {
        const next = value + steps * range.step;
        return Math.min(
          range.max,
          Math.max(range.min, Number(next.toFixed(band === "AM" ? 0 : 1))),
        );
      });
    },
    [range.max, range.min, range.step, band],
  );

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: PointerEvent) => {
      if (dragging === "tune") nudge(-event.movementY * 0.8);
      else setVolume((value) => Math.min(1, Math.max(0, value - event.movementY * 0.012)));
    };
    const stop = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging, nudge]);

  function switchBand(next: Band) {
    cozyAudio.click();
    setBand(next);
    setDial(stations.find((entry) => entry.band === next)?.dial ?? BANDS[next].min);
  }

  function storePreset(slot: number) {
    const next = presets.map((value, index) => (index === slot ? dial : value));
    setPresets(next);
    try {
      window.localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    } catch {
      /* fine */
    }
    cozyAudio.coin();
    setFlash(`Preset ${slot + 1} set to ${dial.toFixed(band === "AM" ? 0 : 1)}`);
    window.setTimeout(() => setFlash(""), 1800);
  }

  const position = ((dial - range.min) / (range.max - range.min)) * 100;
  const inBand = stations.filter((entry) => entry.band === band);

  return (
    <div className={`car-radio${on ? " is-on" : ""}`}>
      <div className="car-radio-face">
        <div className="car-radio-brand">
          <b>OHAT</b>
          <small>AUTO SOUND</small>
        </div>

        {/* Volume knob on its stalk. */}
        <div className="car-radio-stalk">
          <button
            type="button"
            className="car-knob"
            style={{ "--turn": `${volume * 270 - 135}deg` } as React.CSSProperties}
            aria-label={`Volume ${Math.round(volume * 100)} percent. Drag or use arrow keys.`}
            onPointerDown={() => setDragging("volume")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") setVolume((v) => Math.min(1, v + 0.08));
              if (e.key === "ArrowDown") setVolume((v) => Math.max(0, v - 0.08));
            }}
          >
            <i aria-hidden="true" />
          </button>
          <small>Vol</small>
        </div>

        <div className="car-radio-middle">
          <div className="car-dial" aria-hidden="true">
            {Array.from({ length: 21 }, (_, index) => (
              <span
                key={index}
                className={index % 4 === 0 ? "is-major" : ""}
                style={{ left: `${(index / 20) * 100}%` }}
              >
                {index % 4 === 0 ? (
                  <b>{Math.round(range.min + (index / 20) * (range.max - range.min))}</b>
                ) : null}
              </span>
            ))}
            {inBand.map((entry) => (
              <i
                key={entry.id}
                className="car-dial-mark"
                style={{ left: `${((entry.dial - range.min) / (range.max - range.min)) * 100}%` }}
              />
            ))}
            <div className="car-needle" style={{ left: `${position}%` }} />
          </div>

          <div className="car-readout">
            <b>{dial.toFixed(band === "AM" ? 0 : 1)}</b>
            <span className="car-band">{band}</span>
            <span className={`car-stereo${on && tuned && band === "FM" ? " is-lit" : ""}`}>ST</span>
            <em>
              {!on ? "Off" : tuned ? `${station.name} · ${station.genre}` : "· · · static · · ·"}
            </em>
          </div>

          <input
            type="range"
            className="car-tune-track"
            min={range.min}
            max={range.max}
            step={range.step}
            value={dial}
            aria-label={`Tuning, ${band} band`}
            onChange={(event) => setDial(Number(event.target.value))}
          />
        </div>

        {/* Tuning knob on its stalk. */}
        <div className="car-radio-stalk">
          <button
            type="button"
            className="car-knob"
            style={{ "--turn": `${position * 2.7 - 135}deg` } as React.CSSProperties}
            aria-label={`Tuning ${dial.toFixed(1)}. Drag or use arrow keys.`}
            onPointerDown={() => setDragging("tune")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowRight") nudge(1);
              if (e.key === "ArrowDown" || e.key === "ArrowLeft") nudge(-1);
            }}
          >
            <i aria-hidden="true" />
          </button>
          <small>Tune</small>
        </div>
      </div>

      {/* Mechanical preset bank — press to recall, hold to store. */}
      <div className="car-presets">
        <button
          type="button"
          className={`car-push car-power${on ? " is-down" : ""}`}
          aria-pressed={on}
          onClick={() => {
            cozyAudio.click();
            onPowerChange(!on);
          }}
        >
          <span>{on ? "ON" : "OFF"}</span>
        </button>
        {presets.map((value, slot) => {
          const active = Math.abs(value - dial) < range.step / 2;
          return (
            <button
              key={slot}
              type="button"
              className={`car-push${active ? " is-down" : ""}${held === slot ? " is-holding" : ""}`}
              aria-label={`Preset ${slot + 1}, ${value}. Press to recall, hold to store the current frequency.`}
              onPointerDown={() => {
                setHeld(slot);
                // A long press is the classic "store what I'm listening to".
                window.setTimeout(() => {
                  setHeld((current) => {
                    if (current === slot) storePreset(slot);
                    return -1;
                  });
                }, 700);
              }}
              onPointerUp={() => {
                setHeld((current) => {
                  if (current === slot) {
                    cozyAudio.click();
                    setDial(value);
                    if (!on) onPowerChange(true);
                  }
                  return -1;
                });
              }}
              onPointerLeave={() => setHeld(-1)}
            >
              <span>{slot + 1}</span>
              <em>{value.toFixed(band === "AM" ? 0 : 1)}</em>
            </button>
          );
        })}
        <div className="car-band-switch" role="group" aria-label="Band">
          {(["AM", "FM"] as Band[]).map((option) => (
            <button
              key={option}
              type="button"
              className={band === option ? "is-on" : ""}
              aria-pressed={band === option}
              onClick={() => switchBand(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="car-hint" aria-live="polite">
        {flash ||
          "Press a preset to recall it. Hold one for a moment to store what you're tuned to."}
      </p>

      <div className="car-sliders">
        <label>
          <span>Tone</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
          />
          <small>{tone < 0.34 ? "mellow" : tone > 0.7 ? "bright" : "flat"}</small>
        </label>
        <label>
          <span>Balance</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
          />
          <small>{balance < -0.1 ? "left" : balance > 0.1 ? "right" : "centre"}</small>
        </label>
      </div>

      <details className="car-noise">
        <summary>Background noise</summary>
        <p>
          Blend your own room under the station. Everything here is generated on the spot — no
          downloads.
        </p>
        <div>
          {NOISE.map((entry) => (
            <NoiseSlider key={entry.layer} layer={entry.layer} label={entry.label} />
          ))}
        </div>
      </details>
    </div>
  );
}

function NoiseSlider({ layer, label }: { layer: AmbienceLayer; label: string }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    ambience.set(layer, level * 0.06, 0.25);
  }, [layer, level]);
  return (
    <label className="car-noise-slider">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={level}
        onChange={(event) => setLevel(Number(event.target.value))}
      />
    </label>
  );
}
