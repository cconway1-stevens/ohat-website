"use client";

import { type CSSProperties, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { arcadePresets } from "@/lib/arcade";
import {
  createCrossword,
  type CrosswordPuzzle,
  type Difficulty,
  keyFor,
} from "@/lib/crossword";
import { PrizeBanner } from "./prize";

const CONFIG = arcadePresets.crossword;

export function GarageCrossword() {
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(CONFIG.defaultDifficulty);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("");
  const [checked, setChecked] = useState(false);
  const [sound, setSound] = useState(true);

  const activeEntry = puzzle?.entries.find((entry) => entry.id === activeId);
  const solved = Boolean(
    puzzle && Object.entries(puzzle.cells).every(([key, cell]) => answers[key] === cell.letter),
  );

  function startPuzzle(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    const next = createCrossword(nextDifficulty);
    setPuzzle(next);
    setAnswers({});
    setActiveId(next.entries[0]?.id ?? "");
    setChecked(false);
    if (sound) garageAudio.ignition();
  }

  const difficultyControls = (
    <div className="paper-game-difficulty" aria-label="Crossword difficulty">
      {(Object.keys(CONFIG.difficulties) as Difficulty[]).map((level) => (
        <button
          key={level}
          type="button"
          className={difficulty === level ? "is-active" : ""}
          aria-pressed={difficulty === level}
          onClick={() => puzzle ? startPuzzle(level) : setDifficulty(level)}
        >
          {CONFIG.difficulties[level].label}
        </button>
      ))}
    </div>
  );

  function focusCell(key: string) {
    document.querySelector<HTMLInputElement>(`[data-crossword-cell="${key}"]`)?.focus();
  }

  function moveInEntry(key: string, amount: number) {
    if (!activeEntry) return;
    const index = activeEntry.cells.indexOf(key);
    const next = activeEntry.cells[index + amount];
    if (next) focusCell(next);
  }

  function selectCell(key: string) {
    if (!puzzle) return;
    const entryIds = puzzle.cells[key].entries;
    if (!entryIds.includes(activeId)) setActiveId(entryIds[0]);
    else if (entryIds.length > 1) {
      setActiveId(entryIds[(entryIds.indexOf(activeId) + 1) % entryIds.length]);
    }
  }

  if (!puzzle) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
        <h2>Garage crossword</h2>
        <p>Choose a difficulty, then open a fresh set of shop clues.</p>
        {difficultyControls}
        <button type="button" className="button button-primary" onClick={() => startPuzzle()}>
          Open the puzzle
        </button>
      </div>
    );
  }

  return (
    <div className="paper-game crossword-game">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2>Garage crossword</h2>
          {difficultyControls}
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={() => startPuzzle()}>New puzzle</button>
        </div>
      </header>

      <p className="match-game-status" role="status">
        {solved
          ? "Puzzle complete. Every answer is road ready."
          : checked
            ? "Red letters need another look."
            : `${puzzle.entries.length} clues. Tap a square or clue to begin.`}
      </p>

      <div className="crossword-layout">
        <div
          className="crossword-grid"
          style={{
            "--crossword-cols": puzzle.cols,
            "--crossword-rows": puzzle.rows,
          } as CSSProperties}
          aria-label="Automotive crossword puzzle"
        >
          {Array.from({ length: puzzle.rows * puzzle.cols }, (_, index) => {
            const row = Math.floor(index / puzzle.cols);
            const col = index % puzzle.cols;
            const key = keyFor(row, col);
            const cell = puzzle.cells[key];
            if (!cell) return <span key={key} className="crossword-block" aria-hidden="true" />;
            const wrong = checked && answers[key] !== cell.letter;
            const active = activeEntry?.cells.includes(key);
            return (
              <label
                key={key}
                className={`crossword-cell${active ? " is-active" : ""}${wrong ? " is-wrong" : ""}`}
              >
                {cell.number ? <span>{cell.number}</span> : null}
                <input
                  data-crossword-cell={key}
                  value={answers[key] ?? ""}
                  maxLength={1}
                  inputMode="text"
                  autoCapitalize="characters"
                  aria-label={`Crossword square${cell.number ? ` ${cell.number}` : ""}`}
                  onClick={() => selectCell(key)}
                  onFocus={() => {
                    if (!cell.entries.includes(activeId)) setActiveId(cell.entries[0]);
                  }}
                  onChange={(event) => {
                    const letter = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
                    setAnswers((current) => ({ ...current, [key]: letter }));
                    setChecked(false);
                    if (letter) {
                      if (sound) garageAudio.beep(420);
                      window.setTimeout(() => moveInEntry(key, 1), 0);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !answers[key]) moveInEntry(key, -1);
                    if (event.key === "ArrowLeft") focusCell(keyFor(row, col - 1));
                    if (event.key === "ArrowRight") focusCell(keyFor(row, col + 1));
                    if (event.key === "ArrowUp") focusCell(keyFor(row - 1, col));
                    if (event.key === "ArrowDown") focusCell(keyFor(row + 1, col));
                  }}
                />
              </label>
            );
          })}
        </div>

        <div className="crossword-clues">
          {(["across", "down"] as const).map((direction) => (
            <section key={direction}>
              <h3>{direction}</h3>
              <ol>
                {puzzle.entries.filter((entry) => entry.direction === direction).map((entry) => (
                  <li key={entry.id} value={entry.number}>
                    <button
                      type="button"
                      className={entry.id === activeId ? "is-active" : ""}
                      onClick={() => {
                        setActiveId(entry.id);
                        focusCell(entry.cells.find((key) => !answers[key]) ?? entry.cells[0]);
                      }}
                    >
                      <b>{entry.number}.</b> {entry.clue}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <div className="paper-game-actions">
        <button
          type="button"
          onClick={() => {
            if (!activeEntry) return;
            const hintKey = activeEntry.cells.find((key) => !answers[key] || answers[key] !== puzzle.cells[key].letter);
            if (!hintKey) return;
            setAnswers((current) => ({ ...current, [hintKey]: puzzle.cells[hintKey].letter }));
            setChecked(false);
            if (sound) garageAudio.horn();
          }}
        >
          Reveal one letter
        </button>
        <button type="button" onClick={() => setChecked(true)}>Check answers</button>
      </div>

      {solved ? <PrizeBanner sound={sound} achievement="Garage crossword solved from bumper to bumper." /> : null}
    </div>
  );
}
