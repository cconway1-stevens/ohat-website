"use client";

/**
 * The '56 De Luxe — game side of the 3D dash radio.
 *
 * The canvas is the fun way to play; the controls under it do everything the
 * knobs and keys do, so the radio works without WebGL, without a pointer, and
 * without motion. Two sound sources share the one dial: the synthesised local
 * stations from lib/garage-audio (always there, nothing fetched), and a LIVE
 * band that pulls real streams from the public Radio Browser directory.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ambience,
  BANDS,
  cozyAudio,
  radio,
  stationLock,
  stations,
} from "@/lib/arcade/garage-audio";
import { CozyShell, useAmbience } from "./cozy/cozy-shell";
import { mountRadioScene, type RadioBand, type RadioSceneHandle } from "./radio-3d-scene";

const SAVE_KEY = "ohat-radio3d-v1";
const PRESET_COUNT = 5;
const DIRECTORY = "https://de1.api.radio-browser.info/json/stations/search";

type LiveStation = {
  id: string;
  name: string;
  url: string;
  country: string;
  bitrate: number;
  codec: string;
};

const GENRES = [
  { id: "oldies", label: "Oldies", tag: "oldies" },
  { id: "fifties", label: "'50s", tag: "50s" },
  { id: "rock", label: "Classic rock", tag: "classic rock" },
  { id: "country", label: "Country", tag: "country" },
  { id: "jazz", label: "Jazz", tag: "jazz" },
  { id: "news", label: "News talk", tag: "news" },
] as const;

type Presets = Record<RadioBand, number[]>;

function defaultPresets(): Presets {
  const fm = stations
    .filter((s) => s.band === "FM")
    .slice(0, PRESET_COUNT)
    .map((s) => s.dial);
  const am = stations.filter((s) => s.band === "AM").map((s) => s.dial);
  while (am.length < PRESET_COUNT) am.push(am[am.length - 1] ?? 1010);
  return { FM: fm, AM: am.slice(0, PRESET_COUNT), LIVE: [0, 3, 6, 9, 11] };
}

type Save = {
  volume: number;
  tone: number;
  band: RadioBand;
  dial: number;
  presets: Presets;
};

function loadSave(): Save {
  const fallback: Save = {
    volume: 0.65,
    tone: 0.6,
    band: "FM",
    dial: 95.5,
    presets: defaultPresets(),
  };
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      volume: typeof parsed.volume === "number" ? parsed.volume : fallback.volume,
      tone: typeof parsed.tone === "number" ? parsed.tone : fallback.tone,
      band:
        parsed.band === "AM" || parsed.band === "FM" || parsed.band === "LIVE"
          ? parsed.band
          : fallback.band,
      dial: typeof parsed.dial === "number" ? parsed.dial : fallback.dial,
      presets:
        parsed.presets && parsed.presets.FM?.length === PRESET_COUNT
          ? (parsed.presets as Presets)
          : fallback.presets,
    };
  } catch {
    return fallback;
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** In LIVE mode the FM scale is borrowed as a station-index sweep. */
function indexToDial(index: number, count: number): number {
  if (count <= 1) return BANDS.FM.min;
  return BANDS.FM.min + (index / (count - 1)) * (BANDS.FM.max - BANDS.FM.min);
}
function dialToIndex(dial: number, count: number): number {
  if (count <= 1) return 0;
  const t = (dial - BANDS.FM.min) / (BANDS.FM.max - BANDS.FM.min);
  return clamp(Math.round(t * (count - 1)), 0, count - 1);
}

export default function Radio3DGame() {
  const [sound, setSound] = useState(false);
  const [save] = useState<Save>(() => loadSave());
  const [power, setPower] = useState(false);
  const [band, setBand] = useState<RadioBand>(save.band);
  const [dial, setDial] = useState(save.dial);
  const [volume, setVolume] = useState(save.volume);
  const [tone, setTone] = useState(save.tone);
  const [presets, setPresets] = useState<Presets>(save.presets);
  const [liveList, setLiveList] = useState<LiveStation[]>([]);
  const [livePlaying, setLivePlaying] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [genre, setGenre] = useState<(typeof GENRES)[number]["id"]>("oldies");
  const [status, setStatus] = useState("Off. Push the left knob, or press Power below.");
  const [sceneFailed, setSceneFailed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<RadioSceneHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<{ bass: BiquadFilterNode; treble: BiquadFilterNode } | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  // The render loop and the audio graph read the freshest state through refs.
  const stateRef = useRef({ power, band, dial, volume, tone, liveList, livePlaying });
  useEffect(() => {
    stateRef.current = { power, band, dial, volume, tone, liveList, livePlaying };
  });

  useAmbience(sound, { fluorescent: 0.012, shopHum: 0.012 });

  /* --- persistence --- */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ volume, tone, band, dial, presets } satisfies Save),
      );
    } catch {
      /* storage blocked — the radio just won't remember */
    }
  }, [volume, tone, band, dial, presets]);

  /* --- the live band --- */
  const liveIndex = band === "LIVE" ? dialToIndex(dial, liveList.length) : 0;
  const liveStation = band === "LIVE" ? liveList[liveIndex] : undefined;

  const wireLiveGraph = useCallback(() => {
    const element = audioRef.current;
    if (!element || graphRef.current) return;
    try {
      const audio = new AudioContext();
      const source = audio.createMediaElementSource(element);
      const bass = audio.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 220;
      const treble = audio.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 4200;
      source.connect(bass).connect(treble).connect(audio.destination);
      graphRef.current = { bass, treble };
    } catch {
      // Without the graph the stream still plays; the tone knob just does nothing.
    }
  }, []);

  const playLive = useCallback(
    async (entry?: LiveStation) => {
      const element = audioRef.current;
      const target = entry ?? liveStation;
      if (!element || !target) return;
      wireLiveGraph();
      element.src = target.url;
      element.volume = stateRef.current.volume;
      setLiveLoading(true);
      setStatus(`Tuning in ${target.name}…`);
      try {
        await element.play();
        setLivePlaying(true);
        setStatus(`On air: ${target.name} — ${target.country}`);
      } catch {
        setLivePlaying(false);
        setStatus("That stream would not start here. Turn the dial for the next one.");
      } finally {
        setLiveLoading(false);
      }
    },
    [liveStation, wireLiveGraph],
  );

  const fetchLive = useCallback(
    async (genreId: (typeof GENRES)[number]["id"]) => {
      const entry = GENRES.find((g) => g.id === genreId) ?? GENRES[0];
      setLiveLoading(true);
      setStatus(`Scanning the airwaves for ${entry.label.toLowerCase()}…`);
      try {
        const params = new URLSearchParams({
          tag: entry.tag,
          hidebroken: "true",
          order: "clickcount",
          reverse: "true",
          limit: "24",
        });
        const response = await fetch(`${DIRECTORY}?${params}`);
        if (!response.ok) throw new Error("directory said no");
        const data = await response.json();
        const usable: LiveStation[] = data
          .filter((row: { name?: string; url_resolved?: string }) => row.name && row.url_resolved)
          .filter((row: { url_resolved: string }) => row.url_resolved.startsWith("https://"))
          .filter((row: { codec?: string }) => !row.codec || /mp3|aac/i.test(row.codec))
          .slice(0, 12)
          .map(
            (row: {
              stationuuid: string;
              name: string;
              url_resolved: string;
              country: string;
              bitrate: number;
              codec?: string;
            }) => ({
              id: row.stationuuid,
              name: row.name.trim().slice(0, 42),
              url: row.url_resolved,
              country: row.country || "—",
              bitrate: row.bitrate || 0,
              codec: row.codec || "stream",
            }),
          );
        setLiveList(usable);
        setLiveLoading(false);
        if (usable.length === 0) {
          setStatus("Nothing came back for that band. Try another genre.");
          return;
        }
        setStatus(`${usable.length} live stations on the dial. Turn the right knob.`);
        // Keep the needle where it was, snapped onto the nearest station.
        setDial(indexToDial(dialToIndex(stateRef.current.dial, usable.length), usable.length));
        if (stateRef.current.power && stateRef.current.band === "LIVE") {
          void playLive(usable[dialToIndex(stateRef.current.dial, usable.length)]);
        }
      } catch {
        setLiveLoading(false);
        setStatus(
          "The station directory is not answering — it is someone else's server. The local bands still play.",
        );
      }
    },
    [playLive],
  );

  /* --- gestures from the scene and the buttons --- */
  function seek(step: number) {
    cozyAudio.click();
    if (band === "LIVE") {
      if (liveList.length === 0) return;
      const next = (liveIndex + step + liveList.length) % liveList.length;
      setDial(indexToDial(next, liveList.length));
      return;
    }
    const inBand = stations
      .filter((s) => s.band === band)
      .map((s) => s.dial)
      .sort((a, b) => a - b);
    if (inBand.length === 0) return;
    const epsilon = band === "AM" ? 1 : 0.01;
    let next: number | undefined;
    if (step > 0) next = inBand.find((d) => d > dial + epsilon) ?? inBand[0];
    else next = [...inBand].reverse().find((d) => d < dial - epsilon) ?? inBand[inBand.length - 1];
    setDial(next);
  }

  function togglePower() {
    cozyAudio.click();
    setPower((on) => !on);
  }

  // The scan loop steps through stations on a timer, so it reads the freshest
  // seek through a ref rather than a stale closure.
  const seekRef = useRef(seek);
  useEffect(() => {
    seekRef.current = seek;
  });
  useEffect(() => {
    if (!scanning) return;
    const id = window.setInterval(() => seekRef.current(1), 900);
    return () => window.clearInterval(id);
  }, [scanning]);

  function cycleBand() {
    cozyAudio.click();
    setBand((current) => (current === "FM" ? "AM" : current === "AM" ? "LIVE" : "FM"));
  }

  function recallPreset(index: number) {
    cozyAudio.click();
    setDial(presets[band][index]);
  }

  function savePreset(index: number) {
    const next: Presets = {
      ...presets,
      [band]: presets[band].map((d, i) => (i === index ? dial : d)),
    };
    setPresets(next);
    sceneRef.current?.flashPreset(index);
    setStatus(`Preset ${index + 1} set.`);
  }

  // Hold-to-save on the HTML preset buttons, mirroring the piano keys.
  function presetDown(index: number) {
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      savePreset(index);
    }, 650);
  }
  function presetUp(index: number) {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      recallPreset(index);
    }
  }

  /* --- mount the 3D scene once --- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canvas.getContext("webgl2")) {
      window.setTimeout(() => setSceneFailed(true), 0);
      return;
    }
    let handle: RadioSceneHandle;
    try {
      handle = mountRadioScene(canvas, {
        onTune: (next) => {
          const range = stateRef.current.band === "AM" ? BANDS.AM : BANDS.FM;
          setDial(clamp(next, range.min, range.max));
        },
        onVolume: (next) => setVolume(clamp(next, 0, 1)),
        onPower: () => {
          cozyAudio.click();
          setPower((on) => !on);
        },
        onBand: () => {
          cozyAudio.click();
          setBand((current) => (current === "FM" ? "AM" : current === "AM" ? "LIVE" : "FM"));
        },
        onPreset: (index, action) => {
          if (action === "save") {
            setPresets((current) => ({
              ...current,
              [stateRef.current.band]: current[stateRef.current.band].map((d, i) =>
                i === index ? stateRef.current.dial : d,
              ),
            }));
            sceneRef.current?.flashPreset(index);
          } else {
            cozyAudio.click();
            setDial(currentPresets(stateRef.current.band, index));
          }
        },
      });
    } catch {
      window.setTimeout(() => setSceneFailed(true), 0);
      return;
    }
    sceneRef.current = handle;
    return () => {
      sceneRef.current = null;
      handle.dispose();
    };
    // Presets are read through a helper that closes over the latest state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reads the freshest presets for scene callbacks (which are bound once).
  const presetsRef = useRef(presets);
  useEffect(() => {
    presetsRef.current = presets;
  }, [presets]);
  function currentPresets(forBand: RadioBand, index: number): number {
    return presetsRef.current[forBand][index];
  }

  /* --- push state into the scene --- */
  const synthLock = band === "LIVE" ? 0 : stationLock(dial, band).lock;
  const lock = band === "LIVE" ? (livePlaying ? 1 : liveLoading ? 0.35 : 0) : synthLock;
  useEffect(() => {
    const handle = sceneRef.current;
    if (!handle) return;
    handle.setPower(power);
    handle.setBand(band);
    handle.setDial(dial, band);
    handle.setVolume(volume);
    handle.setLock(power ? lock : 0);
  }, [power, band, dial, volume, lock]);

  /* --- the synthesised bands --- */
  const effectiveVolume = muted ? 0 : volume;
  useEffect(() => {
    if (power && band !== "LIVE") {
      radio.tune(dial, { volume: effectiveVolume, tone, balance: 0, band });
    } else {
      radio.off();
    }
  }, [power, band, dial, effectiveVolume, tone]);

  /* --- the live band --- */
  useEffect(() => {
    if (band === "LIVE" && liveList.length === 0 && !liveLoading) void fetchLive(genre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band]);

  // A live station change (needle moved) retunes the stream.
  useEffect(() => {
    if (band !== "LIVE" || !power || liveList.length === 0) return;
    void playLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIndex]);

  // Power gating for the live stream.
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    if (power && band === "LIVE" && liveList.length > 0) {
      void playLive();
    } else {
      element.pause();
      setLivePlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, band]);

  // Live tone + volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = effectiveVolume;
    const graph = graphRef.current;
    if (graph) {
      graph.bass.gain.value = (tone - 0.5) * 16;
      graph.treble.gain.value = (tone - 0.5) * 14;
    }
  }, [effectiveVolume, tone]);

  // Static while a live stream buffers.
  useEffect(() => {
    if (band === "LIVE" && power && liveLoading) ambience.set("static", volume * 0.02, 0.2);
    else if (band === "LIVE") ambience.set("static", 0, 0.2);
  }, [band, power, liveLoading, volume]);

  // Silence on the way out.
  useEffect(
    () => () => {
      radio.off();
      audioRef.current?.pause();
      ambience.set("static", 0, 0.1);
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    },
    [],
  );

  /* --- the status line --- */
  useEffect(() => {
    if (!power) {
      setStatus("Off. Push the left knob, or press Power below.");
      return;
    }
    if (band === "LIVE") return; // live status is set by the stream handlers
    const { station, lock: stationLockValue } = stationLock(dial, band);
    setStatus(
      stationLockValue > 0.45
        ? `On air: ${station.name} — ${station.genre}`
        : "Between stations — just static.",
    );
  }, [power, band, dial]);

  /* --- derived readout + directory values --- */
  const tuned = band === "LIVE" ? null : stationLock(dial, band);
  const bandStations = stations.filter((s) => s.band === band).sort((a, b) => a.dial - b.dial);
  const freqNumber = band === "AM" ? String(Math.round(dial)) : dial.toFixed(1);
  const freqBand = band === "AM" ? "AM · kHz" : band === "LIVE" ? "LIVE" : "FM · MHz";
  const onAir = power && (band === "LIVE" ? livePlaying : (tuned?.lock ?? 0) > 0.45);
  const lit = !power
    ? 0
    : band === "LIVE"
      ? livePlaying
        ? 5
        : liveLoading
          ? 2
          : 0
      : Math.max(1, Math.round((tuned?.lock ?? 0) * 5));
  const nowName = !power
    ? "The set is off"
    : band === "LIVE"
      ? (liveStation?.name ?? (liveLoading ? "Scanning the dial…" : "No station"))
      : (tuned?.lock ?? 0) > 0.45
        ? (tuned?.station.name ?? "Between stations")
        : "Between stations";
  const nowMeta =
    band === "LIVE" && liveStation
      ? `${liveStation.country} · ${liveStation.bitrate || "?"} kbps`
      : (tuned?.station.genre ?? "");

  function presetLabel(saved: number): string {
    if (band === "AM") return String(Math.round(saved));
    if (band === "FM") return saved.toFixed(1);
    const entry = liveList[saved];
    return entry ? entry.name.slice(0, 12) : `#${saved + 1}`;
  }
  function isPresetTuned(saved: number): boolean {
    if (band === "LIVE") return saved === liveIndex;
    return Math.abs(saved - dial) < (band === "AM" ? 14 : 0.6);
  }

  return (
    <CozyShell
      edition="Ocean Heights · the '56 De Luxe"
      title="Chrome De Luxe 3D"
      note="A 1950s dash radio, rebuilt in 3D. Drag the right knob — or the dial glass itself — to tune, drag the left for volume, push the left knob for power, push the right to change bands. Hold a piano key to save a preset."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage radio-3d-stage">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A chrome 1950s car dash radio with a glowing amber dial"
        />
        {sceneFailed ? (
          <p className="radio-3d-fallback">
            The 3D dash needs WebGL, which this browser will not give it — the controls below still
            run the radio.
          </p>
        ) : null}
      </div>

      {/* The live stream element. Nothing plays until the LIVE band is on. */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        onWaiting={() => setLiveLoading(true)}
        onPlaying={() => setLiveLoading(false)}
        onError={() => {
          setLivePlaying(false);
          setStatus("Signal lost. Turn the dial for the next station.");
        }}
      />

      <p className="cozy-note" aria-live="polite">
        {status}
      </p>

      <div className="radio-3d-deck">
        <div className="radio-3d-console">
          <div className="radio-3d-row">
            <button
              type="button"
              className={power ? "is-on" : ""}
              aria-pressed={power}
              onClick={togglePower}
            >
              {power ? "Power on" : "Power off"}
            </button>
            <button type="button" onClick={cycleBand} aria-label={`Band: ${band}. Press to change`}>
              Band: {band}
            </button>
            <button type="button" onClick={() => seek(-1)} aria-label="Previous station">
              ◀ Seek
            </button>
            <button type="button" onClick={() => seek(1)} aria-label="Next station">
              Seek ▶
            </button>
            <button
              type="button"
              className={scanning ? "is-on" : ""}
              aria-pressed={scanning}
              onClick={() => {
                cozyAudio.click();
                setScanning((on) => !on);
              }}
            >
              {scanning ? "Scanning…" : "Scan"}
            </button>
            <button
              type="button"
              className={muted ? "is-on" : ""}
              aria-pressed={muted}
              onClick={() => {
                cozyAudio.click();
                setMuted((on) => !on);
              }}
            >
              {muted ? "Muted" : "Mute"}
            </button>
          </div>

          <div className="radio-3d-sliders">
            <label className="radio-3d-slider">
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                aria-label="Volume"
                onChange={(event) => setVolume(Number(event.target.value))}
              />
            </label>
            <label className="radio-3d-slider">
              <span>Tone</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={tone}
                aria-label="Tone"
                onChange={(event) => setTone(Number(event.target.value))}
              />
            </label>
          </div>

          <p className="radio-3d-console-label">Presets · tap to recall, hold to save</p>
          <div className="radio-3d-keys" role="group" aria-label="Presets">
            {presets[band].map((saved, index) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: piano keys are positional by nature
                key={index}
                type="button"
                className={isPresetTuned(saved) ? "is-lit" : ""}
                aria-label={`Preset ${index + 1}${
                  band === "AM"
                    ? `, ${Math.round(saved)} kHz`
                    : band === "FM"
                      ? `, ${saved.toFixed(1)} FM`
                      : ""
                }. Hold to save the current station here.`}
                onPointerDown={() => presetDown(index)}
                onPointerUp={() => presetUp(index)}
                onPointerLeave={() => {
                  if (holdTimerRef.current !== null) {
                    window.clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                  }
                }}
              >
                <b>{index + 1}</b>
                <small>{presetLabel(saved)}</small>
              </button>
            ))}
          </div>

          {band === "LIVE" ? (
            <>
              <p className="radio-3d-console-label">Pull in a band of live stations</p>
              <div className="radio-3d-keys" role="group" aria-label="Live station genre">
                {GENRES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`radio-3d-key radio-3d-key-wide${genre === entry.id ? " is-lit" : ""}`}
                    aria-pressed={genre === entry.id}
                    onClick={() => {
                      cozyAudio.click();
                      setGenre(entry.id);
                      setLiveList([]);
                      void fetchLive(entry.id);
                    }}
                  >
                    <b>{entry.label}</b>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="radio-3d-guide">
          <div className="radio-3d-readout-card">
            <p className="radio-3d-freq">
              <b>{freqNumber}</b>
              <span>{freqBand}</span>
              <em className={`radio-3d-onair${onAir ? " is-lit" : ""}`}>ON AIR</em>
            </p>
            <p className="radio-3d-now">
              {nowName}
              {nowMeta ? <small>{nowMeta}</small> : null}
            </p>
            <div
              className="radio-3d-meter"
              role="img"
              aria-label={`Signal strength ${lit} of 5 bars`}
            >
              {[1, 2, 3, 4, 5].map((bar) => (
                <i key={bar} className={bar <= lit ? "is-lit" : ""} />
              ))}
            </div>
          </div>

          <div className="radio-3d-list" role="group" aria-label="Station directory">
            {band === "LIVE"
              ? liveList.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`radio-3d-station${power && index === liveIndex ? " is-tuned" : ""}`}
                    onClick={() => {
                      cozyAudio.click();
                      if (!power) setPower(true);
                      setDial(indexToDial(index, liveList.length));
                      if (!livePlaying) void playLive(entry);
                    }}
                  >
                    <span className="radio-3d-dial">{index + 1}</span>
                    <span className="radio-3d-who">
                      <b>{entry.name}</b>
                      <small>
                        {entry.country} · {entry.codec} · {entry.bitrate || "?"} kbps
                      </small>
                    </span>
                  </button>
                ))
              : bandStations.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`radio-3d-station${
                      power && (tuned?.lock ?? 0) > 0.45 && tuned?.station.id === entry.id
                        ? " is-tuned"
                        : ""
                    }`}
                    onClick={() => {
                      cozyAudio.click();
                      if (!power) setPower(true);
                      setDial(entry.dial);
                    }}
                  >
                    <span className="radio-3d-dial">
                      {entry.band === "AM" ? Math.round(entry.dial) : entry.dial.toFixed(1)}
                    </span>
                    <span className="radio-3d-who">
                      <b>{entry.name}</b>
                      <small>{entry.genre}</small>
                    </span>
                  </button>
                ))}
          </div>

          <p className="radio-3d-guide-note">
            {band === "LIVE"
              ? `${liveList.length || "No"} live station${liveList.length === 1 ? "" : "s"} on this band — pick a card to tune it in.`
              : `${bandStations.length} stations on the ${band} band — pick a card to tune it in.`}
          </p>
        </div>
      </div>

      {band === "LIVE" ? (
        <p className="cozy-note">
          Live stations come from the public Radio Browser directory. The audio is broadcast by
          other people — we do not choose or control what is on.
        </p>
      ) : null}
    </CozyShell>
  );
}
