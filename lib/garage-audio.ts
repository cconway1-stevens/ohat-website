"use client";

// A tiny garage-flavoured synth shared by the arcade games. Everything is
// generated with the Web Audio API so no audio files ship with the site, and
// every effect is wrapped so a blocked or absent AudioContext can never break
// a game — silence is always an acceptable outcome.

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    // Browsers hold the context suspended until a user gesture; these helpers
    // only ever run from click/tap handlers, so resuming is permitted.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** An oscillator that can glide between frequencies, for revs and sirens. */
function voice(
  audio: AudioContext,
  type: OscillatorType,
  ramp: Array<[at: number, hz: number]>,
  duration: number,
  peak: number,
) {
  const gain = audio.createGain();
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(audio.destination);
  const osc = audio.createOscillator();
  osc.type = type;
  for (const [at, hz] of ramp) {
    if (at === 0) osc.frequency.setValueAtTime(hz, now);
    else osc.frequency.exponentialRampToValueAtTime(hz, now + at);
  }
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + duration);
}

/** A burst of filtered noise, for skids and gravel. */
function noise(audio: AudioContext, duration: number, cutoff: number, peak: number) {
  const samples = Math.ceil(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, samples, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = cutoff;
  const gain = audio.createGain();
  const now = audio.currentTime;
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(now);
}

function safely(effect: (audio: AudioContext) => void) {
  const audio = context();
  if (!audio) return;
  try {
    effect(audio);
  } catch {
    // Silence over crashes, always.
  }
}

export const garageAudio = {
  /** Short upward rev — flipping a card, moving a lane. */
  rev: () =>
    safely((audio) => voice(audio, "sawtooth", [[0, 70], [0.12, 180]], 0.16, 0.06)),
  /** Starter motor catching — dealing a deck, starting a run. */
  ignition: () =>
    safely((audio) => {
      voice(audio, "square", [[0, 55], [0.1, 50], [0.22, 90]], 0.3, 0.05);
      noise(audio, 0.22, 700, 0.02);
    }),
  /** A low, unobtrusive engine pulse for a car that is already moving. */
  cruise: () =>
    safely((audio) => voice(audio, "sawtooth", [[0, 72], [0.28, 94], [0.72, 78]], 0.78, 0.018)),
  /** Friendly two-tone horn — a successful match. */
  horn: () =>
    safely((audio) => {
      voice(audio, "square", [[0, 440]], 0.22, 0.045);
      voice(audio, "square", [[0, 554]], 0.22, 0.045);
    }),
  /** Tires losing grip — a miss or a crash. */
  skid: () =>
    safely((audio) => {
      noise(audio, 0.3, 1800, 0.05);
      voice(audio, "sawtooth", [[0, 220], [0.26, 90]], 0.28, 0.03);
    }),
  /** A short low dip for ducking under an obstacle. */
  duck: () =>
    safely((audio) => voice(audio, "triangle", [[0, 260], [0.11, 130]], 0.14, 0.035)),
  /** Race-start beep, the lights going up. */
  beep: (hz = 392) => safely((audio) => voice(audio, "square", [[0, hz]], 0.14, 0.05)),
  /** A little victory fanfare on horns. */
  fanfare: () =>
    safely((audio) => {
      const notes: Array<[number, number]> = [[523, 0], [659, 0.12], [784, 0.24]];
      for (const [hz, delay] of notes) {
        const gain = audio.createGain();
        const start = audio.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.055, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        gain.connect(audio.destination);
        const osc = audio.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(hz, start);
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + 0.5);
      }
    }),
  /** A short, bright table-win cue. It is generated locally, not a casino recording. */
  blackjackWin: () =>
    safely((audio) => {
      const notes: Array<[number, number]> = [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]];
      for (const [hz, delay] of notes) {
        const gain = audio.createGain();
        const start = audio.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.035, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
        gain.connect(audio.destination);
        const osc = audio.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(hz, start);
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + 0.28);
      }
    }),
  /** Soft shop ambience, used by the no-pressure arcade scenes. */
  hum: () => safely((audio) => voice(audio, "sine", [[0, 92], [.55, 87]], .62, .025)),
  /** A short wash-bay burst. */
  spray: () => safely((audio) => noise(audio, .28, 1800, .028)),
  /** A small counter bell. */
  chime: () =>
    safely((audio) => {
      voice(audio, "sine", [[0, 880]], .42, .045);
      voice(audio, "sine", [[0, 1320]], .34, .025);
    }),
  /** A low radio-like flutter without shipping audio files. */
  radio: () =>
    safely((audio) => {
      noise(audio, .16, 950, .018);
      voice(audio, "triangle", [[0, 240], [.14, 310]], .18, .025);
    }),
};

export type GarageAudio = typeof garageAudio;

/* ------------------------------------------------------------------ *
 * Cozy scenes: one-shots you tap, and sustained beds that stay on.
 * ------------------------------------------------------------------ */

export const cozyAudio = {
  /** Shop door bell — two quick strikes, the second softer. */
  doorBell: () =>
    safely((audio) => {
      voice(audio, "sine", [[0, 1180]], 0.5, 0.05);
      voice(audio, "sine", [[0, 1760]], 0.38, 0.028);
      window.setTimeout(() => safely((a) => voice(a, "sine", [[0, 1180]], 0.34, 0.026)), 130);
    }),
  /** A drawer of tools rolling open and settling. */
  drawer: () =>
    safely((audio) => {
      noise(audio, 0.34, 420, 0.03);
      voice(audio, "triangle", [[0, 120], [0.3, 78]], 0.34, 0.018);
    }),
  /** Receipt printer chattering out a slip. */
  printer: () =>
    // Each chatter schedules its own burst, so the context is only needed
    // inside the timeouts.
    safely(() => {
      for (let i = 0; i < 9; i += 1) {
        window.setTimeout(() => safely((a) => noise(a, 0.03, 2600, 0.02)), i * 55);
      }
    }),
  /** Coffee pouring into a paper cup. */
  pour: () =>
    safely((audio) => {
      noise(audio, 0.9, 900, 0.02);
      voice(audio, "sine", [[0, 320], [0.85, 520]], 0.9, 0.012);
    }),
  /** Air compressor topping itself up, then cutting out. */
  compressor: () =>
    safely((audio) => {
      voice(audio, "sawtooth", [[0, 58], [0.1, 74], [1.4, 70]], 1.6, 0.02);
      window.setTimeout(() => safely((a) => noise(a, 0.5, 600, 0.03)), 1500);
    }),
  /** One sweep of a wiper blade across glass. */
  wiper: () =>
    safely((audio) => {
      noise(audio, 0.26, 1400, 0.016);
      voice(audio, "sine", [[0, 210], [0.24, 150]], 0.26, 0.01);
    }),
  /** A magazine page turning. */
  page: () => safely((audio) => noise(audio, 0.22, 3200, 0.016)),
  /** A light switch. */
  click: () => safely((audio) => noise(audio, 0.05, 2200, 0.05)),
  /** Coins into a vending machine. */
  coin: () =>
    safely((audio) => {
      voice(audio, "square", [[0, 1560]], 0.1, 0.03);
      window.setTimeout(() => safely((a) => voice(a, "square", [[0, 1180]], 0.14, 0.026)), 90);
    }),
};

/* --- sustained beds ------------------------------------------------ */

export type AmbienceLayer =
  | "rain" | "shopHum" | "road" | "water" | "fluorescent" | "static" | "traffic" | "casino";

type Bed = { gain: GainNode; stop: () => void };

// Filtered white noise, looped — the backbone of rain, road and water.
const BEDS: Record<AmbienceLayer, { hz: number; q: number; type: BiquadFilterType }> = {
  rain: { hz: 2400, q: 0.6, type: "bandpass" },
  shopHum: { hz: 120, q: 2.4, type: "lowpass" },
  road: { hz: 380, q: 0.8, type: "lowpass" },
  water: { hz: 1500, q: 0.5, type: "bandpass" },
  fluorescent: { hz: 240, q: 6, type: "bandpass" },
  static: { hz: 3200, q: 0.4, type: "bandpass" },
  traffic: { hz: 300, q: 1.2, type: "bandpass" },
  casino: { hz: 1050, q: 0.65, type: "bandpass" },
};

const live = new Map<AmbienceLayer, Bed>();

// The card table needs more than a bright hiss. This is a deliberately quiet
// room tone: muffled conversation-like movement, a low lounge chord, and no
// borrowed casino recording or recognisable music.
function makeCasinoBed(audio: AudioContext): Bed {
  const master = audio.createGain();
  master.gain.value = 0;
  master.connect(audio.destination);

  const samples = audio.sampleRate * 3;
  const buffer = audio.createBuffer(1, samples, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i += 1) data[i] = Math.random() * 2 - 1;
  const room = audio.createBufferSource();
  room.buffer = buffer;
  room.loop = true;
  const roomFilter = audio.createBiquadFilter();
  roomFilter.type = "bandpass";
  roomFilter.frequency.value = 720;
  roomFilter.Q.value = 0.45;
  const roomGain = audio.createGain();
  roomGain.gain.value = 0.22;
  room.connect(roomFilter).connect(roomGain).connect(master);

  const voices: OscillatorNode[] = [];
  for (const frequency of [147, 220, 294]) {
    const voice = audio.createOscillator();
    voice.type = "triangle";
    voice.frequency.value = frequency;
    const tone = audio.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 860;
    const voiceGain = audio.createGain();
    voiceGain.gain.value = 0.024;
    voice.connect(tone).connect(voiceGain).connect(master);
    voice.start();
    voices.push(voice);
  }

  room.start();
  return {
    gain: master,
    stop: () => {
      try { room.stop(); } catch { /* already stopped */ }
      for (const voice of voices) {
        try { voice.stop(); } catch { /* already stopped */ }
      }
    },
  };
}

function makeBed(audio: AudioContext, layer: AmbienceLayer): Bed {
  if (layer === "casino") return makeCasinoBed(audio);
  const spec = BEDS[layer];
  // Two seconds of noise, looped — long enough that the loop point is
  // inaudible, short enough to build instantly.
  const samples = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, samples, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = spec.type;
  filter.frequency.value = spec.hz;
  filter.Q.value = spec.q;
  const gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
  return { gain, stop: () => { try { source.stop(); } catch { /* already stopped */ } } };
}

/**
 * The sustained side of the cozy scenes: rain that keeps falling, a shop that
 * keeps humming. Levels glide rather than jump, so turning the rain up feels
 * like weather rather than a switch.
 */
export const ambience = {
  set(layer: AmbienceLayer, level: number, glide = 0.6) {
    safely((audio) => {
      let bed = live.get(layer);
      if (!bed) {
        bed = makeBed(audio, layer);
        live.set(layer, bed);
      }
      const now = audio.currentTime;
      bed.gain.gain.cancelScheduledValues(now);
      bed.gain.gain.setValueAtTime(bed.gain.gain.value, now);
      bed.gain.gain.linearRampToValueAtTime(Math.max(0, level), now + glide);
    });
  },
  stopAll() {
    for (const [, bed] of live) {
      try {
        bed.gain.gain.value = 0;
        bed.stop();
      } catch {
        // Silence over crashes, always.
      }
    }
    live.clear();
  },
};

/* --- the radio ----------------------------------------------------- */

// Each station is a locally synthesised bed rather than a stream: nothing is
// fetched, nothing is downloaded, and it cannot break when someone else's
// server does. Real chart music is licensed and cannot be shipped here, so the
// pop stations are styled after it — brighter keys, faster arpeggios and an
// actual beat — rather than being it.
export type Band = "AM" | "FM";
export type Station = {
  id: string;
  name: string;
  genre: string;
  band: Band;
  dial: number;
  notes: number[];
  wave: OscillatorType;
  /** Beats per second. Set for anything that should feel rhythmic. */
  pulse?: number;
  /** Cycle the notes instead of holding them as a chord. */
  arp?: boolean;
};

export const stations: Station[] = [
  { id: "pop", name: "WHTZ Hot Hits", genre: "Top 40", band: "FM", dial: 89.9, notes: [440, 554, 659, 880], wave: "square", pulse: 2, arp: true },
  { id: "pulse", name: "WPLS Pulse FM", genre: "Dance pop", band: "FM", dial: 92.3, notes: [392, 523, 587, 784], wave: "sawtooth", pulse: 2.2, arp: true },
  { id: "shore", name: "WSHR Shore Gold", genre: "Oldies", band: "FM", dial: 95.5, notes: [196, 247, 294, 392], wave: "sine" },
  { id: "boulevard", name: "WBLV The Boulevard", genre: "Soft rock", band: "FM", dial: 98.7, notes: [147, 185, 220, 294], wave: "triangle", pulse: 1.1 },
  { id: "latenight", name: "WLNT Late Night", genre: "Jazz", band: "FM", dial: 103.3, notes: [131, 165, 196, 262], wave: "triangle" },
  { id: "country", name: "WPNE Pinelands", genre: "Country", band: "FM", dial: 106.1, notes: [175, 220, 262, 349], wave: "triangle", pulse: 1.4, arp: true },
  { id: "talk", name: "WOHT Shop Talk", genre: "Talk", band: "AM", dial: 1010, notes: [110, 165], wave: "sawtooth" },
  { id: "ball", name: "WGME Ball Game", genre: "Sports", band: "AM", dial: 1290, notes: [131, 196], wave: "square" },
  { id: "news", name: "WNWS All News", genre: "News", band: "AM", dial: 1560, notes: [147, 220], wave: "sawtooth" },
];

export const BANDS: Record<Band, { min: number; max: number; step: number }> = {
  FM: { min: 87.5, max: 108, step: 0.1 },
  AM: { min: 530, max: 1700, step: 10 },
};

// Kept for the older callers that only ever knew about FM.
export const DIAL_MIN = BANDS.FM.min;
export const DIAL_MAX = BANDS.FM.max;

let radioVoices: OscillatorNode[] = [];
let radioBus: GainNode | null = null;
let radioTone: BiquadFilterNode | null = null;
let radioPan: StereoPannerNode | null = null;
let radioPulse: OscillatorNode | null = null;
let loaded = "";

/** How cleanly a dial position lands on a station: 1 is dead on, 0 is noise. */
export function stationLock(dial: number, band: Band = "FM") {
  const inBand = stations.filter((entry) => entry.band === band);
  let best = inBand[0];
  let bestGap = Infinity;
  for (const entry of inBand) {
    const gap = Math.abs(entry.dial - dial);
    if (gap < bestGap) { bestGap = gap; best = entry; }
  }
  // AM dials are numerically much wider, so the tolerance scales with the band.
  const tolerance = band === "AM" ? 14 : 0.6;
  return { station: best, lock: Math.max(0, 1 - bestGap / tolerance) };
}

export type RadioSettings = {
  volume: number;
  /** 0 mellow, 1 bright. */
  tone: number;
  /** -1 left, 0 centre, 1 right. */
  balance: number;
  band: Band;
};

export const radio = {
  tune(dial: number, { volume, tone, balance, band }: RadioSettings) {
    safely((audio) => {
      const { station, lock } = stationLock(dial, band);
      if (!radioBus) {
        radioBus = audio.createGain();
        radioTone = audio.createBiquadFilter();
        radioTone.type = "lowpass";
        radioPan = audio.createStereoPanner();
        radioBus.gain.value = 0;
        radioBus.connect(radioTone).connect(radioPan).connect(audio.destination);
      }
      const now = audio.currentTime;
      radioTone!.frequency.setTargetAtTime(500 + tone * 6500, now, 0.05);
      radioPan!.pan.setTargetAtTime(balance, now, 0.05);

      // Rebuild the voices only when the station actually changes.
      if (loaded !== station.id) {
        for (const osc of radioVoices) { try { osc.stop(); } catch { /* gone */ } }
        radioVoices = [];
        radioPulse?.disconnect();
        radioPulse = null;

        // A beat, where the station has one: a slow square LFO ducking the bus.
        const beat = audio.createGain();
        beat.gain.value = 1;
        beat.connect(radioBus!);
        if (station.pulse) {
          const lfo = audio.createOscillator();
          lfo.type = "square";
          lfo.frequency.value = station.pulse;
          const depth = audio.createGain();
          depth.gain.value = 0.32;
          lfo.connect(depth).connect(beat.gain);
          lfo.start(now);
          radioPulse = lfo;
        }

        station.notes.forEach((hz, index) => {
          const gain = audio.createGain();
          gain.gain.value = 0.9 / station.notes.length;
          const osc = audio.createOscillator();
          osc.type = station.wave;
          osc.frequency.value = hz;
          osc.detune.value = (index - 1) * 4;
          // An arpeggio steps each note in turn rather than holding a chord.
          if (station.arp && station.pulse) {
            const step = 1 / (station.pulse * station.notes.length);
            gain.gain.value = 0;
            for (let bar = 0; bar < 64; bar += 1) {
              const at = now + bar * step * station.notes.length + index * step;
              gain.gain.setValueAtTime(0.9 / station.notes.length, at);
              gain.gain.setValueAtTime(0, at + step * 0.85);
            }
          }
          osc.connect(gain).connect(beat);
          osc.start(now);
          radioVoices.push(osc);
        });
        loaded = station.id;
      }

      radioBus!.gain.cancelScheduledValues(now);
      radioBus!.gain.setValueAtTime(radioBus!.gain.value, now);
      radioBus!.gain.linearRampToValueAtTime(volume * lock * 0.045, now + 0.18);
      // Between stations you get hiss instead of music.
      ambience.set("static", volume * (1 - lock) * 0.02, 0.2);
    });
  },
  off() {
    safely(() => {
      for (const osc of radioVoices) { try { osc.stop(); } catch { /* gone */ } }
      radioVoices = [];
      radioPulse = null;
      loaded = "";
      if (radioBus) radioBus.gain.value = 0;
      ambience.set("static", 0, 0.2);
    });
  },
};
