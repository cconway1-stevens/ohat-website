"use client";

import { useEffect, useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";

const W = 480;
const H = 240;

// Everything on the shelf behind the counter, with the way a customer would
// actually ask for it.
const STOCK = [
  { id: "wipers", label: "Wiper blades", ask: "a pair of wiper blades — the driver's side keeps skipping", tint: "#1a7183" },
  { id: "oilfilter", label: "Oil filter", ask: "an oil filter, the usual one for a four-cylinder", tint: "#a8161c" },
  { id: "battery", label: "Battery", ask: "a battery. It turned over twice this morning and that was it", tint: "#68a56f" },
  { id: "bulb", label: "Headlight bulb", ask: "a headlight bulb — low beam, passenger side", tint: "#f6bd38" },
  { id: "airfilter", label: "Air filter", ask: "an air filter while I'm here", tint: "#8fb7c4" },
  { id: "coolant", label: "Coolant", ask: "a jug of coolant, the green stuff", tint: "#e0555a" },
  { id: "plugs", label: "Spark plugs", ask: "a set of spark plugs", tint: "#cfc9b8" },
  { id: "fuses", label: "Fuse assortment", ask: "one of those little fuse assortments", tint: "#e49a42" },
];

const CUSTOMERS = ["A regular in a work jacket", "Somebody's dad", "A woman with a toddler on her hip", "A kid buying his first car part", "The landscaper from up the road", "A guy still in his fishing waders"];

/**
 * The Parts Counter — a small counter with a bell on the door. Somebody asks
 * for a part, you find it on the shelf and bag it. Picking the wrong box just
 * gets a polite correction; nothing is scored and nothing is lost.
 */
export function PartsCounter() {
  const [sound, setSound] = useState(false);
  // Deliberately not random on the first render: the server and the browser
  // must agree or React reports a hydration error. `shuffled` flips once, in
  // an event-free effect, and only then does the queue randomise.
  const [wanted, setWanted] = useState(0);
  const [customer, setCustomer] = useState(0);
  const [bagged, setBagged] = useState<string[]>([]);
  const [served, setServed] = useState(0);
  const [note, setNote] = useState("");
  const [atCounter, setAtCounter] = useState(true);

  const item = STOCK[wanted];

  useAmbience(sound, { fluorescent: 0.012, shopHum: 0.012, traffic: 0.006 });

  useEffect(() => {
    // Deferred a frame so it is a fresh render pass, not a cascading one.
    const id = window.setTimeout(() => {
      setWanted(Math.floor(Math.random() * STOCK.length));
      setCustomer(Math.floor(Math.random() * CUSTOMERS.length));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const canvasRef = useSceneCanvas((ctx, frame) => {
    // Fluorescent-lit back room.
    ctx.fillStyle = "#d9d2bd";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,235,.5)";
    ctx.fillRect(0, 0, W, 16);
    // The tubes buzz — a slight flicker every so often.
    if (frame % 220 < 3) {
      ctx.fillStyle = "rgba(60,60,50,.14)";
      ctx.fillRect(0, 0, W, H);
    }

    // Shelving, floor to counter, stacked with boxes.
    for (let shelf = 0; shelf < 3; shelf += 1) {
      const y = 30 + shelf * 46;
      ctx.fillStyle = "#8d8676";
      ctx.fillRect(16, y + 34, W - 32, 5);
      for (let box = 0; box < 8; box += 1) {
        const entry = STOCK[(shelf * 8 + box) % STOCK.length];
        const x = 22 + box * 56;
        const isWanted = entry.id === item.id;
        ctx.fillStyle = entry.tint;
        ctx.globalAlpha = isWanted ? 1 : 0.62;
        ctx.fillRect(x, y + 8, 44, 26);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(23,20,18,.6)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y + 8, 44, 26);
        ctx.fillStyle = "rgba(23,20,18,.55)";
        ctx.fillRect(x + 5, y + 14, 34, 3);
        ctx.fillRect(x + 5, y + 21, 22, 3);
      }
    }

    // Counter across the front.
    ctx.fillStyle = "#7a5c3a";
    ctx.fillRect(0, H - 62, W, 62);
    ctx.fillStyle = "#6a4e30";
    ctx.fillRect(0, H - 62, W, 7);

    // Paper bags already packed, lined up on the counter.
    bagged.slice(-5).forEach((id, index) => {
      const x = 20 + index * 52;
      const entry = STOCK.find((candidate) => candidate.id === id);
      ctx.fillStyle = "#c9a875";
      ctx.beginPath();
      ctx.roundRect(x, H - 52, 34, 40, [2, 2, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "rgba(120,92,58,.75)";
      ctx.fillRect(x, H - 52, 34, 6);
      ctx.fillStyle = entry?.tint ?? "#999";
      ctx.fillRect(x + 11, H - 40, 12, 8);
    });

    // Receipt printer and the little bell.
    ctx.fillStyle = "#2f2a25";
    ctx.fillRect(W - 92, H - 58, 54, 30);
    ctx.fillStyle = "#f7efd9";
    ctx.fillRect(W - 84, H - 58 - ((frame % 90) < 20 ? 14 : 0), 38, (frame % 90) < 20 ? 14 : 2);
    ctx.fillStyle = "#cfc9b8";
    ctx.beginPath();
    ctx.arc(W - 26, H - 44, 11, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8d8676";
    ctx.fillRect(W - 37, H - 44, 22, 4);

    // The customer, waiting on the other side.
    if (atCounter) {
      const bob = Math.sin(frame / 60) * 1.6;
      ctx.fillStyle = "#3f4a55";
      ctx.fillRect(150, H - 96 + bob, 40, 40);
      ctx.fillStyle = "#c99f76";
      ctx.beginPath();
      ctx.arc(170, H - 106 + bob, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c3540";
      ctx.fillRect(155, H - 120 + bob, 30, 9);
    }
  }, W, H);

  function pick(id: string) {
    if (id !== item.id) {
      cozyAudio.drawer();
      setNote(`"Close — that's the ${STOCK.find((s) => s.id === id)?.label.toLowerCase()}. I need the ${item.label.toLowerCase()}."`);
      return;
    }
    cozyAudio.printer();
    setBagged((current) => [...current, id]);
    setServed((count) => count + 1);
    setNote(`Into a paper bag, receipt folded round it. "Appreciate it."`);
    setAtCounter(false);
    window.setTimeout(() => {
      cozyAudio.doorBell();
      setWanted(Math.floor(Math.random() * STOCK.length));
      setCustomer(Math.floor(Math.random() * CUSTOMERS.length));
      setAtCounter(true);
      setNote("");
    }, 1600);
  }

  return (
    <CozyShell
      edition="Ocean Heights · parts counter"
      title="The Parts Counter"
      note="Somebody comes in, asks for a part, and you find it on the shelf behind you. Pick the wrong box and you just get a polite correction — there is no score and nothing to lose."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="A small auto parts counter with shelves of boxes and a customer waiting" />
      </div>

      <div className="counter-ticket" aria-live="polite">
        {atCounter ? (
          <>
            <p className="counter-who">{CUSTOMERS[customer]}</p>
            <p className="counter-ask">&ldquo;I need {item.ask}.&rdquo;</p>
          </>
        ) : (
          <p className="counter-ask">{note || "The door swings shut behind them."}</p>
        )}
        {atCounter && note ? <p className="counter-reply">{note}</p> : null}
      </div>

      <div className="cozy-actions counter-shelf">
        {STOCK.map((entry) => (
          <button
            key={entry.id}
            type="button"
            disabled={!atCounter}
            onClick={() => pick(entry.id)}
            style={{ borderBottom: `6px solid ${entry.tint}` }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p className="cozy-note">
        {served === 0 ? "Nobody served yet. Quiet morning." : `${served} customer${served === 1 ? "" : "s"} sent on their way.`}
      </p>
    </CozyShell>
  );
}
