"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DIAL_MAX,
  DIAL_MIN,
  cozyAudio,
  radio,
  stationLock,
  stations,
} from "@/lib/garage-audio";

/**
 * A dashboard radio you actually operate: a lit dial with a needle you drag
 * across the band, a volume knob and a tuning knob that both turn, and chrome
 * preset buttons. Nothing streams — every station is a chord pad synthesised
 * in lib/garage-audio.ts, so it works offline and can never pull in someone
 * else's audio.
 */
export function RadioSet({
  on,
  onPowerChange,
  compact = false,
}: {
  on: boolean;
  onPowerChange: (on: boolean) => void;
  compact?: boolean;
}) {
  const [dial, setDial] = useState(93.1);
  const [volume, setVolume] = useState(0.6);
  // State, not a ref: pressing a knob has to re-render so the effect below
  // actually attaches the window listeners. As a ref the knobs never dragged.
  const [dragging, setDragging] = useState<"tune" | "volume" | null>(null);
  const { station, lock } = stationLock(dial);

  useEffect(() => {
    if (on) radio.tune(dial, volume);
    else radio.off();
  }, [on, dial, volume]);

  // Leaving the scene should not leave the radio playing.
  useEffect(() => () => radio.off(), []);

  const nudge = useCallback((by: number) => {
    setDial((value) => Math.min(DIAL_MAX, Math.max(DIAL_MIN, Math.round((value + by) * 10) / 10)));
  }, []);

  // Knobs are dragged: vertical movement turns them, which works with a mouse
  // and a thumb alike.
  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: PointerEvent) => {
      if (dragging === "tune") nudge(-event.movementY * 0.08);
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

  const position = ((dial - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * 100;

  return (
    <div className={`radio-set${compact ? " is-compact" : ""}${on ? " is-on" : ""}`}>
      <div className="radio-face">
        <div className="radio-dial">
          <div className="radio-dial-glass" aria-hidden="true">
            {/* Band ticks every megahertz, numbered every four. */}
            {Array.from({ length: DIAL_MAX - DIAL_MIN + 1 }, (_, index) => {
              const hz = DIAL_MIN + index;
              return (
                <span
                  key={hz}
                  className={index % 4 === 0 ? "is-major" : ""}
                  style={{ left: `${((hz - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * 100}%` }}
                >
                  {index % 4 === 0 ? <b>{Math.round(hz)}</b> : null}
                </span>
              );
            })}
            {stations.map((entry) => (
              <i
                key={entry.id}
                className="radio-station-mark"
                style={{ left: `${((entry.dial - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * 100}%` }}
              />
            ))}
            <div className="radio-needle" style={{ left: `${position}%` }} />
          </div>

          <input
            type="range"
            className="radio-tune-track"
            min={DIAL_MIN}
            max={DIAL_MAX}
            step={0.1}
            value={dial}
            aria-label="Tuning"
            onChange={(event) => setDial(Number(event.target.value))}
          />

          <p className="radio-readout" aria-live="polite">
            <b>{dial.toFixed(1)}</b>
            <span>{on ? (lock > 0.45 ? station.name : "· · · static · · ·") : "Off"}</span>
          </p>
        </div>

        <div className="radio-knobs">
          <div className="radio-knob-wrap">
            <button
              type="button"
              className="radio-knob"
              style={{ "--turn": `${volume * 270 - 135}deg` } as React.CSSProperties}
              aria-label={`Volume ${Math.round(volume * 100)} percent. Drag up or down, or use arrow keys.`}
              onPointerDown={() => { setDragging("volume"); }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") setVolume((v) => Math.min(1, v + 0.08));
                if (event.key === "ArrowDown") setVolume((v) => Math.max(0, v - 0.08));
              }}
            >
              <i aria-hidden="true" />
            </button>
            <small>Volume</small>
          </div>
          <div className="radio-knob-wrap">
            <button
              type="button"
              className="radio-knob"
              style={{ "--turn": `${position * 2.7 - 135}deg` } as React.CSSProperties}
              aria-label={`Tuning ${dial.toFixed(1)}. Drag up or down, or use arrow keys.`}
              onPointerDown={() => { setDragging("tune"); }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" || event.key === "ArrowRight") nudge(0.1);
                if (event.key === "ArrowDown" || event.key === "ArrowLeft") nudge(-0.1);
              }}
            >
              <i aria-hidden="true" />
            </button>
            <small>Tune</small>
          </div>
        </div>
      </div>

      <div className="radio-presets">
        <button
          type="button"
          className={`radio-power${on ? " is-on" : ""}`}
          aria-pressed={on}
          onClick={() => { cozyAudio.click(); onPowerChange(!on); }}
        >
          {on ? "On" : "Off"}
        </button>
        {stations.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={station.id === entry.id && lock > 0.45 ? "is-tuned" : ""}
            onClick={() => { cozyAudio.click(); setDial(entry.dial); if (!on) onPowerChange(true); }}
          >
            {entry.dial.toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
