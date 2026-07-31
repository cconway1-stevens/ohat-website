"use client";

import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";

export type CozyScene = "closing-time" | "sunday-wash" | "night-drive" | "parts-counter" | "garage-radio";

type RadioStation = { stationuuid: string; name: string; url_resolved: string; homepage?: string };

const RADIO_BROWSER_CLASSIC_HITS = "https://de1.api.radio-browser.info/json/stations/bytag/classic%20hits?hidebroken=true&order=clickcount&reverse=true&limit=6";

const SCENES: Record<CozyScene, {
  label: string;
  note: string;
  action: string;
  sound: keyof Pick<typeof garageAudio, "hum" | "spray" | "chime" | "radio">;
}> = {
  "closing-time": { label: "Closing Time Garage", note: "The last bay is quiet. Let the rain do its thing.", action: "Toggle bay lights", sound: "hum" },
  "sunday-wash": { label: "Sunday Car Wash", note: "A slow wash in the warm morning sun.", action: "Start the rinse", sound: "spray" },
  "night-drive": { label: "Night Drive Home", note: "Nothing to chase. Just a calm road and a good station.", action: "Change station", sound: "radio" },
  "parts-counter": { label: "The Parts Counter", note: "The bell rings, a part gets packed, and the day rolls on.", action: "Ring the counter bell", sound: "chime" },
  "garage-radio": { label: "Garage Radio", note: "The waiting room is warm. The garage is moving just beyond the glass.", action: "Turn the dial", sound: "radio" },
};

export function CozyGarage({ scene }: { scene: CozyScene }) {
  const config = SCENES[scene];
  const [sound, setSound] = useState(false);
  const [active, setActive] = useState(false);
  const [detail, setDetail] = useState(0);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [radioStatus, setRadioStatus] = useState("Finding a few public classic-hits stations...");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (scene !== "garage-radio") return;
    const controller = new AbortController();
    const audio = audioRef.current;
    fetch(RADIO_BROWSER_CLASSIC_HITS, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("radio lookup failed")))
      .then((data: RadioStation[]) => {
        const playable = data.filter((station) => station.name && station.url_resolved).slice(0, 6);
        setStations(playable);
        setRadioStatus(playable.length ? "Choose a station. Public streams can vary by location." : "No station is available right now.");
      })
      .catch(() => { if (!controller.signal.aborted) setRadioStatus("The station list is taking a coffee break. Try again in a moment."); });
    return () => { controller.abort(); audio?.pause(); };
  }, [scene]);

  const interact = () => {
    setActive((value) => !value);
    setDetail((value) => value + 1);
    if (sound) garageAudio[config.sound]();
  };

  const playStation = (station: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = station.url_resolved;
    audio.play().then(() => setRadioStatus(`Now playing ${station.name}.`)).catch(() => setRadioStatus("That stream could not start here. Try another station."));
  };

  return (
    <section className={`cozy-garage cozy-${scene}${active ? " is-active" : ""}`} aria-label={config.label}>
      <div className="cozy-sky" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="cozy-room" aria-hidden="true">
        <div className="cozy-window"><span /></div>
        <div className="cozy-shelves"><b /><b /><b /></div>
        <div className="cozy-car"><span /><i /><i /></div>
        <div className="cozy-sign">OHAT</div>
        <div className="cozy-counter"><span /><span /><span /></div>
      </div>
      <div className="cozy-copy">
        <p className="eyebrow">No score. No rush.</p>
        <h2>{config.label}</h2>
        <p>{config.note}</p>
        <div className="cozy-controls">
          <button type="button" onClick={interact}>{config.action}</button>
          <button
            type="button"
            className={sound ? "is-on" : ""}
            aria-pressed={sound}
            onClick={() => { setSound((value) => !value); if (!sound) garageAudio[config.sound](); }}
          >
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>
        <p className="cozy-detail" aria-live="polite">
          {detail === 0 ? "Tap around when you feel like it." : scene === "night-drive" ? "The next station fades in under the road noise." : scene === "sunday-wash" ? "Water catches the light across the hood." : scene === "parts-counter" ? "The bell settles and the receipt printer chatters." : scene === "garage-radio" ? "A new song hums softly through the waiting room." : "The garage settles into its evening rhythm."}
        </p>
        {scene === "garage-radio" ? (
          <div className="cozy-radio" aria-label="Classic hits radio">
            <audio ref={audioRef} preload="none" />
            <p>{radioStatus}</p>
            <div>
              {stations.map((station) => (
                <button type="button" key={station.stationuuid} onClick={() => playStation(station)}>
                  {station.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
