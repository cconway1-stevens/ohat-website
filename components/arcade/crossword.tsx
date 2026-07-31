"use client";

import { type CSSProperties, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { arcadePresets } from "@/lib/arcade";
import { PrizeBanner } from "./prize";

type Direction = "across" | "down";
type ClueWord = { answer: string; clue: string };
type WorkingEntry = ClueWord & { row: number; col: number; direction: Direction };
type PuzzleEntry = WorkingEntry & {
  id: string;
  number: number;
  cells: string[];
};
type PuzzleCell = { letter: string; number?: number; entries: string[] };
type CrosswordPuzzle = {
  rows: number;
  cols: number;
  cells: Record<string, PuzzleCell>;
  entries: PuzzleEntry[];
};

const CONFIG = arcadePresets.crossword;
const CLUE_BANK: ClueWord[] = [
  { answer: "ALIGN", clue: "Make all four wheels point true" },
  { answer: "AXLE", clue: "Shaft that helps the wheels turn" },
  { answer: "BATTERY", clue: "It supplies power before the engine starts" },
  { answer: "BELT", clue: "Rubber loop under the hood" },
  { answer: "BRAKE", clue: "Pedal system that brings the car to a stop" },
  { answer: "CLUTCH", clue: "Manual-transmission pedal" },
  { answer: "COUPE", clue: "Two-door body style" },
  { answer: "DIESEL", clue: "Fuel used by many work trucks" },
  { answer: "ENGINE", clue: "The car's main power plant" },
  { answer: "FILTER", clue: "It traps dirt in oil or air" },
  { answer: "FUEL", clue: "What keeps a combustion engine going" },
  { answer: "GARAGE", clue: "Where the repair work happens" },
  { answer: "GEAR", clue: "One ratio in a transmission" },
  { answer: "HOOD", clue: "Panel raised to reach the engine" },
  { answer: "HYBRID", clue: "Vehicle with electric and gas power" },
  { answer: "JACK", clue: "Tool used to lift a vehicle" },
  { answer: "LIGHT", clue: "Headlamp, for short" },
  { answer: "MIRROR", clue: "Helps a driver see behind" },
  { answer: "MUFFLER", clue: "It quiets the exhaust" },
  { answer: "OIL", clue: "Engine lubricant checked with a dipstick" },
  { answer: "PISTON", clue: "It moves up and down inside a cylinder" },
  { answer: "PLUG", clue: "Spark ___" },
  { answer: "RADIATOR", clue: "It helps keep the engine cool" },
  { answer: "RIM", clue: "Metal center of a wheel" },
  { answer: "ROAD", clue: "Where the rubber meets the route" },
  { answer: "ROTOR", clue: "Disc squeezed by a brake caliper" },
  { answer: "SEDAN", clue: "Common four-door body style" },
  { answer: "SIGNAL", clue: "Blinker or traffic light" },
  { answer: "SPARK", clue: "Tiny flash that ignites fuel" },
  { answer: "TIRE", clue: "Rubber ring around a wheel" },
  { answer: "TOW", clue: "Pull a disabled vehicle" },
  { answer: "TRUNK", clue: "Rear cargo compartment" },
  { answer: "WHEEL", clue: "Round part that carries the tire" },
  { answer: "WIPER", clue: "It clears rain from the windshield" },
  { answer: "ABS", clue: "System that prevents wheel lock during hard braking" },
  { answer: "AIRBAG", clue: "Inflatable cabin safety cushion" },
  { answer: "ALTERNATOR", clue: "It charges the battery while the engine runs" },
  { answer: "ANTIFREEZE", clue: "Cold-weather ingredient in engine coolant" },
  { answer: "BEARING", clue: "It lets a rotating part move with less friction" },
  { answer: "BOOSTER", clue: "Brake part that multiplies pedal force" },
  { answer: "BUMPER", clue: "Impact-absorbing bar at either end of a car" },
  { answer: "CALIPER", clue: "It squeezes brake pads against a rotor" },
  { answer: "CAMSHAFT", clue: "Shaft that opens and closes engine valves" },
  { answer: "CARBURETOR", clue: "Classic device that mixes fuel and air" },
  { answer: "CHASSIS", clue: "Vehicle's supporting frame and structure" },
  { answer: "COOLANT", clue: "Fluid that carries heat away from the engine" },
  { answer: "CRANKSHAFT", clue: "It turns piston motion into rotation" },
  { answer: "CYLINDER", clue: "Engine chamber where a piston travels" },
  { answer: "DASHBOARD", clue: "Panel holding gauges and controls" },
  { answer: "DEFROSTER", clue: "It clears condensation or ice from glass" },
  { answer: "DIFFERENTIAL", clue: "Gearset that lets drive wheels turn at different speeds" },
  { answer: "DIPSTICK", clue: "Rod used to check an engine's oil level" },
  { answer: "DRIVESHAFT", clue: "It carries rotation toward the driven wheels" },
  { answer: "EXHAUST", clue: "System that routes spent gases away" },
  { answer: "FENDER", clue: "Body panel that arches over a wheel" },
  { answer: "FLYWHEEL", clue: "Heavy rotating disc that smooths engine power" },
  { answer: "FOGLAMP", clue: "Low-mounted light for poor visibility" },
  { answer: "FUSE", clue: "Small electrical protector designed to blow" },
  { answer: "GASKET", clue: "Seal placed between two joined surfaces" },
  { answer: "GRILLE", clue: "Front opening that admits cooling air" },
  { answer: "HEADLIGHT", clue: "Forward lamp used after dark" },
  { answer: "IGNITION", clue: "System that starts combustion" },
  { answer: "INJECTOR", clue: "It sprays a measured amount of fuel" },
  { answer: "MANIFOLD", clue: "Engine passage that gathers or distributes flow" },
  { answer: "ODOMETER", clue: "Gauge that records total distance traveled" },
  { answer: "PARKINGBRAKE", clue: "Brake used to hold a stopped vehicle in place" },
  { answer: "RACK", clue: "Toothed bar in a common steering system" },
  { answer: "RELAY", clue: "Electrically controlled switch" },
  { answer: "RESERVOIR", clue: "Container that holds operating fluid" },
  { answer: "SHOCK", clue: "Suspension damper, for short" },
  { answer: "SPARE", clue: "Backup tire carried for emergencies" },
  { answer: "SPEEDOMETER", clue: "Gauge that shows road speed" },
  { answer: "STARTER", clue: "Electric motor that cranks the engine" },
  { answer: "STRUT", clue: "Structural suspension damper" },
  { answer: "SUSPENSION", clue: "Springs and links between body and wheels" },
  { answer: "TAILPIPE", clue: "Visible outlet at the end of the exhaust" },
  { answer: "THERMOSTAT", clue: "Valve that regulates coolant flow" },
  { answer: "TRANSMISSION", clue: "It selects ratios between engine and wheels" },
  { answer: "TURBO", clue: "Exhaust-driven device that forces in more air" },
  { answer: "VALVE", clue: "It controls flow into or out of a cylinder" },
  { answer: "WINDSHIELD", clue: "Front glass that shields vehicle occupants" },
  { answer: "ALIGNMENT", clue: "Adjustment of wheel angles" },
  { answer: "BALANCE", clue: "Wheel service that prevents speed-related vibration" },
  { answer: "TREAD", clue: "Patterned surface that meets the road" },
  { answer: "SIDEWALL", clue: "Outer side surface of a tire" },
  { answer: "LUGNUT", clue: "Fastener that secures a wheel" },
  { answer: "HUBCAP", clue: "Decorative cover over a wheel center" },
  { answer: "WHEELBASE", clue: "Distance between front and rear axles" },
  { answer: "TRACTION", clue: "Grip between tires and the road" },
  { answer: "TORQUE", clue: "Twisting force produced by an engine or motor" },
  { answer: "HORSEPOWER", clue: "Common measure of vehicle power" },
  { answer: "MILEAGE", clue: "Distance traveled or fuel economy" },
  { answer: "OCTANE", clue: "Gasoline's resistance-to-knock rating" },
  { answer: "UNLEADED", clue: "Gasoline type without added lead" },
  { answer: "ETHANOL", clue: "Alcohol commonly blended into gasoline" },
  { answer: "CATALYST", clue: "Material that speeds an emissions-cleaning reaction" },
  { answer: "CONVERTER", clue: "Catalytic ___ in the exhaust system" },
  { answer: "EMISSIONS", clue: "Gases monitored during an environmental test" },
  { answer: "SILENCER", clue: "Another name for a muffler" },
  { answer: "SENSOR", clue: "Electronic part that measures a condition" },
  { answer: "COMPUTER", clue: "Module that manages vehicle systems" },
  { answer: "MODULE", clue: "Self-contained electronic control unit" },
  { answer: "WIRING", clue: "Network of conductors behind the electrical system" },
  { answer: "CIRCUIT", clue: "Complete path followed by electrical current" },
  { answer: "VOLTAGE", clue: "Electrical potential measured in volts" },
  { answer: "TERMINAL", clue: "Battery connection point" },
  { answer: "CHARGER", clue: "Device that replenishes a battery" },
  { answer: "ELECTRIC", clue: "Powered solely by a battery and motor" },
  { answer: "REGENERATIVE", clue: "Braking that returns energy to a battery" },
  { answer: "MOTOR", clue: "Electric machine that can drive the wheels" },
  { answer: "INVERTER", clue: "EV device that converts battery current for the motor" },
  { answer: "CHARGING", clue: "Adding electrical energy to a battery" },
  { answer: "RANGE", clue: "Distance a vehicle can travel before refueling or charging" },
  { answer: "HATCHBACK", clue: "Body style with a rear door that lifts upward" },
  { answer: "PICKUP", clue: "Truck with an open cargo bed" },
  { answer: "MINIVAN", clue: "Family vehicle known for sliding side doors" },
  { answer: "CROSSOVER", clue: "Car-based utility vehicle" },
  { answer: "ROADSTER", clue: "Sporty open-top two-seater" },
  { answer: "CONVERTIBLE", clue: "Car with a roof that folds or retracts" },
  { answer: "WAGON", clue: "Long-roof car with rear cargo space" },
  { answer: "SUV", clue: "Three-letter utility vehicle category" },
  { answer: "TRAILER", clue: "Unpowered load carrier pulled by a vehicle" },
  { answer: "HITCH", clue: "Connection point for towing a trailer" },
  { answer: "WINCH", clue: "Cable-winding device used for recovery" },
  { answer: "TAILGATE", clue: "Hinged rear panel of a pickup bed" },
  { answer: "SUNROOF", clue: "Movable glass or metal panel above the cabin" },
  { answer: "CONSOLE", clue: "Cabin storage and controls between front seats" },
  { answer: "HEADREST", clue: "Seat support behind an occupant's head" },
  { answer: "SEATBELT", clue: "Strap that restrains an occupant" },
  { answer: "ARMREST", clue: "Padded cabin support beside a seat" },
  { answer: "HORN", clue: "Driver-operated audible warning" },
  { answer: "PEDAL", clue: "Foot-operated vehicle control" },
  { answer: "SHIFTER", clue: "Control used to select a transmission position" },
  { answer: "NEUTRAL", clue: "Gear position that disconnects driving force" },
];

const keyFor = (row: number, col: number) => `${row},${col}`;

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function cellsFor(entry: WorkingEntry) {
  return Array.from({ length: entry.answer.length }, (_, index) => ({
    row: entry.row + (entry.direction === "down" ? index : 0),
    col: entry.col + (entry.direction === "across" ? index : 0),
  }));
}

function createCrossword(): CrosswordPuzzle {
  let best: WorkingEntry[] = [];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const words = shuffled(CLUE_BANK);
    const entries: WorkingEntry[] = [
      { ...words[0], row: 0, col: 0, direction: "across" },
    ];
    const letters = new Map<string, string>();
    const directions = new Map<string, Set<Direction>>();

    const addEntry = (entry: WorkingEntry) => {
      cellsFor(entry).forEach(({ row, col }, index) => {
        const key = keyFor(row, col);
        letters.set(key, entry.answer[index]);
        const used = directions.get(key) ?? new Set<Direction>();
        used.add(entry.direction);
        directions.set(key, used);
      });
    };
    addEntry(entries[0]);

    for (const word of words.slice(1)) {
      if (entries.length >= CONFIG.wordsPerPuzzle) break;
      const options: WorkingEntry[] = [];

      for (const [cellKey, existingLetter] of letters) {
        const [crossRow, crossCol] = cellKey.split(",").map(Number);
        for (let letterIndex = 0; letterIndex < word.answer.length; letterIndex += 1) {
          if (word.answer[letterIndex] !== existingLetter) continue;
          for (const direction of shuffled<Direction>(["across", "down"])) {
            const row = crossRow - (direction === "down" ? letterIndex : 0);
            const col = crossCol - (direction === "across" ? letterIndex : 0);
            const candidate: WorkingEntry = { ...word, row, col, direction };
            const positions = cellsFor(candidate);
            const before = direction === "across"
              ? keyFor(row, col - 1)
              : keyFor(row - 1, col);
            const after = direction === "across"
              ? keyFor(row, col + word.answer.length)
              : keyFor(row + word.answer.length, col);
            if (letters.has(before) || letters.has(after)) continue;

            let crossings = 0;
            let valid = true;
            for (let index = 0; index < positions.length; index += 1) {
              const position = positions[index];
              const key = keyFor(position.row, position.col);
              const existing = letters.get(key);
              if (existing) {
                if (
                  existing !== word.answer[index] ||
                  directions.get(key)?.has(direction)
                ) {
                  valid = false;
                  break;
                }
                crossings += 1;
              } else {
                const neighbors = direction === "across"
                  ? [keyFor(position.row - 1, position.col), keyFor(position.row + 1, position.col)]
                  : [keyFor(position.row, position.col - 1), keyFor(position.row, position.col + 1)];
                if (neighbors.some((neighbor) => letters.has(neighbor))) {
                  valid = false;
                  break;
                }
              }
            }
            if (!valid || crossings === 0) continue;

            const allPositions = [
              ...[...letters.keys()].map((key) => {
                const [cellRow, cellCol] = key.split(",").map(Number);
                return { row: cellRow, col: cellCol };
              }),
              ...positions,
            ];
            const rows = allPositions.map((position) => position.row);
            const cols = allPositions.map((position) => position.col);
            if (
              Math.max(...rows) - Math.min(...rows) + 1 <= CONFIG.maxGrid &&
              Math.max(...cols) - Math.min(...cols) + 1 <= CONFIG.maxGrid
            ) {
              options.push(candidate);
            }
          }
        }
      }

      if (options.length > 0) {
        const choice = options[Math.floor(Math.random() * options.length)];
        entries.push(choice);
        addEntry(choice);
      }
    }

    if (entries.length > best.length) best = entries;
    if (entries.length >= CONFIG.wordsPerPuzzle) break;
  }

  const occupied = best.flatMap(cellsFor);
  const minRow = Math.min(...occupied.map((cell) => cell.row));
  const minCol = Math.min(...occupied.map((cell) => cell.col));
  const normalized = best
    .map((entry) => ({ ...entry, row: entry.row - minRow, col: entry.col - minCol }))
    .sort((a, b) => a.row - b.row || a.col - b.col || a.direction.localeCompare(b.direction));
  const starts = new Map<string, number>();
  let clueNumber = 0;
  normalized.forEach((entry) => {
    const key = keyFor(entry.row, entry.col);
    if (!starts.has(key)) starts.set(key, ++clueNumber);
  });

  const cells: Record<string, PuzzleCell> = {};
  const entries = normalized.map((entry, index): PuzzleEntry => {
    const id = `${entry.direction}-${index}`;
    const entryCells = cellsFor(entry).map((cell) => keyFor(cell.row, cell.col));
    entryCells.forEach((key, letterIndex) => {
      cells[key] ??= {
        letter: entry.answer[letterIndex],
        number: starts.get(key),
        entries: [],
      };
      cells[key].entries.push(id);
    });
    return { ...entry, id, number: starts.get(keyFor(entry.row, entry.col))!, cells: entryCells };
  });
  const positions = Object.keys(cells).map((key) => key.split(",").map(Number));

  return {
    rows: Math.max(...positions.map(([row]) => row)) + 1,
    cols: Math.max(...positions.map(([, col]) => col)) + 1,
    cells,
    entries,
  };
}

export function GarageCrossword() {
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("");
  const [checked, setChecked] = useState(false);
  const [sound, setSound] = useState(true);

  const activeEntry = puzzle?.entries.find((entry) => entry.id === activeId);
  const solved = Boolean(
    puzzle && Object.entries(puzzle.cells).every(([key, cell]) => answers[key] === cell.letter),
  );

  function startPuzzle() {
    const next = createCrossword();
    setPuzzle(next);
    setAnswers({});
    setActiveId(next.entries[0]?.id ?? "");
    setChecked(false);
    if (sound) garageAudio.ignition();
  }

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
        <p>A fresh set of shop clues is assembled every time you open the paper.</p>
        <button type="button" className="button button-primary" onClick={startPuzzle}>
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
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={startPuzzle}>New puzzle</button>
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

      {solved ? <PrizeBanner achievement="Garage crossword solved from bumper to bumper." /> : null}
    </div>
  );
}
