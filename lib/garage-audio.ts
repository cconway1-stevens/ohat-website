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
