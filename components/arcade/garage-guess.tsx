"use client";

import { useCallback, useEffect, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { arcadePresets, garageGuessClues, garageGuessWords } from "@/lib/arcade";
import { PrizeBanner } from "./prize";

const CONFIG = arcadePresets.garageGuess;
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
type LetterState = "correct" | "present" | "absent";

function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(CONFIG.wordLength).fill("absent");
  const remaining = answer.split("");

  for (let index = 0; index < guess.length; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
      remaining[index] = "";
    }
  }
  for (let index = 0; index < guess.length; index += 1) {
    if (result[index] === "correct") continue;
    const match = remaining.indexOf(guess[index]);
    if (match >= 0) {
      result[index] = "present";
      remaining[match] = "";
    }
  }
  return result;
}

function chooseWord(previous = "") {
  const options = garageGuessWords.filter((word) => word !== previous);
  return options[Math.floor(Math.random() * options.length)] ?? garageGuessWords[0];
}

export function GarageGuess() {
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState("Pick a word from the shop word bank.");
  const [sound, setSound] = useState(true);
  const [showClue, setShowClue] = useState(false);
  // Gave up and asked to see the word. Ends the round without the coupon.
  const [gaveUp, setGaveUp] = useState(false);
  const won = answer.length > 0 && guesses.at(-1) === answer;
  const over = won || gaveUp || (answer.length > 0 && guesses.length === CONFIG.maxGuesses);

  function start() {
    const next = chooseWord(answer);
    setAnswer(next);
    setDraft("");
    setGuesses([]);
    setShowClue(false);
    setGaveUp(false);
    setMessage("Six tries. Green is exact; yellow is elsewhere in the word.");
    if (sound) garageAudio.ignition();
  }

  function revealWord() {
    if (!answer || over) return;
    setGaveUp(true);
    setShowClue(true);
    setDraft("");
    setMessage(`The word was ${answer}. Start a new one to play for the coupon.`);
    if (sound) garageAudio.skid();
  }

  const submit = useCallback(() => {
    if (!answer || over) return;
    if (draft.length !== CONFIG.wordLength) {
      setMessage(`Use all ${CONFIG.wordLength} letters before checking.`);
      if (sound) garageAudio.skid();
      return;
    }
    if (!garageGuessWords.includes(draft)) {
      setMessage("Try a five-letter shop word from the garage word bank.");
      if (sound) garageAudio.skid();
      return;
    }
    const nextGuesses = [...guesses, draft];
    setGuesses(nextGuesses);
    setDraft("");
    if (draft === answer) {
      setMessage("Road ready. You found the shop word.");
      if (sound) garageAudio.fanfare();
    } else if (nextGuesses.length === CONFIG.maxGuesses) {
      setMessage(`Shift over. The word was ${answer}.`);
      if (sound) garageAudio.skid();
    } else {
      setMessage(`${CONFIG.maxGuesses - nextGuesses.length} tries left.`);
      if (sound) garageAudio.horn();
    }
  }, [answer, draft, guesses, over, sound]);

  const press = useCallback((key: string) => {
    if (!answer || over) return;
    if (key === "ENTER") {
      submit();
      return;
    }
    if (key === "BACKSPACE") {
      setDraft((value) => value.slice(0, -1));
      return;
    }
    if (/^[A-Z]$/.test(key) && draft.length < CONFIG.wordLength) {
      setDraft((value) => value + key);
    }
  }, [answer, draft.length, over, submit]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!answer || over) return;
      const key = event.key === "Enter" ? "ENTER" : event.key === "Backspace" ? "BACKSPACE" : event.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        event.preventDefault();
        press(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, over, press]);

  const letterStates = guesses.reduce<Record<string, LetterState>>((states, guess) => {
    scoreGuess(guess, answer).forEach((state, index) => {
      const letter = guess[index];
      const current = states[letter];
      if (!current || state === "correct" || (state === "present" && current === "absent")) states[letter] = state;
    });
    return states;
  }, {});

  if (!answer) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
        <h2>Garage Guess</h2>
        <p>Find a five-letter automotive word from the shop word bank. Every answer is fair game in the garage.</p>
        <button type="button" className="button button-primary" onClick={start}>Start a word</button>
      </div>
    );
  }

  return (
    <div className="paper-game garage-guess-game">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2>Garage Guess</h2>
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>{sound ? "Sound on" : "Sound off"}</button>
          <button type="button" onClick={start}>New word</button>
        </div>
      </header>
      <p className="match-game-status" role="status">{message}</p>
      {/* Hidden until asked for, so it never spoils the puzzle by accident. */}
      <p className="garage-guess-clue">
        {showClue ? (
          <span><b>Clue:</b> {garageGuessClues[answer]}</span>
        ) : (
          <button type="button" onClick={() => { setShowClue(true); if (sound) garageAudio.beep(300); }}>
            Need a clue?
          </button>
        )}
      </p>
      <div className="garage-guess-grid" aria-label="Five-letter garage word puzzle">
        {Array.from({ length: CONFIG.maxGuesses }, (_, row) => {
          const guess = guesses[row] ?? (row === guesses.length && !over ? draft : "");
          const states = guesses[row] ? scoreGuess(guesses[row], answer) : [];
          return (
            <div className="garage-guess-row" key={row}>
              {Array.from({ length: CONFIG.wordLength }, (_, column) => (
                <span key={column} className={states[column] ? `is-${states[column]}` : ""}>
                  {guess[column] ?? ""}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div className="garage-guess-keys" aria-label="Garage Guess keyboard">
        {KEY_ROWS.map((row) => (
          <div key={row}>
            {row.split("").map((letter) => (
              <button key={letter} type="button" className={letterStates[letter] ? `is-${letterStates[letter]}` : ""} onClick={() => press(letter)}>{letter}</button>
            ))}
          </div>
        ))}
        <div>
          <button type="button" className="is-wide" onClick={() => press("ENTER")}>Enter</button>
          <button type="button" className="is-wide" onClick={() => press("BACKSPACE")}>Delete</button>
        </div>
      </div>
      <div className="paper-game-actions">
        <button type="button" onClick={revealWord} disabled={over}>
          Show me the word
        </button>
      </div>
      {won ? <PrizeBanner sound={sound} achievement="Garage Guess solved in six tries or less." /> : null}
    </div>
  );
}
