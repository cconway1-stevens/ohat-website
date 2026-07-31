"use client";

import { useEffect, useState } from "react";
import { cozyAudio } from "@/lib/garage-audio";
import { CozyShell, useAmbience, useSceneCanvas } from "./cozy-shell";

const W = 480;
const H = 240;
const TAX = 0.06625; // New Jersey sales tax

// Everything on the shelf, with the way a customer would actually ask for it.
const STOCK = [
  { id: "wipers", label: "Wiper blades", ask: "a pair of wiper blades", price: 24.99, tint: "#1a7183" },
  { id: "oilfilter", label: "Oil filter", ask: "an oil filter", price: 8.49, tint: "#a8161c" },
  { id: "battery", label: "Battery", ask: "a battery", price: 149.95, tint: "#68a56f" },
  { id: "bulb", label: "Headlight bulb", ask: "a headlight bulb", price: 14.25, tint: "#f6bd38" },
  { id: "airfilter", label: "Air filter", ask: "an air filter", price: 19.5, tint: "#8fb7c4" },
  { id: "coolant", label: "Coolant", ask: "a jug of coolant", price: 16.75, tint: "#e0555a" },
  { id: "plugs", label: "Spark plugs", ask: "a set of spark plugs", price: 32.0, tint: "#cfc9b8" },
  { id: "fuses", label: "Fuse assortment", ask: "a fuse assortment", price: 6.99, tint: "#e49a42" },
  { id: "wax", label: "Wax", ask: "a tin of wax", price: 11.4, tint: "#c9a875" },
  { id: "washer", label: "Washer fluid", ask: "a jug of washer fluid", price: 4.99, tint: "#7fb2d9" },
];

const CUSTOMERS = [
  "A regular in a work jacket", "Somebody's dad", "A woman with a toddler on her hip",
  "A kid buying his first car part", "The landscaper from up the road",
  "A guy still in his fishing waders", "A nurse coming off nights",
];

const BILLS = [20, 50, 100];
type Phase = "browsing" | "register" | "receipt";
type Order = { items: string[]; outOfStock: string | null; coupon: boolean; customer: string; slip: number };

const money = (value: number) => `$${value.toFixed(2)}`;

function nextOrder(): Order {
  const pool = [...STOCK].sort(() => Math.random() - 0.5);
  const items = pool.slice(0, 1 + Math.floor(Math.random() * 3)).map((entry) => entry.id);
  return {
    items,
    // Now and then the hook is empty and it has to go on back-order.
    outOfStock: items.length > 1 && Math.random() < 0.3 ? items[items.length - 1] : null,
    coupon: Math.random() < 0.25,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    slip: 1000 + Math.floor(Math.random() * 8999),
  };
}

/**
 * The Parts Counter — find the parts on the shelf, carry them to the register,
 * ring the customer up and print the slip. Nothing is timed and nothing can be
 * failed: a wrong box just gets handed straight back.
 */
export function PartsCounter() {
  const [sound, setSound] = useState(false);
  // The first order is fixed so the server and browser agree, then reshuffled
  // on mount — randomising in the initialiser is a hydration error.
  const [order, setOrder] = useState<Order>({
    items: ["wipers"], outOfStock: null, coupon: false, customer: CUSTOMERS[0], slip: 1042,
  });
  const [phase, setPhase] = useState<Phase>("browsing");
  const [tray, setTray] = useState<string[]>([]);
  const [backOrdered, setBackOrdered] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [served, setServed] = useState(0);
  const [takings, setTakings] = useState(0);
  const [tender, setTender] = useState<{ kind: "cash" | "card"; bill?: number } | null>(null);

  useAmbience(sound, { fluorescent: 0.012, shopHum: 0.012, traffic: 0.006 });

  useEffect(() => {
    const id = window.setTimeout(() => setOrder(nextOrder()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const wanted = order.items.filter((id) => !backOrdered.includes(id));
  const outstanding = wanted.filter((id) => !tray.includes(id));
  const ready = outstanding.length === 0 && (tray.length > 0 || backOrdered.length > 0);

  const lines = tray.map((id) => STOCK.find((entry) => entry.id === id)!);
  const subtotal = lines.reduce((sum, entry) => sum + entry.price, 0);
  const discount = order.coupon ? subtotal * 0.1 : 0;
  const taxed = (subtotal - discount) * TAX;
  const total = subtotal - discount + taxed;
  const change = tender?.bill ? tender.bill - total : 0;

  const canvasRef = useSceneCanvas((ctx, frame) => {
    ctx.fillStyle = "#d9d2bd";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,235,.5)";
    ctx.fillRect(0, 0, W, 16);
    if (frame % 220 < 3) {
      ctx.fillStyle = "rgba(60,60,50,.14)";
      ctx.fillRect(0, 0, W, H);
    }

    // Shelving. Wanted boxes are outlined; an out-of-stock hook is a gap.
    for (let shelf = 0; shelf < 2; shelf += 1) {
      const y = 30 + shelf * 52;
      ctx.fillStyle = "#8d8676";
      ctx.fillRect(16, y + 34, W - 32, 5);
      for (let box = 0; box < 5; box += 1) {
        const entry = STOCK[shelf * 5 + box];
        const x = 24 + box * 88;
        if (entry.id === order.outOfStock && !backOrdered.includes(entry.id)) {
          ctx.fillStyle = "rgba(90,80,66,.22)";
          ctx.fillRect(x, y + 8, 62, 26);
          continue;
        }
        const isWanted = wanted.includes(entry.id) && !tray.includes(entry.id);
        ctx.fillStyle = entry.tint;
        ctx.globalAlpha = tray.includes(entry.id) ? 0.28 : isWanted ? 1 : 0.6;
        ctx.fillRect(x, y + 8, 62, 26);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isWanted ? "#a8161c" : "rgba(23,20,18,.6)";
        ctx.lineWidth = isWanted ? 2.5 : 1.5;
        ctx.strokeRect(x, y + 8, 62, 26);
        ctx.fillStyle = "rgba(23,20,18,.5)";
        ctx.fillRect(x + 6, y + 15, 44, 3);
        ctx.fillRect(x + 6, y + 22, 28, 3);
      }
    }

    // Counter.
    ctx.fillStyle = "#7a5c3a";
    ctx.fillRect(0, H - 62, W, 62);
    ctx.fillStyle = "#6a4e30";
    ctx.fillRect(0, H - 62, W, 7);

    // The tray of picked parts waiting to be rung up.
    tray.forEach((id, index) => {
      const entry = STOCK.find((candidate) => candidate.id === id)!;
      const x = 18 + index * 34;
      ctx.fillStyle = entry.tint;
      ctx.fillRect(x, H - 50, 28, 20);
      ctx.strokeStyle = "rgba(23,20,18,.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, H - 50, 28, 20);
    });

    // Register, with paper feeding out while it prints.
    const rx = W - 132;
    ctx.fillStyle = "#3b3630";
    ctx.fillRect(rx, H - 96, 108, 62);
    ctx.fillStyle = phase === "register" ? "#8fe0a0" : "#2a2f2c";
    ctx.fillRect(rx + 8, H - 90, 92, 20);
    ctx.fillStyle = "#1b1c20";
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        ctx.fillRect(rx + 10 + col * 23, H - 64 + row * 13, 17, 9);
      }
    }
    if (phase === "receipt") {
      const out = Math.min(48, (frame % 240) + 8);
      ctx.fillStyle = "#f7f3e6";
      ctx.fillRect(rx + 34, H - 100 - out, 42, out);
      ctx.strokeStyle = "rgba(23,20,18,.25)";
      ctx.lineWidth = 1;
      for (let line = 6; line < out; line += 7) {
        ctx.beginPath();
        ctx.moveTo(rx + 38, H - 100 - out + line);
        ctx.lineTo(rx + 70, H - 100 - out + line);
        ctx.stroke();
      }
    }

    // The customer, waiting.
    if (phase !== "receipt") {
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

  function grab(id: string) {
    if (id === order.outOfStock && !backOrdered.includes(id)) {
      cozyAudio.drawer();
      setNote("That hook is empty — nothing left in that size. It will have to go on back-order.");
      return;
    }
    if (tray.includes(id)) {
      cozyAudio.drawer();
      setTray((current) => current.filter((entry) => entry !== id));
      setNote("Back on the shelf.");
      return;
    }
    if (!wanted.includes(id)) {
      cozyAudio.drawer();
      setNote(`"Not that one — I asked for ${order.items.map((item) => STOCK.find((s) => s.id === item)!.ask).join(" and ")}."`);
      return;
    }
    cozyAudio.drawer();
    setTray((current) => [...current, id]);
    setNote("Onto the counter it goes.");
  }

  function ringUp() {
    cozyAudio.printer();
    setTakings((value) => value + total);
    setServed((count) => count + 1);
    setPhase("receipt");
  }

  function nextCustomer() {
    cozyAudio.doorBell();
    setOrder(nextOrder());
    setTray([]);
    setBackOrdered([]);
    setTender(null);
    setNote("");
    setPhase("browsing");
  }

  return (
    <CozyShell
      edition="Ocean Heights · parts counter"
      title="The Parts Counter"
      note="Find what they asked for on the shelf, carry it to the register, and print the slip. Nothing is timed, and a wrong box just gets handed straight back."
      soundOn={sound}
      onSoundChange={setSound}
    >
      <div className="cozy-stage">
        <canvas ref={canvasRef} width={W} height={H} role="img" aria-label="A parts counter with shelves of boxes, a tray and a register" />
      </div>

      {phase === "browsing" ? (
        <>
          <div className="counter-ticket" aria-live="polite">
            <p className="counter-who">{order.customer}</p>
            <p className="counter-ask">
              &ldquo;I need {order.items.map((id) => STOCK.find((entry) => entry.id === id)!.ask).join(", and ")}.&rdquo;
            </p>
            {order.coupon ? <p className="counter-reply">They slide a 10% coupon across the counter.</p> : null}
            {note ? <p className="counter-reply">{note}</p> : null}
          </div>

          <div className="cozy-actions counter-shelf">
            {STOCK.map((entry) => {
              const gap = entry.id === order.outOfStock && !backOrdered.includes(entry.id);
              const held = tray.includes(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={held ? "is-on" : ""}
                  onClick={() => grab(entry.id)}
                  style={{ borderBottom: `6px solid ${gap ? "#8d8676" : entry.tint}` }}
                >
                  {entry.label}{held ? " ✓" : gap ? " — empty" : ""}
                </button>
              );
            })}
          </div>

          <div className="cozy-actions">
            {order.outOfStock && !backOrdered.includes(order.outOfStock) ? (
              <button
                type="button"
                onClick={() => {
                  cozyAudio.printer();
                  setBackOrdered([order.outOfStock!]);
                  setNote(`Back-ordered. "That's fine, I'll come back Thursday."`);
                }}
              >
                Back-order the {STOCK.find((e) => e.id === order.outOfStock)!.label.toLowerCase()}
              </button>
            ) : null}
            <button type="button" disabled={!ready} onClick={() => { cozyAudio.click(); setPhase("register"); }}>
              Take it to the register
            </button>
          </div>
        </>
      ) : null}

      {phase === "register" ? (
        <div className="pos">
          <p className="pos-head">Register 1 · Slip #{order.slip}</p>
          <ul className="pos-lines">
            {lines.map((entry) => (
              <li key={entry.id}><span>{entry.label}</span><b>{money(entry.price)}</b></li>
            ))}
            {backOrdered.map((id) => (
              <li key={id} className="is-void"><span>{STOCK.find((e) => e.id === id)!.label} — back-ordered</span><b>—</b></li>
            ))}
          </ul>
          <dl className="pos-totals">
            <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            {order.coupon ? <div className="is-off"><dt>Coupon 10%</dt><dd>-{money(discount)}</dd></div> : null}
            <div><dt>NJ tax</dt><dd>{money(taxed)}</dd></div>
            <div className="is-total"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>

          <p className="pos-prompt">How are they paying?</p>
          <div className="cozy-actions">
            <button type="button" className={tender?.kind === "card" ? "is-on" : ""} onClick={() => { cozyAudio.coin(); setTender({ kind: "card" }); }}>
              Card
            </button>
            {BILLS.filter((bill) => bill >= total).map((bill) => (
              <button key={bill} type="button" className={tender?.bill === bill ? "is-on" : ""} onClick={() => { cozyAudio.coin(); setTender({ kind: "cash", bill }); }}>
                Cash ${bill}
              </button>
            ))}
          </div>
          {tender?.kind === "cash" ? <p className="pos-change">Change due <b>{money(change)}</b></p> : null}

          <div className="cozy-actions">
            <button type="button" onClick={() => setPhase("browsing")}>Back to the shelf</button>
            <button type="button" disabled={!tender} onClick={ringUp}>Ring it up</button>
          </div>
        </div>
      ) : null}

      {phase === "receipt" ? (
        <>
          <div className="receipt" role="img" aria-label={`Receipt, ${lines.length} items, total ${money(total)}`}>
            <div className="receipt-body">
              <p className="receipt-shop">OCEAN HEIGHTS<br />AUTO &amp; TIRE</p>
              <p className="receipt-addr">1178 OCEAN HEIGHTS AVE<br />EGG HARBOR TWP, NJ<br />(609) 241-1546</p>
              <p className="receipt-rule">* * * * * * * * * * * *</p>
              <p className="receipt-meta">REG 1 &nbsp; SLIP #{order.slip}<br />PARTS COUNTER</p>
              <p className="receipt-rule">- - - - - - - - - - - -</p>
              <ul>
                {lines.map((entry) => (
                  <li key={entry.id}><span>{entry.label.toUpperCase()}</span><b>{money(entry.price)}</b></li>
                ))}
                {backOrdered.map((id) => (
                  <li key={id} className="is-void"><span>{STOCK.find((e) => e.id === id)!.label.toUpperCase()} B/O</span><b>0.00</b></li>
                ))}
              </ul>
              <p className="receipt-rule">- - - - - - - - - - - -</p>
              <ul>
                <li><span>SUBTOTAL</span><b>{money(subtotal)}</b></li>
                {order.coupon ? <li><span>COUPON 10%</span><b>-{money(discount)}</b></li> : null}
                <li><span>TAX 6.625%</span><b>{money(taxed)}</b></li>
                <li className="is-total"><span>TOTAL</span><b>{money(total)}</b></li>
                <li>
                  <span>{tender?.kind === "card" ? "CARD" : `CASH $${tender?.bill}.00`}</span>
                  <b>{tender?.kind === "card" ? money(total) : money(tender?.bill ?? 0)}</b>
                </li>
                {tender?.kind === "cash" ? <li><span>CHANGE</span><b>{money(change)}</b></li> : null}
              </ul>
              <p className="receipt-rule">* * * * * * * * * * * *</p>
              <p className="receipt-thanks">THANK YOU<br />ASK ABOUT OUR OIL CHANGE</p>
              {/* Stated outright: this is a game prop, not a record of a sale. */}
              <p className="receipt-note">GARAGE ARCADE PRACTICE SLIP<br />NOT A REAL TRANSACTION</p>
            </div>
          </div>

          <div className="cozy-actions">
            <button type="button" onClick={nextCustomer}>Next customer</button>
          </div>
        </>
      ) : null}

      <p className="cozy-note">
        {served === 0
          ? "Nobody served yet. Quiet morning."
          : `${served} customer${served === 1 ? "" : "s"} sent on their way · ${money(takings)} through the register.`}
      </p>
    </CozyShell>
  );
}
