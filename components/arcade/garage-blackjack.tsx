"use client";

import { useCallback, useEffect, useState } from "react";
import { Game, GameStep } from "@blackjacktrainer/blackjack-simulator";
import { ambience, garageAudio } from "@/lib/garage-audio";

const HIT = 2;
const STAND = 5;
const STARTING_LUG_NUTS = 50;
const HAND_COST = 5;

type Card = { id: string; rank: string; suit: string; showingFace: boolean };
type Hand = { cards: Card[]; cardTotal: number; blackjack: boolean };
type Engine = InstanceType<typeof Game>;
type Round = { dealer: Hand; player: Hand; over: boolean };

function runToPlayerChoice(game: Engine) {
  while (
    game.state.step !== GameStep.WaitingForPlayInput
    && game.state.step !== GameStep.WaitingForNewGameInput
  ) game.step();
}

function readRound(game: Engine): Round {
  return {
    dealer: game.dealer.firstHand.attributes(),
    player: game.player.firstHand.attributes(),
    over: game.state.step === GameStep.WaitingForNewGameInput,
  };
}

function newGame() {
  const game = new Game({
    autoDeclineInsurance: true,
    disableEvents: true,
    deckCount: 1,
    hitSoft17: false,
    playerCount: 1,
  });
  game.betAmount = 100;
  runToPlayerChoice(game);
  return game;
}

function suitSymbol(suit: string) {
  return { h: "\u2665", d: "\u2666", c: "\u2663", s: "\u2660" }[suit] ?? "?";
}

function cardRank(rank: string) {
  return rank === "T" ? "10" : rank;
}

function roundMessage(round: Round) {
  if (!round.over) return `You have ${round.player.cardTotal}. The house is showing ${round.dealer.cardTotal}; choose Hit or Stand.`;
  if (round.player.cardTotal > 21) return "You went over 21. The house wins this hand.";
  if (round.dealer.cardTotal > 21) return "The house went over 21. You win this hand, with no real-world prize.";
  if (round.player.cardTotal > round.dealer.cardTotal) return "You beat the house. No prize is awarded.";
  if (round.player.cardTotal === round.dealer.cardTotal) return "Push: you and the house tied. Nobody wins this hand.";
  return "The house wins this hand. Deal another one when ready.";
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
  const [engine, setEngine] = useState<Engine | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [lugNuts, setLugNuts] = useState(STARTING_LUG_NUTS);
  const [quit, setQuit] = useState(false);
  const [casinoLobby, setCasinoLobby] = useState(false);

  useEffect(() => () => ambience.set("casino", 0, 0.12), []);

  const deal = useCallback(() => {
    if (lugNuts < HAND_COST || (!round?.over && round)) return;
    const game = newGame();
    setEngine(game);
    setRound(readRound(game));
    setLugNuts((current) => current - HAND_COST);
    setQuit(false);
  }, [lugNuts, round]);

  const play = useCallback((move: number) => {
    if (!engine || !round || round.over) return;
    engine.step(move);
    runToPlayerChoice(engine);
    setRound(readRound(engine));
  }, [engine, round]);

  const leaveTable = useCallback(() => {
    setEngine(null);
    setRound(null);
    setQuit(true);
  }, []);

  function resetSession() {
    setEngine(null);
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
        play(HIT);
      } else if (key === "s" && round && !round.over) {
        event.preventDefault();
        play(STAND);
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
      <p className="garage-blackjack-intro">You are the player. The house is the dealer. Finish closer to 21 than the house without going over.</p>
      {round ? <div className="garage-blackjack-table">
        <div className="garage-blackjack-hand is-house">
          <span><b>House</b> Dealer {round.over ? `total ${round.dealer.cardTotal}` : `showing ${round.dealer.cardTotal}`}</span>
          <div>{round.dealer.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
        <div className="garage-blackjack-marker" aria-hidden="true">YOU PLAY<br />THE HOUSE<br /><small>GET CLOSE TO 21</small></div>
        <div className="garage-blackjack-hand is-player">
          <span><b>You</b> Player total {round.player.cardTotal}</span>
          <div>{round.player.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
      </div> : <div className="garage-blackjack-table is-empty" aria-hidden="true"><span>YOU PLAY THE HOUSE</span><small>Deal a hand to start</small></div>}
      <p className="match-game-status" role="status">{status}</p>
      <div className="garage-blackjack-controls">
        <button type="button" onClick={() => play(HIT)} disabled={!round || round.over} title="Press H to hit">Hit</button>
        <button type="button" onClick={() => play(STAND)} disabled={!round || round.over} title="Press S to stand">Stand</button>
        <button type="button" onClick={leaveTable} disabled={!round || round.over} title="Press Q to quit">Quit table</button>
        {round?.over && canDeal ? <button type="button" onClick={deal}>Deal again</button> : null}
        {(quit || lugNuts < HAND_COST) ? <button type="button" onClick={resetSession}>New play session</button> : null}
      </div>
      <p className="garage-blackjack-keys"><b>Keys:</b> D deal, H hit, S stand, Q leave table, L lobby sound.</p>
      <p className="garage-blackjack-notice">
        For entertainment only. Lug Nuts are free session-only play tokens with no cash value. They cannot be bought, sold, transferred, exchanged, redeemed, or used for any prize or real-world reward. No betting, wagering, winnings, or payouts.
      </p>
    </section>
  );
}
