"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ChatChip } from "@/lib/chat/answers";
import { MASCOTS, PRODUCTION_MASCOT } from "@/lib/chat/mascot";
import { clearTranscript, loadRecent, recordEntry, serializeTranscript } from "@/lib/chat/transcript";
import type { TirePalEmote } from "./tire-pal-scene";

/** The mascot config: change PRODUCTION_MASCOT in src/lib/chat/mascot.ts and
 *  every face, name and scene here follows. */
const mascot = MASCOTS[PRODUCTION_MASCOT];

// The animated scene is lazy so its chunk (Three.js for the tire rig, or the
// pixel renderer) only downloads when the panel first opens. The loading
// fallback is the same inline face used by the FAB, so nothing flashes empty.
const MascotScene = dynamic(
  () => (mascot.scene === "pixel" ? import("./pixel-mascot-scene") : import("./tire-pal-scene")),
  {
    ssr: false,
    loading: () => <MascotFace className="tread-scene-fallback" />,
  },
);

/**
 * Tread — the contact-page chat widget. A fixed bottom-right FAB with a cute
 * tire face that opens a fully local Q&A panel. The 3D scene rides in its own
 * chunk (Three.js is heavy) and is only mounted after the panel has been opened
 * once, so the initial page load never pays for it. The answers module
 * (Tread's brain — TF-IDF matcher, fuzzy fallback, intents) is likewise
 * lazy-loaded so the 57 KB chunk stays out of the initial contact-page load.
 */

type AnswersModule = typeof import("@/lib/chat/answers");

// The 3D scene is lazy so the Three.js chunk only downloads when the panel
// first opens. The loading fallback is the same inline SVG face used by the
// FAB, so the header never flashes empty.

/** The mascot's inline face: FAB, header, message avatars, load fallback.
 *  One SVG per mascot `face` in the mascot config — swap the config, swap
 *  the face everywhere at once. */
function MascotFace({ className }: { className?: string }) {
  if (mascot.face === "spark") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
        {/* Sparky: terminal nut, white ceramic, hex nut, threads, electrode. */}
        <rect
          x="43"
          y="6"
          width="14"
          height="12"
          rx="2"
          fill="#2a2624"
          stroke="#171412"
          strokeWidth="2.5"
        />
        <rect
          x="36"
          y="18"
          width="28"
          height="38"
          rx="5"
          fill="#f5f1e8"
          stroke="#171412"
          strokeWidth="3"
        />
        <rect
          x="33"
          y="56"
          width="34"
          height="13"
          rx="2"
          fill="#6f6a61"
          stroke="#171412"
          strokeWidth="3"
        />
        <rect
          x="41"
          y="69"
          width="18"
          height="7"
          fill="#8a8378"
          stroke="#171412"
          strokeWidth="2.5"
        />
        <rect
          x="43"
          y="76"
          width="14"
          height="7"
          fill="#8a8378"
          stroke="#171412"
          strokeWidth="2.5"
        />
        <path d="M50 83 L45 93 L55 93 Z" fill="#2a2624" stroke="#171412" strokeWidth="2" />
        <circle cx="44" cy="32" r="4.5" fill="#171412" />
        <circle cx="56" cy="32" r="4.5" fill="#171412" />
        <path
          d="M41 42 Q50 50 59 42"
          fill="none"
          stroke="#171412"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M36 18 L64 18 L62 26 L38 26 Z" fill="#f6bd38" stroke="#171412" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="46" fill="#2a2624" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#171412" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" fill="#f5f1e8" />
      <circle cx="50" cy="50" r="30" fill="#f7efd9" />
      <circle cx="40" cy="46" r="5" fill="#171412" />
      <circle cx="60" cy="46" r="5" fill="#171412" />
      <path
        d="M40 58 Q50 66 60 58"
        fill="none"
        stroke="#171412"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M33 30 Q50 6 67 30 L67 36 Q50 24 33 36 Z" fill="#a8161c" />
      <circle cx="50" cy="16" r="3.5" fill="#6f0d12" />
    </svg>
  );
}

/** Minimal structural type for the Web Speech API; the real interface lives in
 *  lib.dom.d.ts but pulling it in pulls the whole DOM lib into a bundle the
 *  widget would rather avoid. */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (event: { error?: string }) => void;
  onend: () => void;
  start(): void;
  stop(): void;
};

type Message = {
  id: number;
  role: "tread" | "user";
  text: string;
  chips?: ChatChip[];
  /** Full FAQ text if the bubble was trimmed to fit the chat width. */
  fullText?: string;
  /** "Did you mean…" chips surfaced when the brain could not match. */
  suggestions?: string[];
};

const GREETING_KEY = "ohat-tread-greeted";
const TEXT_SCALE_KEY = "ohat-tread-text-scale";
/** Three text sizes for visitors who need bigger type — cycled by the "Aa"
 *  button in the header. Indexes into the `tread-zoom-*` classes. */
const TEXT_SCALES = ["A", "A+", "A++"] as const;

const AI_DISCLAIMER = `${mascot.persona.name} is AI and can make mistakes. It doesn't reflect the views of Ocean Heights Auto & Tire — it's just here to help you find info faster.`;
const AI_DISCLAIMER_SHORT =
  "AI-generated answers can be wrong and don't represent Ocean Heights Auto & Tire's official views.";

// Inlined copy of `quickPrompts` from answers.ts. The full answers module
// (57 KB) is lazy-loaded after mount; inlining 7 strings avoids pulling
// the whole matcher into the initial page load just for the prompt chips.
const QUICK_PROMPTS = [
  "Are you open?",
  "Can you fix a flat?",
  "Book an appointment",
  "Talk to a person",
  "Do you do NJ inspection?",
  "Do you take cards?",
  "Tell me a joke",
];

// Message ids and emote ids just need to be unique and ever-increasing — a
// module-level counter avoids the Date.now() collisions that broke React
// keys when several messages were restored in the same millisecond.
let idSeq = 0;
function nextId(): number {
  idSeq += 1;
  return idSeq;
}
function nextEmote(kind: NonNullable<TirePalEmote>["kind"]): TirePalEmote {
  return { kind, id: nextId() };
}

/** A short, honest note for each way voice capture can fail. */
function voiceErrorMessage(reason: string): string {
  if (reason === "not-allowed" || reason === "service-not-allowed") {
    return "Microphone access is blocked — allow it in your browser, or just type your question.";
  }
  if (reason === "no-speech") return "I didn't catch that — try speaking a little louder.";
  if (reason === "network") {
    return "Voice needs a network connection — please type your question.";
  }
  return "Voice didn't work just now — please type your question.";
}

export function TirePal() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [emote, setEmote] = useState<TirePalEmote>(null);
  const [sceneMounted, setSceneMounted] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  // A bubble that was trimmed for fit remembers its expanded state locally
  // so the read-more chip can toggle without re-running the brain.
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  // Briefly swaps the copy icon for a checkmark on the bubble that was just
  // copied, then reverts — no toast, just the button itself confirming.
  const [copiedId, setCopiedId] = useState<number | null>(null);
  // Tracks which bubble's read-aloud is playing so the speaker icon can show
  // a "stop" state instead of a second overlapping utterance.
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  // Client-only: read-aloud only appears when the browser exposes the Web
  // Speech synthesis API (no network, no model — the OS's own voices).
  const [ttsSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  // Tracks whether the browser exposed a working SpeechRecognition — used to
  // show or hide the mic button on the input row. Client-only: read in a lazy
  // initializer so SSR never touches `window`.
  const [sttSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
  });
  // The active recognizer, so a second mic tap stops instead of stacking a
  // second recognizer on top of the first.
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Voice can fail for honest reasons — blocked permission, no mic, insecure
  // origin, no network. Each one surfaces a short note instead of leaving the
  // visitor staring at thinking dots that never turn into words.
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Full-screen toggle: the panel grows to fill most of the viewport so a
  // long answer (or a visitor who wants room) isn't stuck in a 360px column.
  const [maximized, setMaximized] = useState(false);
  // Text size for visitors who need bigger type — persisted, cycled by the
  // "Aa" button. Indexes into the `tread-zoom-*` classes.
  const [textScale, setTextScale] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = Number(localStorage.getItem(TEXT_SCALE_KEY));
    return saved >= 0 && saved < TEXT_SCALES.length ? saved : 0;
  });
  // Client-only: read the reduced-motion preference in a lazy initializer so
  // SSR never touches `window`.
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  // Bumped on every clearChat() so an answer already in flight is discarded.
  const sessionRef = useRef(0);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Lazy-load Tread's brain (the answers module — 57 KB of TF-IDF matcher,
  // fuzzy fallback, and intents) in the background after mount so it's
  // ready by the time the user opens the panel, without blocking the
  // initial page load. The promise is cached so subsequent opens are free.
  const answersRef = useRef<Promise<AnswersModule> | null>(null);
  const getAnswers = () => {
    if (!answersRef.current) answersRef.current = import("@/lib/chat/answers");
    return answersRef.current;
  };
  useEffect(() => {
    void getAnswers();
  }, []);

  // Proactive nudge: ~5 s after mount, if the visitor hasn't been greeted and
  // the panel is still closed, pop a bubble near the FAB.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!openRef.current && !localStorage.getItem(GREETING_KEY)) {
        setNudgeVisible(true);
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  // Escape closes the disclaimer popover first, then the panel, so a visitor
  // reading the disclaimer doesn't lose their conversation by mistake.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (disclaimerOpen) {
        setDisclaimerOpen(false);
        return;
      }
      setOpen(false);
      fabRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, disclaimerOpen]);

  // Click outside the disclaimer popover dismisses it.
  useEffect(() => {
    if (!disclaimerOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".tread-disclaimer")) setDisclaimerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [disclaimerOpen]);

  // Focus the input on open, but only for fine pointers so mobile keyboards
  // don't pop up uninvited.
  useEffect(() => {
    if (open && window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Keep the log scrolled to the newest message.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking]);

  // Voice failure notes clear themselves after a few seconds.
  useEffect(() => {
    if (!voiceError) return;
    const timer = window.setTimeout(() => setVoiceError(null), 6000);
    return () => window.clearTimeout(timer);
  }, [voiceError]);

  // Stop any read-aloud in progress when the panel closes or unmounts.
  useEffect(() => {
    if (!open) window.speechSynthesis?.cancel();
    return () => window.speechSynthesis?.cancel();
  }, [open]);

  function markGreeted() {
    localStorage.setItem(GREETING_KEY, "1");
    setNudgeVisible(false);
  }

  function openPanel() {
    markGreeted();
    setSceneMounted(true);
    setOpen(true);
    if (messages.length === 0) {
      // Restore the last day of conversation from the local log so a
      // returning visitor picks up where they left off. If there's no
      // history, fall through to the greeting.
      const restored = loadRecent(window.localStorage).map((entry) => ({
        id: nextId(),
        role: entry.role,
        text: entry.text,
      }));
      if (restored.length > 0) {
        setMessages(restored);
        return;
      }
      getAnswers()
        .then(({ treadGreeting }) => {
          setMessages((m) => [...m, { id: nextId(), role: "tread", text: treadGreeting() }]);
        })
        .catch(() => {
          // Brain failed to load — the send path shows the honest fallback.
        });
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    // The session id lets clearChat() discard an answer that was already in
    // flight when the conversation was wiped.
    const session = sessionRef.current;
    setMessages((m) => [...m, { id: nextId(), role: "user", text: trimmed }]);
    recordEntry(window.localStorage, { t: Date.now(), role: "user", text: trimmed });
    setInput("");
    setThinking(true);
    setEmote(nextEmote("thinking"));
    const delay = reducedMotion ? 0 : 450;
    window.setTimeout(() => {
      if (sessionRef.current !== session) return;
      getAnswers()
        .then(({ debugAnswer }) => {
          const resolved = debugAnswer(trimmed);
          const answer = resolved.answer;
          const id = nextId();
          setMessages((m) => [
            ...m,
            {
              id,
              role: "tread",
              text: answer.text,
              chips: answer.chips,
              fullText: answer.fullText,
              suggestions: answer.suggestions,
            },
          ]);
          recordEntry(window.localStorage, {
            t: Date.now(),
            role: "tread",
            text: answer.text,
            miss: answer.fallback || undefined,
            matched: resolved.matched,
          });
          setThinking(false);
          if (answer.fallback) {
            setEmote(nextEmote("sleep"));
          } else if (answer.chips.some((c) => c.kind === "download")) {
            setEmote(nextEmote("happy"));
          }
        })
        .catch(() => {
          // The brain failed to load or run — never leave the visitor
          // staring at a thinking bubble. Be honest and point at the humans.
          setMessages((m) => [
            ...m,
            {
              id: nextId(),
              role: "tread",
              text: "My brain hiccuped loading my answers — please try again, or call the shop with the button at the top of the page.",
            },
          ]);
          setThinking(false);
          setEmote(nextEmote("sleep"));
        });
    }, delay);
  }

  /** Local-only transcript export — the log never leaves the device unless
   *  the visitor (or the shop, on their own machine) downloads it. */
  function downloadTranscript() {
    const json = serializeTranscript(window.localStorage);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mascot.persona.name.toLowerCase()}-transcript.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** Cycles the panel's text size (normal → large → larger) and remembers the
   *  choice so a returning visitor keeps their comfortable reading size. */
  function cycleTextScale() {
    setTextScale((current) => {
      const next = (current + 1) % TEXT_SCALES.length;
      localStorage.setItem(TEXT_SCALE_KEY, String(next));
      return next;
    });
  }

  /** Wipes the visible conversation and the local transcript log, then drops
   *  a fresh greeting so the panel doesn't sit empty. A pending answer from
   *  before the clear is discarded via the session guard in `send`. */
  function clearChat() {
    sessionRef.current += 1;
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setThinking(false);
    setEmote(null);
    setExpanded({});
    clearTranscript(window.localStorage);
    setMessages([]);
    getAnswers()
      .then(({ treadGreeting }) => {
        setMessages([{ id: nextId(), role: "tread", text: treadGreeting() }]);
      })
      .catch(() => {
        // Brain failed to load — an empty panel is fine, the input still works.
      });
  }

  /** Copies one bubble's text to the clipboard with a brief checkmark
   *  confirmation on the button itself. */
  function copyMessage(id: number, text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
      })
      .catch(() => {
        // Clipboard permission denied or unavailable — nothing to fall back to.
      });
  }

  /** Reads a bubble aloud with the browser's built-in voice — fully local,
   *  same "no data leaves your device" promise as the rest of the widget.
   *  Clicking the speaker again while it's talking stops it. */
  function toggleSpeak(id: number, text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingId === id) {
      synth.cancel();
      setSpeakingId(null);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(utterance);
  }

  /** Speech-to-text capture for the input. Tapping the mic again stops the
   *  recognizer instead of stacking a second one. Web Speech is browser-native
   *  — no network, no model, no bundle weight — but it can fail for honest
   *  reasons (blocked permission, no mic, insecure origin), so every failure
   *  path surfaces a note instead of leaving thinking dots that never resolve. */
  function startListening() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return false;
    if (recognitionRef.current) {
      // Second tap while listening: stop, don't stack recognizers.
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return true;
    }
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setInput((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onerror = (event: { error?: string }) => {
      setVoiceError(voiceErrorMessage(event.error ?? ""));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setEmote(null);
    };
    setEmote(nextEmote("thinking"));
    try {
      recognition.start();
    } catch {
      // start() throws synchronously in a few browsers (e.g. after a denied
      // permission) — treat it like any other voice failure.
      recognitionRef.current = null;
      setVoiceError(voiceErrorMessage("start-failed"));
      setEmote(null);
    }
    return true;
  }

  function onChipClick(chip: ChatChip) {
    if (chip.kind === "download") setEmote(nextEmote("celebrate"));
  }

  return (
    <>
      {nudgeVisible && (
        <div className="tread-nudge" role="status">
          <p>
            Need a hand? Ask {mascot.persona.name} — I know hours, services and directions.
          </p>
          <button
            type="button"
            className="tread-nudge-dismiss"
            aria-label="Dismiss"
            onClick={markGreeted}
          >
            ×
          </button>
        </div>
      )}

      {open && (
        <section
          className={`tread-panel tread-zoom-${textScale}${maximized ? " tread-panel-max" : ""}`}
          aria-label={`Chat with ${mascot.persona.name}`}
        >
          <header className="tread-panel-head">
            <div
              className="tread-scene"
              role="img"
              aria-label={`${mascot.persona.name}, ${mascot.persona.kind}`}
            >
              {sceneFailed ? (
                <MascotFace className="tread-scene-fallback" />
              ) : (
                sceneMounted && (
                  <MascotScene
                    emote={emote}
                    reducedMotion={reducedMotion}
                    onFail={() => setSceneFailed(true)}
                    className="tread-scene-canvas"
                  />
                )
              )}
            </div>
            <div className="tread-panel-title">
              <strong>
                {mascot.persona.name}
                <span className="tread-disclaimer">
                  <button
                    type="button"
                    className="tread-ai-badge"
                    aria-label={`About ${mascot.persona.name}'s AI answers`}
                    aria-expanded={disclaimerOpen}
                    title={AI_DISCLAIMER_SHORT}
                    onClick={() => setDisclaimerOpen((v) => !v)}
                  >
                    AI
                  </button>
                  {disclaimerOpen && (
                    <div className="tread-disclaimer-popover" role="tooltip">
                      {AI_DISCLAIMER}
                    </div>
                  )}
                </span>
              </strong>
              <span>Local answers · no data leaves your device</span>
            </div>
            <div className="tread-actions">
              <button
                type="button"
                className="tread-icon-btn tread-text-btn"
                aria-label={`Text size: ${["small", "medium", "large"][textScale]} — click to increase`}
                title="Adjust text size"
                onClick={cycleTextScale}
              >
                {TEXT_SCALES[textScale]}
              </button>
              <button
                type="button"
                className="tread-icon-btn"
                aria-label={maximized ? "Shrink chat" : "Expand chat"}
                title={maximized ? "Shrink chat" : "Expand chat"}
                onClick={() => setMaximized((v) => !v)}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                  {maximized ? (
                    <path
                      d="M3 6h3V3M13 6h-3V3M3 10h3v3M13 10h-3v3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M6 3H3v3M10 3h3v3M6 13H3v-3M10 13h3v-3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
              <button
                type="button"
                className="tread-icon-btn"
                aria-label="Clear chat"
                title="Clear this conversation"
                onClick={clearChat}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                  <path
                    d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.6 9.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8L11.5 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="tread-icon-btn"
                aria-label="Download transcript"
                title="Download transcript — it stays on your device"
                onClick={downloadTranscript}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                  <path
                    d="M8 2v8m0 0L5 7m3 3l3-3M3 12h10v2H3z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="tread-icon-btn"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="tread-log" role="log" aria-live="polite" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tread-msg tread-msg-${m.role}`}>
                {m.role === "tread" && <MascotFace className="tread-msg-avatar" />}
                <div className="tread-bubble">
                  <p>{expanded[m.id] && m.fullText ? m.fullText : m.text}</p>
                  {m.fullText && m.fullText !== m.text && (
                    <button
                      type="button"
                      className="tread-readmore"
                      aria-expanded={Boolean(expanded[m.id])}
                      onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                    >
                      {expanded[m.id] ? "Show less" : "Read more"}
                    </button>
                  )}
                  {m.chips && m.chips.length > 0 && (
                    <div className="tread-chips">
                      {m.chips.map((chip) => (
                        <a
                          key={chip.href + chip.label}
                          href={chip.href}
                          className={`tread-chip tread-chip-${chip.kind}`}
                          {...(chip.kind === "download" ? { download: true } : {})}
                          {...(chip.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                          onClick={() => onChipClick(chip)}
                        >
                          {chip.label}
                        </a>
                      ))}
                    </div>
                  )}
                  {m.role === "tread" && (
                    <div className="tread-bubble-actions">
                      <button
                        type="button"
                        className="tread-bubble-btn"
                        aria-label={copiedId === m.id ? "Copied" : "Copy answer"}
                        title={copiedId === m.id ? "Copied!" : "Copy answer"}
                        onClick={() => copyMessage(m.id, expanded[m.id] && m.fullText ? m.fullText : m.text)}
                      >
                        {copiedId === m.id ? (
                          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                            <path
                              d="M3 8.5l3 3 7-7"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                            <rect
                              x="5.5"
                              y="5.5"
                              width="8"
                              height="8"
                              rx="1.2"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              fill="none"
                            />
                            <path
                              d="M3 10.5V3.7A1.2 1.2 0 0 1 4.2 2.5h6.8"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              fill="none"
                            />
                          </svg>
                        )}
                      </button>
                      {ttsSupported && (
                        <button
                          type="button"
                          className="tread-bubble-btn"
                          aria-label={speakingId === m.id ? "Stop reading" : "Read aloud"}
                          title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                          onClick={() =>
                            toggleSpeak(m.id, expanded[m.id] && m.fullText ? m.fullText : m.text)
                          }
                        >
                          {speakingId === m.id ? (
                            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                              <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                              <path
                                d="M2 6v4h2.5L8 13V3L4.5 6H2z"
                                fill="currentColor"
                              />
                              <path
                                d="M10.5 5.5a3 3 0 0 1 0 5M12.3 3.8a5.5 5.5 0 0 1 0 8.4"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                fill="none"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="tread-msg tread-msg-tread">
                <MascotFace className="tread-msg-avatar" />
                <div className="tread-bubble tread-thinking">
                  <span className="sr-only">{mascot.persona.name} is thinking…</span>
                  <span className="tread-dot" />
                  <span className="tread-dot" />
                  <span className="tread-dot" />
                </div>
              </div>
            )}
          </div>

          <div className="tread-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="tread-prompt"
                onClick={() => send(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {voiceError && (
            <p className="tread-voice-note" role="status">
              {voiceError}
            </p>
          )}

          <form
            className="tread-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => {
                setVoiceError(null);
                setInput(event.target.value);
              }}
              aria-label={`Ask ${mascot.persona.name} a question`}
              placeholder={`Ask ${mascot.persona.name} a question…`}
            />
            {sttSupported && (
              <button
                type="button"
                className="tread-mic"
                aria-label="Speak your question"
                title="Speak your question"
                onClick={startListening}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="6" y="2" width="4" height="8" rx="2" fill="currentColor" />
                  <path
                    d="M3 8a5 5 0 0 0 10 0M8 13v2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </button>
            )}
            <button type="submit" className="tread-send" aria-label="Send">
              Send
            </button>
          </form>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        className={nudgeVisible ? "tread-fab tread-fab-nudged" : "tread-fab"}
        aria-label={`Chat with ${mascot.persona.name}, ${mascot.persona.kind}`}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <MascotFace className="tread-fab-face" />
      </button>
    </>
  );
}
