"use client";

import { useCallback, useEffect, useState } from "react";
import { ambience, garageAudio } from "@/lib/garage-audio";

const STARTING_LUG_NUTS = 50;
const HAND_COST = 5;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const SUITS = ["h", "d", "c", "s"];

type Card = { id: string; rank: string; suit: string; showingFace: boolean };
type Hand = { cards: Card[]; cardTotal: number; blackjack: boolean };
type Round = { dealer: Hand; player: Hand; over: boolean };

function drawCard(showingFace = true): Card {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
    showingFace,
  };
}

function hand(cards: Card[]): Hand {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      total += 11;
      aces += 1;
    } else total += ["T", "J", "Q", "K"].includes(card.rank) ? 10 : Number(card.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return {
    cards,
    cardTotal: total,
    blackjack: cards.length === 2 && total === 21,
  };
}

function reveal(cards: Card[]) {
  return cards.map((card) => ({ ...card, showingFace: true }));
}

function finishDealerHand(cards: Card[]) {
  const revealed = reveal(cards);
  while (hand(revealed).cardTotal < 17) revealed.push(drawCard());
  return hand(revealed);
}

function dealRound(): Round {
  const dealerCards = [drawCard(false), drawCard()];
  const player = hand([drawCard(), drawCard()]);
  if (player.blackjack) return { dealer: finishDealerHand(dealerCards), player, over: true };
  return { dealer: hand(dealerCards), player, over: false };
}

function playRound(round: Round, move: "hit" | "stand"): Round {
  const playerCards = [...round.player.cards];
  if (move === "hit") {
    playerCards.push(drawCard());
    const player = hand(playerCards);
    if (player.cardTotal > 21) return { dealer: hand(reveal(round.dealer.cards)), player, over: true };
    return { dealer: hand(round.dealer.cards), player, over: false };
  }
  return { dealer: finishDealerHand(round.dealer.cards), player: hand(playerCards), over: true };
}

function suitSymbol(suit: string) {
  return { h: "\u2665", d: "\u2666", c: "\u2663", s: "\u2660" }[suit] ?? "?";
}

function cardRank(rank: string) {
  return rank === "T" ? "10" : rank;
}

function dealerShowingTotal(round: Round) {
  return hand(round.dealer.cards.filter((card) => card.showingFace)).cardTotal;
}

function roundMessage(round: Round) {
  if (!round.over) return `You have ${round.player.cardTotal}. The house is showing ${dealerShowingTotal(round)}; choose Hit or Stand.`;
  if (round.player.cardTotal > 21) return "You went over 21. The house wins this hand.";
  if (round.dealer.cardTotal > 21) return "The house went over 21. Your 5 Lug Nuts were returned.";
  if (round.player.cardTotal > round.dealer.cardTotal) return "You beat the house. Your 5 Lug Nuts were returned.";
  if (round.player.cardTotal === round.dealer.cardTotal) return "Push: you and the house tied. Your 5 Lug Nuts were returned.";
  return "The house wins this hand. Deal another one when ready.";
}

function returnsHandCost(round: Round) {
  return round.over
    && round.player.cardTotal <= 21
    && (round.dealer.cardTotal > 21 || round.player.cardTotal >= round.dealer.cardTotal);
}

function roundOutcome(round: Round | null) {
  if (!round?.over) return null;
  if (round.player.cardTotal > 21) return "house";
  if (round.dealer.cardTotal > 21 || round.player.cardTotal > round.dealer.cardTotal) return "player";
  if (round.player.cardTotal === round.dealer.cardTotal) return "push";
  return "house";
}

function PlayingCard({ card }: { card: Card }) {
  const red = card.suit === "h" || card.suit === "d";
  if (!card.showingFace) return <div className="garage-blackjack-card is-hidden" aria-label="Dealer card face down">OH</div>;
  return (
    <div className={`garage-blackjack-card${red ? " is-red" : ""}`} aria-label={`${cardRank(card.rank)} of ${card.suit}`}>
      <span>{cardRank(card.rank)}</span>
      <b>{suitSymbol(card.suit)}</b>
    </div>
  );
}

export function GarageBlackjack() {
  const [round, setRound] = useState<Round | null>(null);
  const [lugNuts, setLugNuts] = useState(STARTING_LUG_NUTS);
  const [quit, setQuit] = useState(false);
  const [casinoLobby, setCasinoLobby] = useState(false);

  useEffect(() => () => ambience.set("casino", 0, 0.12), []);

  const deal = useCallback(() => {
    if (lugNuts < HAND_COST || (!round?.over && round)) return;
    const nextRound = dealRound();
    setRound(nextRound);
    setLugNuts((current) => Math.min(STARTING_LUG_NUTS, current - HAND_COST + (returnsHandCost(nextRound) ? HAND_COST : 0)));
    setQuit(false);
  }, [lugNuts, round]);

  const play = useCallback((move: "hit" | "stand") => {
    if (!round || round.over) return;
    const nextRound = playRound(round, move);
    setRound(nextRound);
    if (returnsHandCost(nextRound)) {
      setLugNuts((current) => Math.min(STARTING_LUG_NUTS, current + HAND_COST));
    }
  }, [round]);

  const leaveTable = useCallback(() => {
    setRound(null);
    setQuit(true);
  }, []);

  function resetSession() {
    setRound(null);
    setLugNuts(STARTING_LUG_NUTS);
    setQuit(false);
  }

  const toggleCasinoLobby = useCallback(() => {
    const next = !casinoLobby;
    setCasinoLobby(next);
    ambience.set("casino", next ? 0.018 : 0, 0.18);
    if (next) garageAudio.chime();
  }, [casinoLobby]);

  const canDeal = lugNuts >= HAND_COST && (round === null || round.over);
  const availableHands = Math.ceil(lugNuts / HAND_COST);
  const outcome = roundOutcome(round);
  const status = quit
    ? `You left the table with ${lugNuts} Lug Nuts.`
    : round
      ? roundMessage(round)
      : lugNuts < HAND_COST
        ? "Out of Lug Nuts. This play session is finished."
        : `Each hand uses ${HAND_COST} Lug Nuts. You have ${lugNuts}.`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (key === "d" && canDeal) {
        event.preventDefault();
        deal();
      } else if (key === "h" && round && !round.over) {
        event.preventDefault();
        play("hit");
      } else if (key === "s" && round && !round.over) {
        event.preventDefault();
        play("stand");
      } else if (key === "q" && round && !round.over) {
        event.preventDefault();
        leaveTable();
      } else if (key === "l") {
        event.preventDefault();
        toggleCasinoLobby();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canDeal, deal, leaveTable, play, round, toggleCasinoLobby]);

  return (
    <section className="paper-game garage-blackjack-game" aria-labelledby="garage-blackjack-title">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2 id="garage-blackjack-title">Garage Blackjack</h2>
        </div>
        <div className="garage-blackjack-header-actions">
          <div className="garage-blackjack-bank" aria-label={`${lugNuts} Lug Nuts remaining, enough for ${availableHands} hand${availableHands === 1 ? "" : "s"}`}>
            <span className="garage-lug-nut-tray" aria-hidden="true">
              {Array.from({ length: STARTING_LUG_NUTS / HAND_COST }, (_, index) => (
                <i className={index < availableHands ? "is-available" : ""} key={index} />
              ))}
            </span>
            <span className="garage-lug-nut-copy"><b>{lugNuts}</b><small>Lug Nuts</small></span>
          </div>
          <button type="button" className="garage-blackjack-lobby" onClick={toggleCasinoLobby} aria-pressed={casinoLobby} title="Press L to toggle lobby sound">
            {casinoLobby ? "Lobby sound on" : "Lobby sound off"}
          </button>
          <button type="button" className="garage-blackjack-deal" onClick={deal} disabled={!canDeal} title="Press D to deal">Deal hand</button>
        </div>
      </header>
      <p className="garage-blackjack-intro">You are the player. The house is the dealer. Finish closer to 21 without going over; wins and ties return the same 5 session tokens.</p>
      {round ? <div className={`garage-blackjack-table${outcome ? ` is-${outcome}-win` : ""}`}>
        <div className="garage-blackjack-hand is-house">
          <span><b>House</b> Dealer {round.over ? `total ${round.dealer.cardTotal}` : `showing ${dealerShowingTotal(round)}`}</span>
          <div>{round.dealer.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
        <div className="garage-blackjack-marker" aria-hidden="true">
          {outcome === "player" ? <><strong>You win</strong><small>5 Lug Nuts returned</small></> : null}
          {outcome === "house" ? <><strong>House wins</strong><small>Try the next hand</small></> : null}
          {outcome === "push" ? <><strong>Push</strong><small>5 Lug Nuts returned</small></> : null}
          {!outcome ? <>YOU PLAY<br />THE HOUSE<br /><small>GET CLOSE TO 21</small></> : null}
        </div>
        <div className="garage-blackjack-hand is-player">
          <span><b>You</b> Player total {round.player.cardTotal}</span>
          <div>{round.player.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
      </div> : <div className="garage-blackjack-table is-empty" aria-hidden="true"><span>YOU PLAY THE HOUSE</span><small>Deal a hand to start</small></div>}
      <p className="match-game-status" role="status">{status}</p>
      <div className="garage-blackjack-controls">
        <button type="button" onClick={() => play("hit")} disabled={!round || round.over} title="Press H to hit">Hit</button>
        <button type="button" onClick={() => play("stand")} disabled={!round || round.over} title="Press S to stand">Stand</button>
        <button type="button" onClick={leaveTable} disabled={!round || round.over} title="Press Q to quit">Quit table</button>
        {round?.over && canDeal ? <button type="button" onClick={deal}>Deal again</button> : null}
        {(quit || lugNuts < HAND_COST) ? <button type="button" onClick={resetSession}>New play session</button> : null}
      </div>
      <p className="garage-blackjack-keys"><b>Keys:</b> D deal, H hit, S stand, Q leave table, L lobby sound.</p>
      <p className="garage-blackjack-notice">
        For entertainment only. Lug Nuts are free session-only play tokens with no cash value. A win or tie only returns the same 5 tokens used for that hand, up to the starting balance. They cannot be bought, sold, transferred, exchanged, redeemed, or used for any prize, discount, service, real-world reward, betting, wager, winning, or payout.
      </p>
    </section>
  );
}
