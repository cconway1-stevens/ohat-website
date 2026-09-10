"use client";

/**
 * The '57 De Luxe — a cherry-red Chevy dash radio, drawn entirely in CSS.
 *
 * One integrated unit: a chrome faceplate with a glowing amber dial and a red
 * needle you can drag, five piano-key presets, and two working knobs (push the
 * left for power, drag it for volume; push the right to change bands, drag it
 * to tune). The station guide slides out of the same dash card below — no
 * separate panels. Two sound sources share the one dial: the synthesised local
 * stations from lib/garage-audio (always there, nothing fetched), and a LIVE
 * band that pulls real streams from the public Radio Browser directory.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  openPrivacySettings,
  serviceAllowed,
  useServiceConsent,
} from "@/components/analytics/privacy-controls";
import {
  ambience,
  BANDS,
  cozyAudio,
  radio,
  stationLock,
  stations,
} from "@/lib/arcade/garage-audio";
import { CozyShell, useAmbience } from "./cozy/cozy-shell";

type RadioBand = "FM" | "AM" | "LIVE";

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
  balance: number;
  band: RadioBand;
  dial: number;
  presets: Presets;
};

function loadSave(): Save {
  const fallback: Save = {
    volume: 0.65,
    tone: 0.6,
    balance: 0.5,
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
      balance: typeof parsed.balance === "number" ? parsed.balance : fallback.balance,
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

/**
 * Directory names arrive with junk bolted on the front — "# RdMix Classic
 * Rock", "- 0 N - Classic Rock on Radio" — because stations pad their names to
 * sort first in other people's lists. Strip the padding and cut on a word
 * boundary, never mid-word.
 */
function cleanName(raw: string): string {
  const stripped = raw
    .replace(/^[\s\-–—_*#•|.>~]+/, "")
    .replace(/[\s\-–—_*#•|~]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const name = stripped || raw.trim();
  if (name.length <= 44) return name;
  const cut = name.slice(0, 44);
  const space = cut.lastIndexOf(" ");
  return `${space > 12 ? cut.slice(0, space) : cut}…`;
}

/** Radio Browser returns full country names; trim the famous mouthfuls. */
function shortCountry(country: string): string {
  const trimmed = country.replace(/^The\s+/i, "");
  const known: Record<string, string> = {
    "United Kingdom Of Great Britain And Northern Ireland": "UK",
    "United States Of America": "USA",
    "United States": "USA",
    "Democratic Republic Of The Congo": "DR Congo",
  };
  if (known[trimmed]) return known[trimmed];
  if (trimmed.length <= 16) return trimmed;
  const cut = trimmed.slice(0, 15);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : 15)}…`;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** A small chrome trim knob: drag vertically, like a real pot. */
function MiniKnob({
  label,
  value,
  onChange,
  ariaLabel,
  inert = false,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
  /** True when this knob cannot reach the current source — say so, visibly. */
  inert?: boolean;
}) {
  const drag = useRef<{ y: number; start: number } | null>(null);
  return (
    <button
      type="button"
      className={`chevy-subknob${inert ? " is-inert" : ""}`}
      title={inert ? "This station plays direct — tone and balance cannot reach it." : undefined}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      // A knob you can only drag is a knob half the visitors cannot turn.
      onKeyDown={(event) => {
        const step = event.shiftKey ? 0.2 : 0.05;
        if (event.key === "ArrowUp" || event.key === "ArrowRight") {
          event.preventDefault();
          onChange(clamp(value + step, 0, 1));
        } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
          event.preventDefault();
          onChange(clamp(value - step, 0, 1));
        } else if (event.key === "Home") {
          event.preventDefault();
          onChange(0);
        } else if (event.key === "End") {
          event.preventDefault();
          onChange(1);
        }
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { y: event.clientY, start: value };
      }}
      onPointerMove={(event) => {
        const state = drag.current;
        if (!state) return;
        onChange(clamp(state.start - (event.clientY - state.y) * 0.006, 0, 1));
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.current = null;
      }}
    >
      <span
        className="chevy-subknob-cap"
        style={{ transform: `rotate(${-135 + value * 270}deg)` }}
      />
      <small>{label}</small>
    </button>
  );
}

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

/** The dial value of the station nearest to `target` on a band. */
function nearestStationDial(band: "FM" | "AM", target: number): number {
  const dials = stations
    .filter((entry) => entry.band === band)
    .map((entry) => entry.dial)
    .sort((a, b) => a - b);
  if (dials.length === 0) return BANDS[band].min;
  return dials.reduce(
    (best, candidate) =>
      Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best,
    dials[0],
  );
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
  // True while the current live stream is playing through the ungraphed
  // element, which means the tone and balance knobs cannot reach it.
  const [direct, setDirect] = useState(false);
  const [genre, setGenre] = useState<(typeof GENRES)[number]["id"]>("oldies");
  const [status, setStatus] = useState("Off. Push the left knob, or press Power below.");
  const [scanning, setScanning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [balance, setBalance] = useState(save.balance);
  const [dim, setDim] = useState(0.7);
  const [night, setNight] = useState(false);
  const [warmed, setWarmed] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const radioAllowed = useServiceConsent("radioBrowser");

  const dashRef = useRef<HTMLDivElement>(null);
  // Two elements, one dial. The first is wired into the Web Audio graph, which
  // is what makes the tone and balance knobs bite — but a graph can only read a
  // stream whose server sends CORS headers, and most Icecast servers send none,
  // so those streams are blocked outright rather than played flat. The second
  // element is never wired, so it plays anything; stations that fail the first
  // are remembered and go straight to it.
  const audioRef = useRef<HTMLAudioElement>(null);
  const plainRef = useRef<HTMLAudioElement>(null);
  const directRef = useRef<Set<string>>(new Set());
  // A CORS refusal arrives twice — once as a rejected play(), once as an error
  // event — and each wants to retry. Only the newest attempt may touch the
  // status line, or the successful retry gets narrated as a failure.
  const tuneSeqRef = useRef(0);
  const graphRef = useRef<{
    bass: BiquadFilterNode;
    treble: BiquadFilterNode;
    panner: StereoPannerNode | null;
  } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const warmTimerRef = useRef<number | null>(null);

  // A real car radio remembers where each band was left tuned. This is what
  // stops the needle from hopping when the band changes: every band restores
  // its own last dial position instead of inheriting the previous band's.
  const dialMemoryRef = useRef<Record<RadioBand, number>>({
    FM: nearestStationDial("FM", save.band === "LIVE" ? BANDS.FM.min : save.dial),
    AM: nearestStationDial("AM", 1010),
    LIVE: save.band === "LIVE" ? save.dial : indexToDial(0, 12),
  });

  // The render loop and the audio graph read the freshest state through refs.
  const stateRef = useRef({ power, band, dial, volume, tone, liveList, livePlaying, muted });
  useEffect(() => {
    stateRef.current = { power, band, dial, volume, tone, liveList, livePlaying, muted };
  });

  // Keep the per-band memory fresh as the dial moves.
  useEffect(() => {
    dialMemoryRef.current[band] = dial;
  }, [band, dial]);

  useAmbience(sound, { fluorescent: 0.012, shopHum: 0.012 });

  /* --- persistence --- */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ volume, tone, balance, band, dial, presets } satisfies Save),
      );
    } catch {
      /* storage blocked — the radio just won't remember */
    }
  }, [volume, tone, balance, band, dial, presets]);

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
      // The balance knob pans the stream where the panner is supported.
      const panner =
        typeof audio.createStereoPanner === "function" ? audio.createStereoPanner() : null;
      if (panner) {
        source.connect(bass).connect(treble).connect(panner).connect(audio.destination);
      } else {
        source.connect(bass).connect(treble).connect(audio.destination);
      }
      graphRef.current = { bass, treble, panner };
    } catch {
      // Without the graph the stream still plays; the tone knob just does nothing.
    }
  }, []);

  const playLive = useCallback(
    async (entry?: LiveStation) => {
      const graph = audioRef.current;
      const plain = plainRef.current;
      const target = entry ?? liveStation;
      if (!graph || !plain || !target || !serviceAllowed("radioBrowser")) return;
      const seq = ++tuneSeqRef.current;
      const stale = () => tuneSeqRef.current !== seq || !serviceAllowed("radioBrowser");
      graph.pause();
      plain.pause();
      setLiveLoading(true);
      setStatus(`Tuning in ${target.name}…`);

      const start = async (element: HTMLAudioElement) => {
        if (stale()) return;
        element.src = target.url;
        element.volume = stateRef.current.muted ? 0 : stateRef.current.volume;
        await element.play();
      };
      const onAirNow = (viaGraph: boolean) => {
        setDirect(!viaGraph);
        setLivePlaying(true);
        setLiveLoading(false);
        setStatus(`On air: ${target.name} — ${target.country}`);
      };

      // The graph first, for tone and balance. If the station's server blocks
      // it, remember that and drop to the plain element rather than telling the
      // listener the stream is broken — it plays fine, just without the EQ.
      if (!directRef.current.has(target.id)) {
        wireLiveGraph();
        try {
          await start(graph);
          if (stale()) return;
          onAirNow(true);
          return;
        } catch {
          if (stale()) return;
          directRef.current.add(target.id);
          graph.pause();
        }
      }
      try {
        await start(plain);
        if (stale()) return;
        onAirNow(false);
      } catch {
        if (stale()) return;
        setLivePlaying(false);
        setLiveLoading(false);
        setStatus("That stream would not start here. Turn the dial for the next one.");
      }
    },
    [liveStation, wireLiveGraph],
  );

  const fetchLive = useCallback(
    async (genreId: (typeof GENRES)[number]["id"]) => {
      if (!radioAllowed || !serviceAllowed("radioBrowser")) {
        setStatus("Turn on arcade internet radio in your privacy settings to reach the LIVE band.");
        openPrivacySettings();
        return;
      }
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
        if (!serviceAllowed("radioBrowser")) return;
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
              name: cleanName(row.name),
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
    [playLive, radioAllowed],
  );

  // Withdrawing consent mid-song has to actually stop the stream, otherwise the
  // station host keeps seeing this listener after they said no.
  useEffect(() => {
    if (radioAllowed) return;
    tuneSeqRef.current += 1;
    for (const element of [audioRef.current, plainRef.current]) {
      element?.pause();
      element?.removeAttribute("src");
      element?.load();
    }
    setLiveLoading(false);
    setLivePlaying(false);
    setLiveList([]);
  }, [radioAllowed]);

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
    setPower((on) => {
      const next = !on;
      if (next) {
        // Tube warm-up: the dial stays dark and silent for a moment.
        setWarmed(false);
        setStatus("Warming the valves…");
        if (warmTimerRef.current !== null) window.clearTimeout(warmTimerRef.current);
        warmTimerRef.current = window.setTimeout(() => setWarmed(true), 1100);
      } else {
        setWarmed(false);
      }
      return next;
    });
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
    setBand((current) => {
      const next = current === "FM" ? "AM" : current === "AM" ? "LIVE" : "FM";
      // Restore this band's own last position — the needle never hops.
      setDial(dialMemoryRef.current[next]);
      return next;
    });
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
    setStatus(`Preset ${index + 1} set.`);
  }

  // Hold-to-save on the preset keys.
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

  /* --- the synthesised bands --- */
  const effectiveVolume = muted ? 0 : volume;
  useEffect(() => {
    if (power && warmed && band !== "LIVE") {
      radio.tune(dial, {
        volume: effectiveVolume,
        tone,
        balance: balance * 2 - 1,
        band,
      });
    } else {
      radio.off();
    }
  }, [power, warmed, band, dial, effectiveVolume, tone, balance]);

  /* --- the live band --- */
  useEffect(() => {
    if (band === "LIVE" && liveList.length === 0 && !liveLoading) void fetchLive(genre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band]);

  // A live station change (needle moved) retunes the stream.
  useEffect(() => {
    if (band !== "LIVE" || !power || !warmed || liveList.length === 0) return;
    void playLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIndex]);

  // Power gating for the live stream.
  useEffect(() => {
    if (power && warmed && band === "LIVE" && liveList.length > 0) {
      void playLive();
    } else {
      audioRef.current?.pause();
      plainRef.current?.pause();
      setLivePlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [power, warmed, band]);

  // Live tone, balance + volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = effectiveVolume;
    if (plainRef.current) plainRef.current.volume = effectiveVolume;
    const graph = graphRef.current;
    if (graph) {
      graph.bass.gain.value = (tone - 0.5) * 16;
      graph.treble.gain.value = (tone - 0.5) * 14;
      if (graph.panner) graph.panner.pan.value = balance * 2 - 1;
    }
  }, [effectiveVolume, tone, balance]);

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
      plainRef.current?.pause();
      ambience.set("static", 0, 0.1);
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      if (warmTimerRef.current !== null) window.clearTimeout(warmTimerRef.current);
    },
    [],
  );

  /* --- the status line --- */
  useEffect(() => {
    if (!power) {
      setStatus("Off. Push the left knob, or press Power below.");
      return;
    }
    if (!warmed) return; // keep the warm-up message on the line
    if (band === "LIVE") return; // live status is set by the stream handlers
    const { station, lock: stationLockValue } = stationLock(dial, band);
    setStatus(
      stationLockValue > 0.45
        ? `On air: ${station.name} — ${station.genre}`
        : "Between stations — just static.",
    );
  }, [power, warmed, band, dial]);

  /* --- derived readout + directory values --- */
  const tuned = band === "LIVE" ? null : stationLock(dial, band);
  const bandStations = stations.filter((s) => s.band === band).sort((a, b) => a.dial - b.dial);
  const freqNumber = band === "AM" ? String(Math.round(dial)) : dial.toFixed(1);
  const freqBand = band === "AM" ? "AM · kHz" : band === "LIVE" ? "LIVE" : "FM · MHz";
  // Nothing on the face may claim a station before the valves are warm: the set
  // is silent for that second, and a lit ON AIR lamp over five signal bars with
  // no sound coming out is the readout lying about what the radio is doing.
  const live = power && warmed;
  // A stream on the fallback element bypasses the filter graph entirely.
  const eqInert = band === "LIVE" && livePlaying && direct;
  const onAir = live && (band === "LIVE" ? livePlaying : (tuned?.lock ?? 0) > 0.45);
  const lit = !live
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
    : !warmed
      ? "Warming up…"
      : band === "LIVE"
        ? (liveStation?.name ?? (liveLoading ? "Scanning the dial…" : "No station"))
        : (tuned?.lock ?? 0) > 0.45
          ? (tuned?.station.name ?? "Between stations")
          : "Between stations";
  const nowMeta = !live
    ? ""
    : band === "LIVE"
      ? liveStation
        ? `${shortCountry(liveStation.country)} · ${liveStation.bitrate || "?"} kbps`
        : ""
      : (tuned?.lock ?? 0) > 0.45
        ? (tuned?.station.genre ?? "")
        : "";

  function presetLabel(saved: number): string {
    if (band === "AM") return String(Math.round(saved));
    if (band === "FM") return saved.toFixed(1);
    // A live preset holds a slot in a list that may not have arrived yet. An
    // empty slot says so; "#4" reads like a station and is not one.
    return liveList[saved]?.name ?? "—";
  }
  function isPresetTuned(saved: number): boolean {
    if (band === "LIVE") return saved === liveIndex;
    return Math.abs(saved - dial) < (band === "AM" ? 14 : 0.6);
  }

  /* --- the dial and the knobs are the controls: drag them --- */
  const dialTrackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: "dial" | "volume" | "tune";
    startX: number;
    startY: number;
    startValue: number;
    moved: number;
  } | null>(null);

  const bandRange = band === "AM" ? BANDS.AM : BANDS.FM;
  // Needle / tune-knob position as a 0..1 sweep across the current band.
  const dialT = clamp((dial - bandRange.min) / (bandRange.max - bandRange.min), 0, 1);

  // Mechanical detents: a tiny click every half-megahertz (or 10 kHz on AM).
  const lastDetentRef = useRef(0);
  function tuneTo(value: number) {
    const step = band === "AM" ? 10 : 0.5;
    const now = performance.now();
    if (
      Math.floor(value / step) !== Math.floor(stateRef.current.dial / step) &&
      now - lastDetentRef.current > 70
    ) {
      cozyAudio.click();
      lastDetentRef.current = now;
    }
    setDial(value);
  }

  function tuneFromClientX(clientX: number) {
    const track = dialTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    tuneTo(bandRange.min + t * (bandRange.max - bandRange.min));
  }

  function onFacePointerDown(kind: "dial" | "volume" | "tune") {
    return (event: React.PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        kind,
        startX: event.clientX,
        startY: event.clientY,
        startValue: kind === "volume" ? volume : dial,
        moved: 0,
      };
      if (kind === "dial") tuneFromClientX(event.clientX);
    };
  }
  function onFacePointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.kind === "dial") {
      tuneFromClientX(event.clientX);
    } else if (drag.kind === "volume") {
      setVolume(clamp(drag.startValue - dy * 0.005, 0, 1));
    } else {
      const span = bandRange.max - bandRange.min;
      const track = dialTrackRef.current;
      const width = track?.getBoundingClientRect().width ?? 300;
      tuneTo(clamp(drag.startValue + (dx / width) * span, bandRange.min, bandRange.max));
    }
  }
  function onFacePointerUp(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // A tap (not a drag) on a knob is the classic push-button.
    if (drag.moved < 6) {
      if (drag.kind === "volume") togglePower();
      else if (drag.kind === "tune") cycleBand();
    }
  }
  const faceDragHandlers = {
    onPointerMove: onFacePointerMove,
    onPointerUp: onFacePointerUp,
  };
  // Knob rotation: a 270° sweep, like a real pot.
  const volumeAngle = -135 + volume * 270;
  const tuneAngle = -135 + dialT * 270;

  /**
   * What the dial glass actually says. A real set prints the frequencies along
   * the scale and marks where the stations sit — without them the needle is a
   * slider with no units, and you cannot see where you are heading before you
   * get there.
   */
  const dialScale = useMemo(() => {
    const span = bandRange.max - bandRange.min;
    const at = (value: number) => ((value - bandRange.min) / span) * 100;
    if (band === "LIVE") {
      return {
        numbers: [] as { key: string; label: string; at: number }[],
        marks: liveList.map((entry, index) => ({
          key: entry.id,
          at: at(indexToDial(index, liveList.length)),
        })),
      };
    }
    const numbers = (
      band === "AM" ? [600, 800, 1000, 1200, 1400, 1600] : [88, 92, 96, 100, 104, 108]
    )
      .filter((value) => value >= bandRange.min && value <= bandRange.max)
      .map((value) => ({ key: String(value), label: String(value), at: at(value) }));
    const marks = stations
      .filter((entry) => entry.band === band)
      .map((entry) => ({ key: entry.id, at: at(entry.dial) }));
    return { numbers, marks };
  }, [band, bandRange.min, bandRange.max, liveList]);

  /**
   * The dial is the primary control, so it has to work from the keyboard as
   * well as the hand: arrows nudge it, page keys jump station to station, home
   * and end run it to the ends of the band.
   */
  function onDialKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const fine = band === "AM" ? BANDS.AM.step : BANDS.FM.step;
    const coarse = fine * 10;
    const span = bandRange.max - bandRange.min;
    const nudge = (delta: number) => {
      event.preventDefault();
      tuneTo(clamp(dial + delta, bandRange.min, bandRange.max));
    };
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        return nudge(event.shiftKey ? coarse : fine);
      case "ArrowLeft":
      case "ArrowDown":
        return nudge(event.shiftKey ? -coarse : -fine);
      case "PageUp":
        event.preventDefault();
        return seek(1);
      case "PageDown":
        event.preventDefault();
        return seek(-1);
      case "Home":
        event.preventDefault();
        return tuneTo(bandRange.min);
      case "End":
        event.preventDefault();
        return tuneTo(bandRange.max);
      default:
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          togglePower();
        }
        // A percentage jump, the way a real slider answers a number key.
        if (/^[0-9]$/.test(event.key)) {
          event.preventDefault();
          tuneTo(bandRange.min + (Number(event.key) / 9) * span);
        }
    }
  }

  /* --- fullscreen: native API where it exists, CSS pinning where not --- */
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setIsFs(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  function toggleFullscreen() {
    cozyAudio.click();
    const element = dashRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (typeof element.requestFullscreen === "function") {
      element
        .requestFullscreen()
        .then(() => setIsFs(true))
        .catch(() => setIsFs(true));
    } else {
      // iPhone Safari cannot fullscreen an element — pin it with CSS instead.
      setIsFs(true);
    }
  }

  return (
    <CozyShell
      edition="Ocean Heights · the '57 De Luxe"
      title="Chrome De Luxe"
      note="A cherry-red '57 Chevy pushbutton radio. Drag the dial or the tuning knob, push PWR, change bands, and hold a piano key to save a preset. Trim knobs set tone, balance and dial brightness; NGT dims the dash for night driving; FULL takes over the screen. Local stations plus a live band of real streams."
      soundOn={sound}
      onSoundChange={setSound}
    >
      {/* The live stream elements. Nothing plays until the LIVE band is on. */}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        onWaiting={() => setLiveLoading(true)}
        onPlaying={() => setLiveLoading(false)}
        onError={() => {
          // A CORS refusal surfaces here rather than as a rejected play(), so
          // this is the other door into the plain-element fallback.
          const target = liveStation;
          if (target && band === "LIVE" && !directRef.current.has(target.id)) {
            directRef.current.add(target.id);
            void playLive(target);
            return;
          }
          setLivePlaying(false);
          setStatus("Signal lost. Turn the dial for the next station.");
        }}
      />
      <audio
        ref={plainRef}
        preload="none"
        onWaiting={() => setLiveLoading(true)}
        onPlaying={() => setLiveLoading(false)}
        onError={() => {
          setLivePlaying(false);
          setStatus("Signal lost. Turn the dial for the next station.");
        }}
      />

      {/* One integrated dash: the radio face and the guide in a single red card. */}
      <div
        ref={dashRef}
        className={`chevy-dash${power ? " is-on" : ""}${night ? " is-night" : ""}${isFs ? " is-fs" : ""}`}
        style={{ "--chevy-dim": 0.35 + dim * 0.65 } as React.CSSProperties}
      >
        {/* the radio itself */}
        <div className="chevy-radio">
          <div
            ref={dialTrackRef}
            className="chevy-dial"
            role="slider"
            tabIndex={0}
            aria-label={`Tuning dial, ${band} band`}
            aria-valuemin={bandRange.min}
            aria-valuemax={bandRange.max}
            aria-valuenow={Math.round(dial * 10) / 10}
            aria-valuetext={
              band === "LIVE"
                ? `Station ${liveIndex + 1} of ${liveList.length || 0}`
                : `${freqNumber} ${band === "AM" ? "kilohertz" : "megahertz"}`
            }
            onKeyDown={onDialKeyDown}
            onPointerDown={onFacePointerDown("dial")}
            {...faceDragHandlers}
          >
            <div className="chevy-dial-scale">
              <span className="chevy-dial-band">{band === "LIVE" ? "LIVE" : band}</span>
              <span className="chevy-dial-brand">Ocean Heights</span>
              <span className={`chevy-dial-lamp${onAir ? " is-lit" : ""}`} />
            </div>
            <div className="chevy-dial-ticks" aria-hidden="true">
              {dialScale.numbers.map((entry) => (
                <span
                  key={entry.key}
                  className="chevy-dial-number"
                  // Held off both ends so the first and last readings do not
                  // run under the band label or the tuned lamp.
                  style={{ left: `clamp(1.4rem, ${entry.at}%, calc(100% - 1.4rem))` }}
                >
                  {entry.label}
                </span>
              ))}
              {dialScale.marks.map((entry) => (
                <i key={entry.key} className="chevy-dial-mark" style={{ left: `${entry.at}%` }} />
              ))}
            </div>
            <span className="chevy-needle" style={{ left: `${dialT * 100}%` }} aria-hidden="true" />
          </div>

          <p className="chevy-badge" aria-hidden="true">
            De Luxe <span>pushbutton radio</span>
          </p>

          <p className="chevy-legend">Push button · hold to set</p>
          <div className="chevy-keys" role="group" aria-label="Presets">
            {presets[band].map((saved, index) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: piano keys are positional by nature
                key={index}
                type="button"
                className={`chevy-key${isPresetTuned(saved) ? " is-lit" : ""}`}
                aria-label={`Preset ${index + 1}. Hold to save the current station here.`}
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

          <div className="chevy-knob-row">
            <button
              type="button"
              className="chevy-knob chevy-knob--vol"
              role="slider"
              aria-label="Volume knob. Drag to adjust, push for power."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 0.2 : 0.05;
                if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                  event.preventDefault();
                  setVolume((v) => clamp(v + step, 0, 1));
                } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  setVolume((v) => clamp(v - step, 0, 1));
                } else if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  togglePower();
                }
              }}
              onPointerDown={onFacePointerDown("volume")}
              {...faceDragHandlers}
            >
              <span className="chevy-knob-cap" style={{ transform: `rotate(${volumeAngle}deg)` }} />
              <small>VOL</small>
            </button>

            <div className="chevy-mini">
              <button
                type="button"
                className={power ? "is-on" : ""}
                aria-pressed={power}
                onClick={togglePower}
              >
                {power ? "ON" : "PWR"}
              </button>
              <button type="button" onClick={cycleBand} aria-label={`Band: ${band}`}>
                {band}
              </button>
              <button type="button" onClick={() => seek(-1)} aria-label="Previous station">
                ◀
              </button>
              <button type="button" onClick={() => seek(1)} aria-label="Next station">
                ▶
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
                SCN
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
                MUT
              </button>
              <button
                type="button"
                className={night ? "is-on" : ""}
                aria-pressed={night}
                onClick={() => {
                  cozyAudio.click();
                  setNight((on) => !on);
                }}
              >
                NGT
              </button>
              <button
                type="button"
                className={isFs ? "is-on" : ""}
                aria-pressed={isFs}
                onClick={toggleFullscreen}
              >
                {isFs ? "EXIT" : "FULL"}
              </button>
            </div>

            <button
              type="button"
              className="chevy-knob chevy-knob--tune"
              role="slider"
              aria-label="Tuning knob. Drag to tune, push to change band."
              aria-valuemin={bandRange.min}
              aria-valuemax={bandRange.max}
              aria-valuenow={Math.round(dial * 10) / 10}
              onKeyDown={(event) => {
                const fine = band === "AM" ? BANDS.AM.step : BANDS.FM.step;
                const step = event.shiftKey ? fine * 10 : fine;
                if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                  event.preventDefault();
                  tuneTo(clamp(dial + step, bandRange.min, bandRange.max));
                } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  tuneTo(clamp(dial - step, bandRange.min, bandRange.max));
                } else if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  cycleBand();
                }
              }}
              onPointerDown={onFacePointerDown("tune")}
              {...faceDragHandlers}
            >
              <span className="chevy-knob-cap" style={{ transform: `rotate(${tuneAngle}deg)` }} />
              <small>TUNE</small>
            </button>
          </div>

          <div className="chevy-subknobs">
            <MiniKnob
              label="Tone"
              value={tone}
              ariaLabel="Tone. Drag or use the arrow keys."
              onChange={setTone}
              inert={eqInert}
            />
            <MiniKnob
              label="Bal"
              value={balance}
              ariaLabel="Balance. Drag or use the arrow keys to pan left or right."
              onChange={setBalance}
              inert={eqInert}
            />
            <MiniKnob
              label="Dim"
              value={dim}
              ariaLabel="Dial lamp dimmer. Drag or use the arrow keys."
              onChange={setDim}
            />
          </div>
        </div>

        {/* The screen sits under the radio it belongs to, spanning that half of
            the dash — not over the station guide, which is its own column. */}
        <div className="chevy-readout">
          <p className="chevy-freq">
            <b>{freqNumber}</b>
            <span>{freqBand}</span>
            <em className={`chevy-onair${onAir ? " is-lit" : ""}`}>ON AIR</em>
          </p>
          <p className="chevy-now">
            <b className="chevy-now-name">{nowName}</b>
            {nowMeta ? <small>{nowMeta}</small> : null}
          </p>
          <div className="chevy-meter" role="img" aria-label={`Signal strength ${lit} of 5 bars`}>
            {[1, 2, 3, 4, 5].map((bar) => (
              <i key={bar} className={bar <= lit ? "is-lit" : ""} />
            ))}
          </div>
        </div>

        {/* the station guide, alongside the radio */}
        <div className="chevy-guide">
          {band === "LIVE" ? (
            <div className="chevy-genres" role="group" aria-label="Live station genre">
              {GENRES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={genre === entry.id ? "is-lit" : ""}
                  aria-pressed={genre === entry.id}
                  onClick={() => {
                    cozyAudio.click();
                    setGenre(entry.id);
                    setLiveList([]);
                    void fetchLive(entry.id);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="chevy-list" role="group" aria-label="Station directory">
            {/* The directory is someone else's server and can take seconds.
                Holding the shape of the list is calmer than an empty card. */}
            {band === "LIVE" && liveList.length === 0 && liveLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholder rows
                  <p key={index} className="chevy-station is-waiting" aria-hidden="true">
                    <span className="chevy-station-dial">{index + 1}</span>
                    <span className="chevy-station-who">
                      <b />
                      <small />
                    </span>
                  </p>
                ))
              : null}
            {band === "LIVE"
              ? liveList.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`chevy-station${power && index === liveIndex ? " is-tuned" : ""}`}
                    onClick={() => {
                      cozyAudio.click();
                      if (!power) setPower(true);
                      setDial(indexToDial(index, liveList.length));
                      if (!livePlaying) void playLive(entry);
                    }}
                  >
                    <span className="chevy-station-dial">{index + 1}</span>
                    <span className="chevy-station-who">
                      <b>{entry.name}</b>
                      <small>
                        {shortCountry(entry.country)} · {entry.codec} · {entry.bitrate || "?"} kbps
                      </small>
                    </span>
                  </button>
                ))
              : bandStations.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`chevy-station${
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
                    <span className="chevy-station-dial">
                      {entry.band === "AM" ? Math.round(entry.dial) : entry.dial.toFixed(1)}
                    </span>
                    <span className="chevy-station-who">
                      <b>{entry.name}</b>
                      <small>{entry.genre}</small>
                    </span>
                  </button>
                ))}
          </div>

          <p className="chevy-guide-note">
            {band === "LIVE"
              ? `${liveList.length || "No"} live station${liveList.length === 1 ? "" : "s"} on this band — pick one to tune it in.`
              : `${bandStations.length} stations on the ${band} band — pick one to tune it in.`}
          </p>
        </div>
      </div>

      <p className="cozy-note" aria-live="polite">
        {status}
      </p>

      {band === "LIVE" ? (
        <p className="cozy-note">
          Live stations come from the public Radio Browser directory. The audio is broadcast by
          other people — we do not choose or control what is on.
        </p>
      ) : null}
    </CozyShell>
  );
}
