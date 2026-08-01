"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";

/**
 * A 1950s tabletop set in brushed silver — and unlike the dash unit beside it,
 * this one plays real stations.
 *
 * Streams come from the Radio Browser directory, a free public index of
 * internet radio. Two things worth knowing: the audio is other people's, so
 * what comes out is not ours to control, and the directory is somebody else's
 * server, so it can be slow or down. Everything degrades to a plain message
 * rather than a broken panel.
 *
 * The tone stack is real: bass, mid and treble are biquad filters on the
 * stream itself, so the knobs actually change what you hear.
 */

const DIRECTORY = "https://de1.api.radio-browser.info/json/stations/search";

type Genre = { id: string; label: string; tag: string };
const GENRES: Genre[] = [
  { id: "pop", label: "Top 40", tag: "top40" },
  { id: "oldies", label: "Oldies", tag: "oldies" },
  { id: "rock", label: "Classic rock", tag: "classic rock" },
  { id: "country", label: "Country", tag: "country" },
  { id: "jazz", label: "Jazz", tag: "jazz" },
  { id: "news", label: "News talk", tag: "news" },
];

type Station = { id: string; name: string; url: string; country: string; bitrate: number; codec: string; favicon: string };

const DECADES = [
  { id: "fifties", label: "'50s", sub: "Doo-wop", tag: "50s" },
  { id: "sixties", label: "'60s", sub: "Motown", tag: "60s" },
  { id: "seventies", label: "'70s", sub: "Classic rock", tag: "70s" },
  { id: "eighties", label: "'80s", sub: "New wave", tag: "80s" },
  { id: "nineties", label: "'90s", sub: "Alt radio", tag: "90s" },
  { id: "modern", label: "2000+", sub: "Modern hits", tag: "2000s" },
] as const;
type Decade = (typeof DECADES)[number]["id"];

export function LiveRadio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<{ bass: BiquadFilterNode; mid: BiquadFilterNode; treble: BiquadFilterNode } | null>(null);

  const [genre, setGenre] = useState<Genre>(GENRES[0]);
  const [list, setList] = useState<Station[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("Press a band button to pull in some stations.");
  const [volume, setVolume] = useState(0.7);
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);
  const [dragging, setDragging] = useState<"volume" | null>(null);
  const [decade, setDecade] = useState<Decade>("fifties");
  const [signal, setSignal] = useState(0);

  const station = list[index];

  // Build the tone stack once, on the first real interaction.
  const wireGraph = useCallback(() => {
    const element = audioRef.current;
    if (!element || graphRef.current) return;
    try {
      const audio = new AudioContext();
      const source = audio.createMediaElementSource(element);
      const make = (type: BiquadFilterType, hz: number) => {
        const node = audio.createBiquadFilter();
        node.type = type;
        node.frequency.value = hz;
        return node;
      };
      const b = make("lowshelf", 220);
      const m = make("peaking", 1200);
      const t = make("highshelf", 4200);
      source.connect(b).connect(m).connect(t).connect(audio.destination);
      graphRef.current = { bass: b, mid: m, treble: t };
    } catch {
      // Without the graph the audio still plays; the knobs just do nothing.
    }
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.bass.gain.value = bass * 12;
    graph.mid.gain.value = mid * 10;
    graph.treble.gain.value = treble * 12;
  }, [bass, mid, treble]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Stop the stream on the way out — nothing should keep playing off-screen.
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: PointerEvent) =>
      setVolume((value) => Math.min(1, Math.max(0, value - event.movementY * 0.012)));
    const stop = () => setDragging(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  async function loadStations(label: string, tag: string, nextGenre?: Genre, nextDecade?: Decade) {
    cozyAudio.click();
    if (nextGenre) setGenre(nextGenre);
    if (nextDecade) setDecade(nextDecade);
    pause(false);
    setSignal(1);
    setStatus(`Scanning the dial for ${label.toLowerCase()}…`);
    setList([]);
    try {
      const params = new URLSearchParams({
        tag, hidebroken: "true", order: "clickcount",
        reverse: "true", limit: "24",
      });
      const response = await fetch(`${DIRECTORY}?${params}`);
      if (!response.ok) throw new Error("directory said no");
      const data = await response.json();
      const usable: Station[] = data
        .filter((entry: { name?: string; url_resolved?: string }) => entry.name && entry.url_resolved)
        // Only https, so the browser will not block it as mixed content.
        .filter((entry: { url_resolved: string }) => entry.url_resolved.startsWith("https://"))
        .filter((entry: { codec?: string }) => !entry.codec || /mp3|aac/i.test(entry.codec))
        .slice(0, 12)
        .map((entry: { stationuuid: string; name: string; url_resolved: string; country: string; bitrate: number; codec?: string; favicon?: string }) => ({
          id: entry.stationuuid,
          name: entry.name.trim().slice(0, 42),
          url: entry.url_resolved,
          country: entry.country || "—",
          bitrate: entry.bitrate || 0,
          codec: entry.codec || "stream",
          favicon: entry.favicon?.startsWith("https://") ? entry.favicon : "",
        }));
      setList(usable);
      setIndex(0);
      setStatus(usable.length
        ? `${usable.length} stations found. Press play or turn the tuning knob.`
        : "Nothing came back for that band. Try another.");
      setSignal(usable.length ? 3 : 0);
    } catch {
      setStatus("The station directory is not answering. It is someone else's server — try again in a minute, or use the dash radio.");
    }
  }

  function loadGenre(next: Genre) {
    void loadStations(next.label, next.tag, next);
  }

  function loadDecade(next: (typeof DECADES)[number]) {
    void loadStations(`${next.label} ${next.sub}`, next.tag, undefined, next.id);
  }

  async function play(entry = station) {
    if (!entry || !audioRef.current) return;
    wireGraph();
    const element = audioRef.current;
    element.src = entry.url;
    element.volume = volume;
    setStatus(`Tuning in ${entry.name}…`);
    try {
      await element.play();
      setPlaying(true);
      setSignal(Math.max(2, Math.min(5, Math.round((entry.bitrate || 96) / 48))));
      setStatus(`On air: ${entry.name}`);
    } catch {
      setPlaying(false);
      setSignal(0);
      setStatus("That stream would not start here. Press SEEK for the next one.");
    }
  }

  function pause(withMessage = true) {
    audioRef.current?.pause();
    setPlaying(false);
    if (withMessage) setStatus(station ? `Paused — ${station.name}` : "Paused.");
  }

  function seek(step: number) {
    if (list.length === 0) return;
    cozyAudio.click();
    const next = (index + step + list.length) % list.length;
    setIndex(next);
    if (playing) void play(list[next]);
    else setStatus(`Ready: ${list[next].name}`);
  }

  return (
    <div className={`silver-radio is-${decade}${playing ? " is-on" : ""}`}>
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
        onWaiting={() => { setSignal(1); setStatus("Signal fading… buffering the station."); }}
        onPlaying={() => setSignal((value) => Math.max(value, 3))}
        onError={() => { setPlaying(false); setSignal(0); setStatus("Signal lost. Press SEEK for the next station."); }}
      />

      <div className="silver-decades" role="group" aria-label="Dashboard era">
        {DECADES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={decade === entry.id ? "is-on" : ""}
            aria-pressed={decade === entry.id}
            onClick={() => loadDecade(entry)}
          >
            <b>{entry.label}</b>
            <small>{entry.sub}</small>
          </button>
        ))}
      </div>

      <div className="silver-top">
        <div className="silver-grille" aria-hidden="true" />
        <div className="silver-dial">
          <p className="silver-brand">OHAT <small>DE LUXE</small></p>
          <div className="silver-window">
            <div className="silver-station-line">
              {station?.favicon ? (
                // Station favicons come from arbitrary radio directory hosts.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={station.favicon} alt="" />
              ) : (
                <span aria-hidden="true">OH</span>
              )}
              <p className="silver-station">{station ? station.name : "— — —"}</p>
            </div>
            <p className="silver-meta">
              {station ? `${station.country} · ${station.codec} · ${station.bitrate || "?"} kbps` : "no station"}
              <em className={playing ? "is-lit" : ""}>ON AIR</em>
            </p>
            <div className="silver-signal" aria-label={`Signal strength ${signal} of 5`}>
              {[1, 2, 3, 4, 5].map((bar) => <i key={bar} className={bar <= signal ? "is-lit" : ""} />)}
            </div>
          </div>
          <p className="silver-status" aria-live="polite">{status}</p>
        </div>
        <div className="silver-knob-col">
          <button
            type="button"
            className="silver-knob"
            style={{ "--turn": `${volume * 270 - 135}deg` } as React.CSSProperties}
            aria-label={`Volume ${Math.round(volume * 100)} percent`}
            onPointerDown={() => setDragging("volume")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") setVolume((v) => Math.min(1, v + 0.08));
              if (e.key === "ArrowDown") setVolume((v) => Math.max(0, v - 0.08));
            }}
          >
            <i aria-hidden="true" />
          </button>
          <small>Volume</small>
        </div>
      </div>

      <div className="silver-tuner" aria-hidden="true">
        <span>88</span><i /><span>92</span><i /><span>96</span><i /><span>100</span><i /><span>104</span><i /><span>108</span>
        <b style={{ left: list.length ? `${8 + (index / Math.max(1, list.length - 1)) * 84}%` : "8%" }} />
      </div>

      <div className="silver-bands" role="group" aria-label="Band">
        {GENRES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={genre.id === entry.id ? "is-down" : ""}
            onClick={() => void loadGenre(entry)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="silver-transport">
        <button type="button" onClick={() => seek(-1)} disabled={!list.length} aria-label="Previous station">◀◀</button>
        <button
          type="button"
          className="is-play"
          onClick={() => (playing ? pause() : void play())}
          disabled={!station}
        >
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button type="button" onClick={() => seek(1)} disabled={!list.length} aria-label="Next station">▶▶</button>
        <span className="silver-count">{list.length ? `${index + 1}/${list.length}` : "—"}</span>
      </div>

      <div className="silver-tone">
        {([["Bass", bass, setBass], ["Mid", mid, setMid], ["Treble", treble, setTreble]] as const).map(
          ([label, value, set]) => (
            <label key={label}>
              <span>{label}</span>
              <input
                type="range" min={-1} max={1} step={0.1} value={value}
                onChange={(event) => set(Number(event.target.value))}
              />
              <small>{value === 0 ? "flat" : value > 0 ? `+${Math.round(value * 10)}` : Math.round(value * 10)}</small>
            </label>
          ),
        )}
      </div>

      <p className="silver-note">
        Live stations come from the public Radio Browser directory. The audio is
        broadcast by other people — we do not choose or control what is on.
      </p>
    </div>
  );
}
