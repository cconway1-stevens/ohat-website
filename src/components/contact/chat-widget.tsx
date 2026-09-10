"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ChatChip } from "@/lib/chat/answers";
import { MASCOTS, type MascotEmote, PRODUCTION_MASCOT } from "@/lib/chat/mascot";
import {
  clearTranscript,
  loadRecent,
  recordEntry,
  serializeTranscript,
} from "@/lib/chat/transcript";

/** The mascot config: change PRODUCTION_MASCOT in src/lib/chat/mascot.ts and
 *  every face, name and scene here follows. */
const mascot = MASCOTS[PRODUCTION_MASCOT];

// The animated scene is lazy so its chunk (Three.js for the tire rig, or the
// pixel renderer) only downloads when the panel first opens. The loading
// fallback is the same inline face used by the FAB, so nothing flashes empty.
const MascotScene = dynamic(
  () => (mascot.scene === "pixel" ? import("./pixel-mascot-scene") : import("./tire-3d-scene")),
  {
    ssr: false,
    loading: () => <MascotFace className="chat-scene-fallback" />,
  },
);

/**
 * The contact-page chat widget. A fixed bottom-right FAB with the configured
 * mascot (see src/lib/chat/mascot.ts — one variable swaps the character; its
 * persona flows through the FAB, scene, avatars and chat copy) that opens a
 * fully local Q&A panel. The 3D tire scene rides in its own chunk (Three.js
 * is heavy) and is only mounted after the panel has been opened once, so the
 * initial page load never pays for it. The answers module (the brain —
 * TF-IDF matcher, fuzzy fallback, intents) is likewise lazy-loaded so the
 * 57 KB chunk stays out of the initial contact-page load.
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
        {/* Eyes: a round pupil with a small highlight dot instead of a flat
            black circle, so the face reads friendly rather than blank/staring. */}
        <circle cx="44" cy="32" r="4.5" fill="#171412" />
        <circle cx="45.3" cy="30.5" r="1.3" fill="#f5f1e8" />
        <circle cx="56" cy="32" r="4.5" fill="#171412" />
        <circle cx="57.3" cy="30.5" r="1.3" fill="#f5f1e8" />
        <path
          d="M41 40 Q50 47 59 40"
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
  role: "mascot" | "user";
  text: string;
  chips?: ChatChip[];
  /** Full FAQ text if the bubble was trimmed to fit the chat width. */
  fullText?: string;
  /** "Did you mean…" chips surfaced when the brain could not match. */
  suggestions?: string[];
};

const GREETING_KEY = "ohat-chat-greeted";
const TEXT_SCALE_KEY = "ohat-chat-text-scale";
/** Three text sizes for visitors who need bigger type — cycled by the "Aa"
 *  button in the header. Indexes into the `chat-zoom-*` classes. */
const TEXT_SCALES = ["A", "A+", "A++"] as const;

const AI_DISCLAIMER = `${mascot.persona.name} is AI and can make mistakes. It doesn't reflect the views of Ocean Heights Auto & Tire — it's just here to help you find info faster.`;
const AI_DISCLAIMER_SHORT =
  "AI-generated answers can be wrong and don't represent Ocean Heights Auto & Tire's official views.";

// Inlined copy of the top entries in `quickPrompts` from answers.ts. The full
// answers module (57 KB) is lazy-loaded after mount; inlining a short list
// avoids pulling the whole matcher into the initial page load just for the
// prompt chips, and keeps the row from crowding out the input on first open.
const QUICK_PROMPTS = [
  "Are you open?",
  "Can you fix a flat?",
  "Book an appointment",
  "Talk to a person",
];

// Message ids and emote ids just need to be unique and ever-increasing — a
// module-level counter avoids the Date.now() collisions that broke React
// keys when several messages were restored in the same millisecond.
let idSeq = 0;
function nextId(): number {
  idSeq += 1;
  return idSeq;
}
function nextEmote(kind: NonNullable<MascotEmote>["kind"]): MascotEmote {
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

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [emote, setEmote] = useState<MascotEmote>(null);
  const [sceneMounted, setSceneMounted] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  // The header's overflow menu (expand, clear, download) — collapsed behind
  // one "more" button so the header only shows Aa + more + close by default,
  // instead of five separate circles fighting the title for space.
  const [menuOpen, setMenuOpen] = useState(false);
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
  // "Aa" button. Indexes into the `chat-zoom-*` classes.
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

  // Per-character typing reveal for mascot replies. Visitors reported the
  // answer popping in too fast to feel like a real exchange — the thinking
  // dots alone didn't carry the moment of "the AI is composing". Revealing
  // the reply one character at a time after the thinking delay fixes that.
  // `reducedMotion` skips the reveal (the full text lands instantly).
  const [typingId, setTypingId] = useState<number | null>(null);
  const [typedLen, setTypedLen] = useState(0);
  const typingTimerRef = useRef<number | null>(null);
  function revealText(messageId: number, fullText: string) {
    if (typingTimerRef.current !== null) {
      window.clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (reducedMotion || fullText.length === 0) {
      setTypingId(null);
      setTypedLen(fullText.length);
      return;
    }
    setTypingId(messageId);
    setTypedLen(0);
    const stepMs = 14;
    const charsPerTick = fullText.length > 220 ? 3 : 2;
    typingTimerRef.current = window.setInterval(() => {
      setTypedLen((current) => {
        const next = Math.min(fullText.length, current + charsPerTick);
        if (next >= fullText.length) {
          if (typingTimerRef.current !== null) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          setTypingId(null);
        }
        return next;
      });
    }, stepMs);
  }
  useEffect(
    () => () => {
      if (typingTimerRef.current !== null) window.clearInterval(typingTimerRef.current);
    },
    [],
  );

  // Lazy-load the brain (the answers module — 57 KB of TF-IDF matcher,
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

  // Escape closes the overflow menu or disclaimer popover first, then the
  // panel, so a visitor mid-menu or mid-read doesn't lose their conversation.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (disclaimerOpen) {
        setDisclaimerOpen(false);
        return;
      }
      setOpen(false);
      fabRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, disclaimerOpen, menuOpen]);

  // Click outside the disclaimer popover dismisses it.
  useEffect(() => {
    if (!disclaimerOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".chat-disclaimer")) setDisclaimerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [disclaimerOpen]);

  // Click outside the overflow menu dismisses it.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".chat-menu-wrap")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

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
        .then(({ mascotGreeting }) => {
          const text = mascotGreeting();
          const id = nextId();
          setMessages((m) => [...m, { id, role: "mascot", text }]);
          revealText(id, text);
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
    const delay = reducedMotion ? 0 : 600;
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
              role: "mascot",
              text: answer.text,
              chips: answer.chips,
              fullText: answer.fullText,
              suggestions: answer.suggestions,
            },
          ]);
          revealText(id, answer.text);
          recordEntry(window.localStorage, {
            t: Date.now(),
            role: "mascot",
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
          const fallbackText =
            "My brain hiccuped loading my answers — please try again, or call the shop with the button at the top of the page.";
          const fid = nextId();
          setMessages((m) => [
            ...m,
            {
              id: fid,
              role: "mascot",
              text: fallbackText,
            },
          ]);
          revealText(fid, fallbackText);
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
    setMenuOpen(false);
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
    setMenuOpen(false);
    clearTranscript(window.localStorage);
    setMessages([]);
    getAnswers()
      .then(({ mascotGreeting }) => {
        const text = mascotGreeting();
        const id = nextId();
        setMessages([{ id, role: "mascot", text }]);
        revealText(id, text);
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

  // What to render inside a bubble: the expanded FAQ text when the customer
  // hit "Read more", the currently-typed prefix while the mascot is still
  // composing, otherwise the full reply.
  function displayText(m: Message): string {
    if (expanded[m.id] && m.fullText) return m.fullText;
    if (typingId === m.id) return m.text.slice(0, typedLen);
    return m.text;
  }

  return (
    <>
      {nudgeVisible && (
        <div className="chat-nudge" role="status">
          <p>Need a hand? Ask {mascot.persona.name} — I know hours, services and directions.</p>
          <button
            type="button"
            className="chat-nudge-dismiss"
            aria-label="Dismiss"
            onClick={markGreeted}
          >
            ×
          </button>
        </div>
      )}

      {open && (
        <section
          className={`chat-panel chat-zoom-${textScale}${maximized ? " chat-panel-max" : ""}`}
          aria-label={`Chat with ${mascot.persona.name}`}
        >
          <header className="chat-panel-head">
            <div
              className="chat-scene"
              role="img"
              aria-label={`${mascot.persona.name}, ${mascot.persona.kind}`}
            >
              {sceneFailed ? (
                <MascotFace className="chat-scene-fallback" />
              ) : (
                sceneMounted && (
                  <MascotScene
                    emote={emote}
                    reducedMotion={reducedMotion}
                    onFail={() => setSceneFailed(true)}
                    className="chat-scene-canvas"
                  />
                )
              )}
            </div>
            <div className="chat-panel-title">
              <strong>
                {mascot.persona.name}
                <span className="chat-disclaimer">
                  <button
                    type="button"
                    className="chat-ai-badge"
                    aria-label={`About ${mascot.persona.name}'s AI answers`}
                    aria-expanded={disclaimerOpen}
                    title={AI_DISCLAIMER_SHORT}
                    onClick={() => setDisclaimerOpen((v) => !v)}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="10"
                      height="10"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 7.5v3.5M8 5.2v.1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    AI
                  </button>
                  {disclaimerOpen && (
                    <div className="chat-disclaimer-popover" role="tooltip">
                      {AI_DISCLAIMER}
                    </div>
                  )}
                </span>
              </strong>
              <span>Local answers · no data leaves your device</span>
            </div>
            <div className="chat-actions">
              <button
                type="button"
                className="chat-icon-btn chat-text-btn"
                aria-label={`Text size: ${["small", "medium", "large"][textScale]} — click to increase`}
                title="Adjust text size"
                onClick={cycleTextScale}
              >
                {TEXT_SCALES[textScale]}
              </button>
              <span className="chat-menu-wrap">
                <button
                  type="button"
                  className="chat-icon-btn"
                  aria-label="More options"
                  aria-expanded={menuOpen}
                  title="More options"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <circle cx="3.2" cy="8" r="1.4" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.4" fill="currentColor" />
                    <circle cx="12.8" cy="8" r="1.4" fill="currentColor" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="chat-menu" role="menu">
                    <button
                      type="button"
                      className="chat-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setMaximized((v) => !v);
                        setMenuOpen(false);
                      }}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        aria-hidden="true"
                        focusable="false"
                      >
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
                      {maximized ? "Shrink chat" : "Expand chat"}
                    </button>
                    <button
                      type="button"
                      className="chat-menu-item"
                      role="menuitem"
                      onClick={clearChat}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M3 4h10M6.5 4V2.5h3V4M4.5 4l.6 9.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8L11.5 4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Clear chat
                    </button>
                    <button
                      type="button"
                      className="chat-menu-item"
                      role="menuitem"
                      onClick={downloadTranscript}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M8 2v8m0 0L5 7m3 3l3-3M3 12h10v2H3z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Download transcript
                    </button>
                  </div>
                )}
              </span>
              <button
                type="button"
                className="chat-icon-btn"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="chat-log" role="log" aria-live="polite" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-msg chat-msg-${m.role}`}>
                {m.role === "mascot" && <MascotFace className="chat-msg-avatar" />}
                <div className="chat-bubble">
                  <p>{displayText(m)}</p>
                  {m.fullText && m.fullText !== m.text && (
                    <button
                      type="button"
                      className="chat-readmore"
                      aria-expanded={Boolean(expanded[m.id])}
                      onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                    >
                      {expanded[m.id] ? "Show less" : "Read more"}
                    </button>
                  )}
                  {m.chips && m.chips.length > 0 && (
                    <div className="chat-chips">
                      {m.chips.map((chip) => (
                        <a
                          key={chip.href + chip.label}
                          href={chip.href}
                          className={`chat-chip chat-chip-${chip.kind}`}
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
                  {m.role === "mascot" && (
                    <div className="chat-bubble-actions">
                      <button
                        type="button"
                        className="chat-bubble-btn"
                        aria-label={copiedId === m.id ? "Copied" : "Copy answer"}
                        title={copiedId === m.id ? "Copied!" : "Copy answer"}
                        onClick={() =>
                          copyMessage(m.id, expanded[m.id] && m.fullText ? m.fullText : m.text)
                        }
                      >
                        {copiedId === m.id ? (
                          <svg
                            viewBox="0 0 16 16"
                            width="12"
                            height="12"
                            aria-hidden="true"
                            focusable="false"
                          >
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
                          <svg
                            viewBox="0 0 16 16"
                            width="12"
                            height="12"
                            aria-hidden="true"
                            focusable="false"
                          >
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
                          className="chat-bubble-btn"
                          aria-label={speakingId === m.id ? "Stop reading" : "Read aloud"}
                          title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                          onClick={() =>
                            toggleSpeak(m.id, expanded[m.id] && m.fullText ? m.fullText : m.text)
                          }
                        >
                          {speakingId === m.id ? (
                            <svg
                              viewBox="0 0 16 16"
                              width="12"
                              height="12"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 16 16"
                              width="12"
                              height="12"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path d="M2 6v4h2.5L8 13V3L4.5 6H2z" fill="currentColor" />
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
              <div className="chat-msg chat-msg-mascot">
                <MascotFace className="chat-msg-avatar" />
                <div className="chat-bubble chat-thinking">
                  <span className="sr-only">{mascot.persona.name} is thinking…</span>
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                </div>
              </div>
            )}
          </div>

          <div className="chat-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chat-prompt"
                onClick={() => send(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {voiceError && (
            <p className="chat-voice-note" role="status">
              {voiceError}
            </p>
          )}

          <form
            className="chat-input-row"
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
                className="chat-mic"
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
            <button type="submit" className="chat-send" aria-label="Send">
              Send
            </button>
          </form>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        className={nudgeVisible ? "chat-fab chat-fab-nudged" : "chat-fab"}
        aria-label={`Chat with ${mascot.persona.name}, ${mascot.persona.kind}`}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <MascotFace className="chat-fab-face" />
      </button>
    </>
  );
}
