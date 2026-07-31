"use client";

import { useState } from "react";

const CARDS = 13;
const SAFE_PICKS_TO_WIN = 3;

type Card = {
  id: number;
  revealed: boolean;
  unlucky: boolean;
};

function deal() {
  const unluckyAt = Math.floor(Math.random() * CARDS);
  return Array.from({ length: CARDS }, (_, id) => ({
    id,
    revealed: false,
    unlucky: id === unluckyAt,
  }));
}

export function ThirteenUnlucky() {
  const [cards, setCards] = useState<Card[]>(deal);
  const [safePicks, setSafePicks] = useState(0);
  const [result, setResult] = useState<"playing" | "won" | "lost">("playing");

  const restart = () => {
    setCards(deal());
    setSafePicks(0);
    setResult("playing");
  };

  const choose = (card: Card) => {
    if (result !== "playing" || card.revealed) return;

    setCards((current) => current.map((entry) => (
      entry.id === card.id ? { ...entry, revealed: true } : entry
    )));

    if (card.unlucky) {
      setResult("lost");
      return;
    }

    setSafePicks((current) => {
      const next = current + 1;
      if (next === SAFE_PICKS_TO_WIN) setResult("won");
      return next;
    });
  };

  const message = result === "won"
    ? "Three lucky pulls. The foreman says you can keep the good luck."
    : result === "lost"
      ? "Flat tire. That was the unlucky card."
      : `Find ${SAFE_PICKS_TO_WIN - safePicks} more lucky card${SAFE_PICKS_TO_WIN - safePicks === 1 ? "" : "s"}.`;

  return (
    <section className="paper-game thirteen-unlucky-game" aria-labelledby="thirteen-unlucky-title">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2 id="thirteen-unlucky-title">13 Unlucky</h2>
        </div>
        <button type="button" className="thirteen-unlucky-reset" onClick={restart}>New shuffle</button>
      </header>
      <p className="thirteen-unlucky-intro">Pick three lucky cards. One card has a flat tire hiding behind it.</p>
      <p className="match-game-status" role="status">{message}</p>
      <div className="thirteen-unlucky-score" aria-label={`${safePicks} safe picks out of ${SAFE_PICKS_TO_WIN}`}>
        {Array.from({ length: SAFE_PICKS_TO_WIN }, (_, index) => (
          <span className={index < safePicks ? "is-safe" : ""} key={index}>●</span>
        ))}
      </div>
      <div className="thirteen-unlucky-deck" aria-label="Thirteen face-down garage cards">
        {cards.map((card) => (
          <button
            type="button"
            key={card.id}
            className={`${card.revealed ? "is-revealed" : ""}${card.unlucky && (card.revealed || result === "lost") ? " is-unlucky" : ""}`}
            onClick={() => choose(card)}
            disabled={card.revealed || result !== "playing"}
            aria-label={card.revealed ? (card.unlucky ? "Unlucky flat tire" : "Lucky garage card") : "Pick a face-down card"}
          >
            <span aria-hidden="true">{card.revealed ? (card.unlucky ? "FLAT" : "LUCKY") : "?"}</span>
          </button>
        ))}
      </div>
      {result !== "playing" ? (
        <div className="paper-game-actions">
          <button type="button" onClick={restart}>Shuffle again</button>
        </div>
      ) : null}
    </section>
  );
}
