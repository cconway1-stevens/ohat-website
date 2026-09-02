"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { answerQuestion, quickPrompts, treadGreeting, type ChatChip } from "@/lib/chat/answers";
import type { TirePalEmote } from "./tire-pal-scene";

/**
 * Tread — the contact-page chat widget. A fixed bottom-right FAB with a cute
 * tire face that opens a fully local Q&A panel. The 3D scene rides in its own
 * chunk (Three.js is heavy) and is only mounted after the panel has been opened
 * once, so the initial page load never pays for it.
 */

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

type Message = {
  id: number;
  role: "tread" | "user";
  text: string;
  chips?: ChatChip[];
};

const GREETING_KEY = "ohat-tread-greeted";

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
      setMessages((m) => [...m, { id: nextId(), role: "tread", text: treadGreeting() }]);
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
      const answer = answerQuestion(trimmed);
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "tread", text: answer.text, chips: answer.chips },
      ]);
      setThinking(false);
      if (answer.fallback) {
        setEmote(nextEmote("sleep"));
      } else if (answer.chips.some((c) => c.kind === "download")) {
        setEmote(nextEmote("happy"));
      }
    }, delay);
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
            <div className="tread-scene">
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
                  <p>{m.text}</p>
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
            {quickPrompts.map((prompt) => (
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
