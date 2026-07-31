"use client";

import { useState } from "react";
import { Game, GameStep } from "@blackjacktrainer/blackjack-simulator";

const HIT = 2;
const STAND = 5;

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

function roundMessage(round: Round) {
  if (!round.over) return "Hit for another card or stand and let the dealer play.";
  if (round.player.cardTotal > 21) return "Busted. The service bay takes this hand.";
  if (round.dealer.cardTotal > 21) return "Dealer busted. You win the garage bragging rights.";
  if (round.player.cardTotal > round.dealer.cardTotal) return "You win. Clean pull into the service bay.";
  if (round.player.cardTotal === round.dealer.cardTotal) return "Push. Nobody has to sweep up the chips.";
  return "Dealer wins this hand. Deal another one.";
}

function PlayingCard({ card }: { card: Card }) {
  const red = card.suit === "h" || card.suit === "d";
  if (!card.showingFace) return <div className="garage-blackjack-card is-hidden" aria-label="Dealer card face down">OH</div>;
  return (
    <div className={`garage-blackjack-card${red ? " is-red" : ""}`} aria-label={`${card.rank} of ${card.suit}`}>
      <span>{card.rank}</span>
      <b>{suitSymbol(card.suit)}</b>
    </div>
  );
}

export function GarageBlackjack() {
  const [engine, setEngine] = useState<Engine>(() => newGame());
  const [round, setRound] = useState<Round>(() => readRound(engine));

  function deal() {
    const game = newGame();
    setEngine(game);
    setRound(readRound(game));
  }

  function play(move: number) {
    if (round.over) return;
    engine.step(move);
    runToPlayerChoice(engine);
    setRound(readRound(engine));
  }

  return (
    <section className="paper-game garage-blackjack-game" aria-labelledby="garage-blackjack-title">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2 id="garage-blackjack-title">Garage Blackjack</h2>
        </div>
        <button type="button" className="garage-blackjack-deal" onClick={deal}>Deal hand</button>
      </header>
      <p className="garage-blackjack-intro">A no-money service-bay table. Beat the dealer without going over 21.</p>
      <div className="garage-blackjack-table">
        <div className="garage-blackjack-hand">
          <span>Dealer {round.over ? round.dealer.cardTotal : "showing"}</span>
          <div>{round.dealer.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
        <div className="garage-blackjack-marker" aria-hidden="true">OCEAN HEIGHTS<br />SERVICE BAY 21</div>
        <div className="garage-blackjack-hand">
          <span>Your hand {round.player.cardTotal}</span>
          <div>{round.player.cards.map((card) => <PlayingCard card={card} key={card.id} />)}</div>
        </div>
      </div>
      <p className="match-game-status" role="status">{roundMessage(round)}</p>
      <div className="garage-blackjack-controls">
        <button type="button" onClick={() => play(HIT)} disabled={round.over}>Hit</button>
        <button type="button" onClick={() => play(STAND)} disabled={round.over}>Stand</button>
        {round.over ? <button type="button" onClick={deal}>Deal again</button> : null}
      </div>
    </section>
  );
}
