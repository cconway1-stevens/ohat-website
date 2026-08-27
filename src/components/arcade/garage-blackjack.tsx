"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ambience, garageAudio } from "@/lib/arcade/garage-audio";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const SUITS = ["h", "d", "c", "s"];

type Card = { id: string; rank: string; suit: string; showingFace: boolean };
type Hand = { cards: Card[]; cardTotal: number; blackjack: boolean };
type PlayerHand = Hand & { complete: boolean; doubled: boolean; surrendered: boolean };
type Round = { dealer: Hand; players: PlayerHand[]; activeHand: number; over: boolean };
type Score = { wins: number; losses: number; pushes: number };

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

function playerHand(
  cards: Card[],
  options: Partial<Pick<PlayerHand, "complete" | "doubled" | "surrendered">> = {},
): PlayerHand {
  return { ...hand(cards), complete: false, doubled: false, surrendered: false, ...options };
}

function dealRound(): Round {
  const dealerCards = [drawCard(false), drawCard()];
  const player = playerHand([drawCard(), drawCard()]);
  if (player.blackjack)
    return {
      dealer: finishDealerHand(dealerCards),
      players: [{ ...player, complete: true }],
      activeHand: 0,
      over: true,
    };
  return { dealer: hand(dealerCards), players: [player], activeHand: 0, over: false };
}

function finishRound(round: Omit<Round, "dealer" | "over"> & { dealer: Hand }) {
  const dealerNeedsToPlay = round.players.some(
    (player) => !player.surrendered && player.cardTotal <= 21,
  );
  return {
    ...round,
    dealer: dealerNeedsToPlay
      ? finishDealerHand(round.dealer.cards)
      : hand(reveal(round.dealer.cards)),
    over: true,
  };
}

function advanceHand(round: Omit<Round, "over"> & { dealer: Hand }): Round {
  const nextActive = round.players.findIndex(
    (player, index) => index > round.activeHand && !player.complete,
  );
  if (nextActive !== -1) return { ...round, activeHand: nextActive, over: false };
  return finishRound(round);
}

function playRound(round: Round, move: "hit" | "stand" | "double" | "surrender" | "split"): Round {
  const active = round.players[round.activeHand];
  if (!active || active.complete) return round;
  const players = [...round.players];

  if (move === "split") {
    if (
      players.length !== 1 ||
      active.cards.length !== 2 ||
      active.cards[0].rank !== active.cards[1].rank
    )
      return round;
    players.splice(
      round.activeHand,
      1,
      playerHand([active.cards[0], drawCard()]),
      playerHand([active.cards[1], drawCard()]),
    );
    return { ...round, players, activeHand: round.activeHand, over: false };
  }

  if (move === "surrender") {
    players[round.activeHand] = playerHand(active.cards, { complete: true, surrendered: true });
    return advanceHand({ ...round, players });
  }

  if (move === "stand") {
    players[round.activeHand] = playerHand(active.cards, {
      complete: true,
      doubled: active.doubled,
    });
    return advanceHand({ ...round, players });
  }

  const cards = [...active.cards, drawCard()];
  const doubled = move === "double";
  const next = playerHand(cards, { complete: doubled || hand(cards).cardTotal > 21, doubled });
  players[round.activeHand] = next;
  if (next.complete) return advanceHand({ ...round, players });
  return { ...round, players, over: false };
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

function handOutcome(player: PlayerHand, dealer: Hand): "player" | "house" | "push" {
  if (player.surrendered || player.cardTotal > 21) return "house";
  if (dealer.cardTotal > 21 || player.cardTotal > dealer.cardTotal) return "player";
  if (player.cardTotal === dealer.cardTotal) return "push";
  return "house";
}

function roundOutcomes(round: Round | null) {
  if (!round?.over) return [];
  return round.players.map((player) => handOutcome(player, round.dealer));
}

function roundMessage(round: Round) {
  if (!round.over) {
    const player = round.players[round.activeHand];
    return `Hand ${round.activeHand + 1}: you have ${player.cardTotal}. The house is showing ${dealerShowingTotal(round)}; choose an action.`;
  }
  const results = roundOutcomes(round).map(
    (outcome, index) =>
      `Hand ${index + 1} ${outcome === "player" ? "wins" : outcome === "house" ? "loses" : "pushes"}`,
  );
  return `${results.join(". ")}. Deal another free hand when ready.`;
}

function PlayingCard({ card }: { card: Card }) {
  const red = card.suit === "h" || card.suit === "d";
  if (!card.showingFace)
    return (
      <div className="garage-blackjack-card is-hidden" aria-label="Dealer card face down">
        OH
      </div>
    );
  return (
    <div
      className={`garage-blackjack-card${red ? " is-red" : ""}`}
      aria-label={`${cardRank(card.rank)} of ${card.suit}`}
    >
      <span>{cardRank(card.rank)}</span>
      <b>{suitSymbol(card.suit)}</b>
    </div>
  );
}

export function GarageBlackjack() {
  const [round, setRound] = useState<Round | null>(null);
  const [quit, setQuit] = useState(false);
  const [casinoLobby, setCasinoLobby] = useState(false);
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, pushes: 0 });
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showTableDetails, setShowTableDetails] = useState(true);
  const lobbyAudio = useRef<HTMLAudioElement>(null);

  useEffect(
    () => () => {
      ambience.set("casino", 0, 0.12);
      lobbyAudio.current?.pause();
    },
    [],
  );

  const recordOutcome = useCallback((completedRound: Round) => {
    const results = roundOutcomes(completedRound);
    if (!results.length) return;
    setScore((current) =>
      results.reduce(
        (next, result) =>
          result === "player"
            ? { ...next, wins: next.wins + 1 }
            : result === "house"
              ? { ...next, losses: next.losses + 1 }
              : { ...next, pushes: next.pushes + 1 },
        current,
      ),
    );
    if (results.includes("player")) garageAudio.blackjackWin();
  }, []);

  const deal = useCallback(() => {
    if (!round?.over && round) return;
    const nextRound = dealRound();
    setRound(nextRound);
    recordOutcome(nextRound);
    setQuit(false);
  }, [recordOutcome, round]);

  const play = useCallback(
    (move: "hit" | "stand" | "double" | "surrender" | "split") => {
      if (!round || round.over) return;
      const nextRound = playRound(round, move);
      setRound(nextRound);
      recordOutcome(nextRound);
    },
    [recordOutcome, round],
  );

  const leaveTable = useCallback(() => {
    setRound(null);
    setQuit(true);
  }, []);

  function resetSession() {
    setRound(null);
    setQuit(false);
    setScore({ wins: 0, losses: 0, pushes: 0 });
  }

  const toggleCasinoLobby = useCallback(() => {
    const next = !casinoLobby;
    setCasinoLobby(next);
    const track = lobbyAudio.current;
    if (next) {
      ambience.set("casino", 0, 0.12);
      if (track) {
        track.volume = 0.12;
        void track.play().catch(() => setCasinoLobby(false));
      }
      garageAudio.chime();
    } else if (track) {
      track.pause();
      track.currentTime = 0;
    }
  }, [casinoLobby]);

  const canDeal = termsAcknowledged && (round === null || round.over);
  const outcomes = roundOutcomes(round);
  const outcome =
    outcomes.length && outcomes.every((result) => result === "player")
      ? "player"
      : outcomes.length && outcomes.every((result) => result === "house")
        ? "house"
        : outcomes.length
          ? "push"
          : null;
  const activePlayer = round && !round.over ? round.players[round.activeHand] : null;
  const canSplit =
    advancedMode &&
    Boolean(
      activePlayer &&
      round?.players.length === 1 &&
      activePlayer.cards.length === 2 &&
      activePlayer.cards[0].rank === activePlayer.cards[1].rank,
    );
  const canDouble = advancedMode && Boolean(activePlayer && activePlayer.cards.length === 2);
  const canSurrender =
    advancedMode &&
    Boolean(activePlayer && round?.players.length === 1 && activePlayer.cards.length === 2);
  const status = quit
    ? "You left the table. Come back for a free hand anytime."
    : round
      ? roundMessage(round)
      : termsAcknowledged
        ? "Every hand is free. Deal when you are ready."
        : "Acknowledge the free-play table terms to deal a hand.";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if ((key === "d" || key === "1") && canDeal) {
        event.preventDefault();
        deal();
      } else if ((key === "h" || key === "2") && round && !round.over) {
        event.preventDefault();
        play("hit");
      } else if ((key === "s" || key === "3") && round && !round.over) {
        event.preventDefault();
        play("stand");
      } else if (key === "q" && round && !round.over) {
        event.preventDefault();
        leaveTable();
      } else if (key === "l" && termsAcknowledged) {
        event.preventDefault();
        toggleCasinoLobby();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canDeal, deal, leaveTable, play, round, termsAcknowledged, toggleCasinoLobby]);

  return (
    <section
      className={`paper-game garage-blackjack-game${termsAcknowledged ? "" : " is-terms-pending"}`}
      aria-labelledby="garage-blackjack-title"
    >
      {/* Lobby ambience: Casino Ambiance by freesound_community, via Pixabay Content License. */}
      <audio
        ref={lobbyAudio}
        src="/media/casino-ambiance-19130.mp3"
        preload="none"
        loop
        aria-hidden="true"
      />
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2 id="garage-blackjack-title">Garage Blackjack</h2>
        </div>
        <div className="garage-blackjack-header-actions">
          <dl
            className="garage-blackjack-score"
            aria-label={`Session score: ${score.wins} wins, ${score.losses} losses, ${score.pushes} pushes`}
          >
            <div>
              <dt>Wins</dt>
              <dd>{score.wins}</dd>
            </div>
            <div>
              <dt>Losses</dt>
              <dd>{score.losses}</dd>
            </div>
            <div>
              <dt>Pushes</dt>
              <dd>{score.pushes}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="garage-blackjack-lobby"
            onClick={toggleCasinoLobby}
            aria-pressed={casinoLobby}
            disabled={!termsAcknowledged}
            title="Press L to toggle lobby sound"
          >
            {casinoLobby ? "Lobby sound on" : "Lobby sound off"}
          </button>
          <button
            type="button"
            className="garage-blackjack-advanced"
            onClick={() => setAdvancedMode((on) => !on)}
            aria-pressed={advancedMode}
            disabled={!termsAcknowledged || Boolean(round && !round.over)}
          >
            {advancedMode ? "Advanced rules on" : "Advanced rules"}
          </button>
          <button
            type="button"
            className="garage-blackjack-deal"
            onClick={deal}
            disabled={!canDeal}
            title="Press D to deal"
          >
            Deal hand
          </button>
        </div>
      </header>
      <p className="garage-blackjack-intro">
        You are the player. The house is the dealer. Finish closer to 21 without going over. Every
        hand is free.
      </p>
      {round ? (
        <div className={`garage-blackjack-table${outcome ? ` is-${outcome}-win` : ""}`}>
          <div className="garage-blackjack-hand is-house">
            <span>
              <b>House</b> Dealer{" "}
              {round.over
                ? `total ${round.dealer.cardTotal}`
                : `showing ${dealerShowingTotal(round)}`}
            </span>
            <div>
              {round.dealer.cards.map((card) => (
                <PlayingCard card={card} key={card.id} />
              ))}
            </div>
          </div>
          <div className="garage-blackjack-marker" aria-hidden="true">
            {outcome === "player" ? (
              <>
                <strong>You win</strong>
                <small>Free hand complete</small>
              </>
            ) : null}
            {outcome === "house" ? (
              <>
                <strong>House wins</strong>
                <small>Try the next hand</small>
              </>
            ) : null}
            {outcome === "push" ? (
              <>
                <strong>Hand complete</strong>
                <small>Check the table result</small>
              </>
            ) : null}
            {!outcome ? (
              <>
                YOU PLAY
                <br />
                THE HOUSE
                <br />
                <small>GET CLOSE TO 21</small>
              </>
            ) : null}
          </div>
          <div className="garage-blackjack-player-hands">
            {round.players.map((player, index) => (
              <div
                className={`garage-blackjack-hand is-player${index === round.activeHand && !round.over ? " is-active" : ""}`}
                key={player.cards.map((card) => card.id).join("-")}
              >
                <span>
                  <b>{round.players.length > 1 ? `You ${index + 1}` : "You"}</b> Player total{" "}
                  {player.cardTotal}
                  {player.surrendered ? " - surrendered" : player.doubled ? " - doubled" : ""}
                </span>
                <div>
                  {player.cards.map((card) => (
                    <PlayingCard card={card} key={card.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="garage-blackjack-table is-empty" aria-hidden="true">
          <span>YOU PLAY THE HOUSE</span>
          <small>Deal a hand to start</small>
        </div>
      )}
      <p className="match-game-status" role="status">
        {status}
      </p>
      <div className="garage-blackjack-controls">
        <button
          type="button"
          onClick={() => play("hit")}
          disabled={!termsAcknowledged || !round || round.over}
          title="Press H to hit"
        >
          Hit
        </button>
        <button
          type="button"
          onClick={() => play("stand")}
          disabled={!termsAcknowledged || !round || round.over}
          title="Press S to stand"
        >
          Stand
        </button>
        {advancedMode ? (
          <button
            type="button"
            onClick={() => play("double")}
            disabled={!canDouble}
            title="Draw one card, then stand"
          >
            Double
          </button>
        ) : null}
        {advancedMode ? (
          <button
            type="button"
            onClick={() => play("split")}
            disabled={!canSplit}
            title="Split a matching pair into two hands"
          >
            Split pair
          </button>
        ) : null}
        {advancedMode ? (
          <button
            type="button"
            onClick={() => play("surrender")}
            disabled={!canSurrender}
            title="End this hand as a loss"
          >
            Surrender
          </button>
        ) : null}
        <button
          type="button"
          onClick={leaveTable}
          disabled={!termsAcknowledged || !round || round.over}
          title="Press Q to quit"
        >
          Quit table
        </button>
        {round?.over && canDeal ? (
          <button type="button" onClick={deal}>
            Deal again
          </button>
        ) : null}
        {quit ? (
          <button type="button" onClick={resetSession}>
            New table
          </button>
        ) : null}
      </div>
      {termsAcknowledged ? (
        <button
          type="button"
          className="garage-blackjack-details-toggle"
          onClick={() => setShowTableDetails((show) => !show)}
          aria-expanded={showTableDetails}
        >
          {showTableDetails ? "Hide table details" : "Show table details"}
        </button>
      ) : null}
      <div className="garage-blackjack-details" hidden={termsAcknowledged && !showTableDetails}>
        <p className="garage-blackjack-keys">
          <b>Keys:</b> 1 deal, 2 hit, 3 stand. D, H, and S also work. Q leaves the table; L toggles
          lobby sound.
        </p>
        {advancedMode ? (
          <p className="garage-blackjack-advanced-note">
            <b>Advanced rules:</b> Split matching pairs once. Double draws one final card. Surrender
            ends an opening hand as a loss. These are free-play actions only.
          </p>
        ) : null}
        <p className="garage-blackjack-audio-credit">
          Lobby ambience:{" "}
          <a
            href="https://pixabay.com/sound-effects/people-casino-ambiance-19130/"
            target="_blank"
            rel="noreferrer"
          >
            Casino Ambiance by freesound_community via Pixabay{" "}
            <span className="sr-only">(opens in a new tab)</span>↗
          </a>
        </p>
        <p className="garage-blackjack-notice">
          For entertainment only. Every hand is free and has no cash value. The session score is
          display-only and unlocks nothing. There are no chips, prizes, discounts, services,
          rewards, betting, wagers, winnings, or payouts.
        </p>
        <label className="garage-blackjack-acknowledgement">
          <input
            type="checkbox"
            checked={termsAcknowledged}
            onChange={(event) => setTermsAcknowledged(event.target.checked)}
          />
          <span>I acknowledge the free-play table terms.</span>
        </label>
        <details className="garage-blackjack-legal">
          <summary>More information</summary>
          <p>
            This game is designed as a free, display-only amusement. Read the current New Jersey
            statutory definition of gambling in{" "}
            <a
              href="https://lis.njleg.state.nj.us/nxt/gateway.dll?f=xhitlist&vid=Publish%3A10.1048%2FEnu&xhitlist_d=&xhitlist_hc=%5BXML%5D%5BKwic%2C25%5D&xhitlist_mh=99999&xhitlist_q=%5BRank+100%5D%5BDomain%3A+2C%3A37-1.+Definitions%5D2C%3A37-1.+Definitions&xhitlist_s=relevance-weight&xhitlist_sel=title%3Bpath%3Brelevance-weight%3Bcontent-type%3Bhome-title%3Bitem-bookmark%3Btitle-path%3Bhit-context&xhitlist_vpc=first&xhitlist_vps=20&xhitlist_vq=2C%3A37-1.+Definitions&xhitlist_x=advanced&xhitlist_xsl=xhitlist.xsl"
              target="_blank"
              rel="noreferrer"
            >
              N.J.S.A. 2C:37-1 <span className="sr-only">(opens in a new tab)</span>↗
            </a>
            .
          </p>
        </details>
      </div>
    </section>
  );
}
