"use client";

import { useEffect, useState } from "react";
import { type AmbienceLayer, ambience, cozyAudio, radio } from "@/lib/garage-audio";
import { LiveRadio } from "./live-radio";
import { RadioSet } from "./radio-set";

const LAYERS: { layer: AmbienceLayer; label: string; hint: string }[] = [
  { layer: "rain", label: "Rain", hint: "on the roof" },
  { layer: "road", label: "Road", hint: "tires on wet asphalt" },
  { layer: "shopHum", label: "Shop hum", hint: "compressor and lifts" },
  { layer: "fluorescent", label: "Strip light", hint: "the buzz overhead" },
  { layer: "traffic", label: "Traffic", hint: "the boulevard outside" },
  { layer: "water", label: "Wash bay", hint: "water on panels" },
];

/**
 * Two ways to fill the room, because they are good at different things.
 *
 * "Ambience" is the quiet original: no stations, no dial, just a set of beds
 * you blend to taste. "Car radio" is the vintage dash unit with stations,
 * presets and tone. Whichever you pick, nothing is streamed or downloaded.
 */
export function RadioPanel() {
  const [mode, setMode] = useState<"ambience" | "radio" | "live">("ambience");
  const [radioOn, setRadioOn] = useState(false);

  // Switching source is a user action, so the dash unit is silenced right
  // there rather than in an effect reacting to the change.
  function chooseMode(next: "ambience" | "radio" | "live") {
    cozyAudio.click();
    if (next !== "radio") {
      radio.off();
      setRadioOn(false);
    }
    setMode(next);
  }

  return (
    <div className="radio-panel">
      <div className="radio-mode" role="group" aria-label="Sound source">
        <button
          type="button"
          className={mode === "ambience" ? "is-on" : ""}
          aria-pressed={mode === "ambience"}
          onClick={() => chooseMode("ambience")}
        >
          Ambience
        </button>
        <button
          type="button"
          className={mode === "radio" ? "is-on" : ""}
          aria-pressed={mode === "radio"}
          onClick={() => chooseMode("radio")}
        >
          Car radio
        </button>
        <button
          type="button"
          className={mode === "live" ? "is-on" : ""}
          aria-pressed={mode === "live"}
          onClick={() => chooseMode("live")}
        >
          Live stations
        </button>
      </div>

      {mode === "ambience" ? <AmbienceDeck /> : null}
      {mode === "radio" ? <RadioSet on={radioOn} onPowerChange={setRadioOn} /> : null}
      {mode === "live" ? <LiveRadio /> : null}
    </div>
  );
}

/** The original background-noise mixer, kept as its own thing. */
function AmbienceDeck() {
  return (
    <div className="ambience-deck">
      <p className="ambience-deck-note">
        No stations, nothing playing — just the room. Slide anything up to taste.
      </p>
      <div>
        {LAYERS.map((entry) => (
          <AmbienceSlider key={entry.layer} {...entry} />
        ))}
      </div>
    </div>
  );
}

function AmbienceSlider({ layer, label, hint }: { layer: AmbienceLayer; label: string; hint: string }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    ambience.set(layer, level * 0.07, 0.3);
  }, [layer, level]);

  // Leave the room quiet on the way out.
  useEffect(() => () => ambience.set(layer, 0, 0.2), [layer]);

  return (
    <label className="ambience-slider">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={level}
        aria-label={`${label} level`}
        onChange={(event) => setLevel(Number(event.target.value))}
      />
      <small>{level === 0 ? "off" : hint}</small>
    </label>
  );
}
