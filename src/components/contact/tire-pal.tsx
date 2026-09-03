"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ChatChip } from "@/lib/chat/answers";
import type { TirePalEmote } from "./tire-pal-scene";

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
const TirePalScene = dynamic(() => import("./tire-pal-scene"), {
  ssr: false,
  loading: () => <TirePalFace className="tread-scene-fallback" />,
});

/** The cute inline tire face: dark ring, cream hubcap, eyes, smile, red cap. */
function TirePalFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="46" fill="#2a2624" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#171412" strokeWidth="3" />
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
  onend: () => void;
  start(): void;
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

// Inlined copy of `quickPrompts` from answers.ts. The full answers module
// (57 KB) is lazy-loaded after mount; inlining 6 strings avoids pulling
// the whole matcher into the initial page load just for the prompt chips.
const QUICK_PROMPTS = [
  "Are you open?",
  "Can you fix a flat?",
  "Book an appointment",
  "Save your number",
  "Do you do NJ inspection?",
  "Do you take cards?",
];

// Message ids and emote ids are just "newer than the last one" — Date.now is
// fine, but it must live in module helpers so the purity rule doesn't see an
// impure call in the component body.
function nextId(): number {
  return Date.now();
}
function nextEmote(kind: NonNullable<TirePalEmote>["kind"]): TirePalEmote {
  return { kind, id: Date.now() };
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
  // A bubble that was trimmed for fit remembers its expanded state locally
  // so the read-more chip can toggle without re-running the brain.
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
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

  // Escape closes the panel and returns focus to the FAB.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  function markGreeted() {
    localStorage.setItem(GREETING_KEY, "1");
    setNudgeVisible(false);
  }

  function openPanel() {
    markGreeted();
    setSceneMounted(true);
    setOpen(true);
    if (messages.length === 0) {
      void getAnswers().then(({ treadGreeting }) => {
        setMessages((m) => [...m, { id: nextId(), role: "tread", text: treadGreeting() }]);
      });
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { id: nextId(), role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    setEmote(nextEmote("thinking"));
    const delay = reducedMotion ? 0 : 450;
    window.setTimeout(() => {
      void getAnswers().then(({ answerQuestion }) => {
        const answer = answerQuestion(trimmed);
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
        setThinking(false);
        if (answer.fallback) {
          setEmote(nextEmote("sleep"));
        } else if (answer.chips.some((c) => c.kind === "download")) {
          setEmote(nextEmote("happy"));
        }
      });
    }, delay);
  }

  /** Speech-to-text capture for the input. Returns true if it started, so the
   *  caller can show a recording indicator. Web Speech is browser-native —
   *  no network, no model, no bundle weight — so the mic button costs
   *  nothing for visitors whose browser exposes the API. */
  function startListening() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return false;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) setInput((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onend = () => setEmote(null);
    setEmote(nextEmote("thinking"));
    recognition.start();
    return true;
  }

  function onChipClick(chip: ChatChip) {
    if (chip.kind === "download") setEmote(nextEmote("celebrate"));
  }

  return (
    <>
      {nudgeVisible && (
        <div className="tread-nudge" role="status">
          <p>Need a hand? Ask Tread — I know hours, services and directions.</p>
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
        <section className="tread-panel" aria-label="Chat with Tread">
          <header className="tread-panel-head">
            <div className="tread-scene" role="img" aria-label="Tread, the shop tire">
              {sceneFailed ? (
                <TirePalFace className="tread-scene-fallback" />
              ) : (
                sceneMounted && (
                  <TirePalScene
                    emote={emote}
                    reducedMotion={reducedMotion}
                    onFail={() => setSceneFailed(true)}
                    className="tread-scene-canvas"
                  />
                )
              )}
            </div>
            <div className="tread-panel-title">
              <strong>Tread</strong>
              <span>Local answers · no data leaves your device</span>
            </div>
            <button
              type="button"
              className="tread-close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="tread-log" role="log" aria-live="polite" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tread-msg tread-msg-${m.role}`}>
                {m.role === "tread" && <TirePalFace className="tread-msg-avatar" />}
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
                          className="tread-chip"
                          {...(chip.kind === "download" ? { download: true } : {})}
                          {...(chip.kind === "directions"
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                          onClick={() => onChipClick(chip)}
                        >
                          {chip.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="tread-msg tread-msg-tread">
                <TirePalFace className="tread-msg-avatar" />
                <div className="tread-bubble tread-thinking">
                  <span className="sr-only">Tread is thinking…</span>
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
              onChange={(event) => setInput(event.target.value)}
              aria-label="Ask Tread a question"
              placeholder="Ask Tread a question…"
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
        className="tread-fab"
        aria-label="Chat with Tread, the shop tire"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <TirePalFace className="tread-fab-face" />
      </button>
    </>
  );
}
