"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tetris, useTetris } from "tetris-kit";
import { arcadePresets } from "@/lib/arcade";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";

const CONFIG = arcadePresets.treadStack;
const BEST_KEY = "ohat-tread-stack-best";

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function TreadStackRun({
  stopped,
  onLines,
  onRunEnd,
}: {
  stopped: boolean;
  onLines: (lines: number) => void;
  onRunEnd: (lines: number) => void;
}) {
  const { cells = [], cleared = 0, dispatch, queue = [] } = useTetris();
  const previous = useRef({ cleared: 0, filled: 0 });
  const filled = cells.length;

  useEffect(() => {
    const last = previous.current;
    const engineRestarted = last.cleared > cleared || (last.filled > 0 && filled === 0 && cleared === 0);
    if (engineRestarted) onRunEnd(last.cleared);
    else onLines(cleared);
    previous.current = { cleared, filled };
  }, [cleared, filled, onLines, onRunEnd]);

  return (
    <>
      {!stopped ? <Tetris.Input /> : null}
      {!stopped ? <Tetris.Tick /> : null}
      <div className="tread-stack-stage">
        <div className="tread-stack-rack" role="img" aria-label="Tire stacking game board">
          <Tetris.Playground className="tread-stack-board">
            <Tetris.Background />
            <Tetris.Blocks />
            <Tetris.Ghost />
            <Tetris.Active />
          </Tetris.Playground>
        </div>
        <aside className="tread-stack-dash">
          <span>Next load</span>
          <strong>{queue[0]?.toUpperCase() ?? "-"}</strong>
          <small>Clear full tire rows</small>
        </aside>
      </div>
      <div className="tread-stack-controls" aria-label="Tread Stack controls">
        <button type="button" onClick={() => dispatch({ type: "LEFT" })} aria-label="Move left" title="Move left">←</button>
        <button type="button" onClick={() => dispatch({ type: "ROTATE" })} aria-label="Rotate tire load" title="Rotate">↻</button>
        <button type="button" onClick={() => dispatch({ type: "RIGHT" })} aria-label="Move right" title="Move right">→</button>
        <button type="button" onClick={() => dispatch({ type: "DOWN" })} aria-label="Move down" title="Move down">↓</button>
        <button type="button" className="is-drop" onClick={() => dispatch({ type: "DROP" })}>Drop</button>
      </div>
    </>
  );
}

export function TreadStack() {
  const [started, setStarted] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [qualified, setQualified] = useState(false);
  const [sound, setSound] = useState(true);

  const updateLines = useCallback((nextLines: number) => {
    setLines(nextLines);
    setQualified(nextLines >= CONFIG.linesToWin);
  }, []);

  const finishRun = useCallback((finalLines: number) => {
    setLines(finalLines);
    setOver(true);
    setQualified(finalLines >= CONFIG.linesToWin);
    setBest((current) => {
      if (finalLines <= current) return current;
      try {
        window.localStorage.setItem(BEST_KEY, String(finalLines));
      } catch {
        // A private browser can still play without storing the best score.
      }
      return finalLines;
    });
    if (sound) garageAudio.skid();
  }, [sound]);

  function start() {
    setBest(readBest());
    setLines(0);
    setOver(false);
    setQualified(false);
    setRunKey((value) => value + 1);
    setStarted(true);
    if (sound) garageAudio.ignition();
  }

  if (!started) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">Ocean Heights Tire Warehouse</p>
        <h2>Tread Stack</h2>
        <p>Turn and stack the incoming tire loads. Clear {CONFIG.linesToWin} complete rows to qualify, then keep the rack open until it tops out.</p>
        <button type="button" className="button button-primary" onClick={start}>Open the tire rack</button>
      </div>
    );
  }

  return (
    <div className="tread-stack-game">
      <div className="match-game-bar">
        <dl className="match-game-score">
          <div><dt>Rows cleared</dt><dd>{lines}</dd></div>
          <div><dt>Best</dt><dd>{best}</dd></div>
          <div><dt>Prize at</dt><dd>{CONFIG.linesToWin}</dd></div>
        </dl>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>{sound ? "Sound on" : "Sound off"}</button>
          {over ? <button type="button" onClick={start}>New shift</button> : null}
        </div>
      </div>
      <p className="match-game-status" role="status">
        {over
          ? `Rack full. You cleared ${lines} row${lines === 1 ? "" : "s"}.`
          : qualified
            ? "Prize earned - keep stacking. We'll show it when the rack tops out."
            : `${CONFIG.linesToWin - lines} more row${CONFIG.linesToWin - lines === 1 ? "" : "s"} to qualify.`}
      </p>
      <Tetris.Provider key={runKey} playground={{ rows: CONFIG.rows, columns: CONFIG.columns }}>
        <TreadStackRun stopped={over} onLines={updateLines} onRunEnd={finishRun} />
      </Tetris.Provider>
      {qualified && over ? <PrizeBanner achievement={`${CONFIG.linesToWin} tire rows cleared in Tread Stack.`} /> : null}
      <p className="tread-stack-keys">Keyboard: arrows to move and rotate, space to drop.</p>
    </div>
  );
}
