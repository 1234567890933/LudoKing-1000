/**
 * The advanced bot.
 *
 * The stock AI scores each legal move once and takes the best score. That is a decent opponent
 * but it is one-ply blind: it does not reason about what the opponent will do back, and it
 * cannot see the dice at all.
 *
 * This module adds three things on top of the same scoring function:
 *
 *  1. **Risk from vision.** After simulating a move, the bot asks [scanOpponents] how exposed
 *     the moved piece is, and subtracts the expected loss. The weight differs per personality:
 *     Sentinel pays 1.4x, Raider only 0.6x.
 *  2. **Dice foresight.** The Oracle gets the next rolls from [peekFuture] — 49 % accurate, by
 *     construction — and adds a bonus for moves that would set up a capture on one of those
 *     faces.
 *  3. **Personality.** Capture value, safety value and exposure are weighted differently, so
 *     the three bots genuinely play differently instead of being the same bot in three hats.
 *
 * Everything is pure and seeded, so a bot game is reproducible in a test.
 */
import {GameModel, Piece, applyMove, legalMoves} from '../gameEngine';
import {scoreMove} from '../ai';
import {BotPersonality} from './types';
import {DEFAULT_VISION_COVERAGE, ThreatMap, scanOpponents, threatOf} from './vision';
import {ORACLE_ACCURACY, ORACLE_LOOKAHEAD, peekFuture} from './oracle';

export type OracleOptions = {
  seed?: number;
  rollCount?: number;
  lookahead?: number;
  random?: () => number;
};

export type StrongOptions = {
  personality?: BotPersonality;
  /** Fraction of the opponent dice space the bot can see, 0..1. */
  vision?: number;
  /** When present, the bot may use dice foresight. */
  oracle?: OracleOptions | null;
  random?: () => number;
};

const RISK_WEIGHT: Record<BotPersonality, number> = {
  cautious: 1.4,
  aggressive: 0.6,
  oracle: 1.0,
};

const CAPTURE_WEIGHT: Record<BotPersonality, number> = {
  cautious: 0.9,
  aggressive: 1.3,
  oracle: 1.0,
};

const isVictoryLane = (pos: number, victoryStart: number[]): boolean =>
  victoryStart.some(s => pos >= s && pos < s + 6);

/** Value of a capture, in the same units as [scoreMove]. */
const captureValue = (travelCount: number): number => 350 + travelCount * 4;

/**
 * Best capture the bot could make next turn if `face` came up, as a score.
 * Used by the Oracle to value a setup move.
 */
function futureCaptureValue(
  model: GameModel,
  playerNo: number,
  face: number,
  victoryStart: number[],
): number {
  let best = 0;
  for (const move of legalMoves(model, playerNo, face)) {
    const result = applyMove(model, playerNo, move.id, face);
    if (result.won) {
      return 100000;
    }
    if (result.captured) {
      const victim = model.players.flat().find(p => p.id === result.captured);
      best = Math.max(best, captureValue(victim?.travelCount ?? 0));
    } else if (result.reachedHome) {
      best = Math.max(best, 600);
    }
  }
  return best;
}

/**
 * Score one candidate move for the advanced bot. Exported so the personalities can be tested
 * without running a whole game.
 */
export function evaluateMove(
  model: GameModel,
  playerNo: number,
  piece: Piece,
  dice: number,
  options: StrongOptions = {},
  threats?: ThreatMap,
  victoryStart: number[] = [],
): number {
  const personality = options.personality ?? 'oracle';
  const random = options.random ?? Math.random;
  const vision = options.vision ?? DEFAULT_VISION_COVERAGE;

  const base = scoreMove(model, playerNo, piece, dice);
  const result = applyMove(model, playerNo, piece.id, dice);
  const moved = result.model.players[playerNo - 1].find(p => p.id === piece.id);
  if (!moved) {
    return base;
  }

  let score = base;

  // Captures are worth more or less depending on who is playing.
  if (result.captured) {
    const victim = model.players.flat().find(p => p.id === result.captured);
    score += captureValue(victim?.travelCount ?? 0) * (CAPTURE_WEIGHT[personality] - 1);
  }

  // Exposure after the move, as estimated by partial vision.
  const map = threats ?? scanOpponents(result.model, playerNo, {coverage: vision, random});
  const risk = threatOf(map, moved.id);
  if (risk > 0) {
    const exposure = moved.travelCount * 3 + 120;
    score -= risk * exposure * RISK_WEIGHT[personality];
  }

  // Dice foresight, Oracle only.
  if (personality === 'oracle' && options.oracle) {
    const lookahead = options.oracle.lookahead ?? ORACLE_LOOKAHEAD;
    const faces = peekFuture(
      options.oracle.seed,
      options.oracle.rollCount ?? 0,
      lookahead,
      options.oracle.random ?? random,
    );
    let expected = 0;
    for (const face of faces) {
      expected += futureCaptureValue(result.model, playerNo, face, victoryStart);
    }
    // The peek is only 49 % reliable, so discount the bonus by exactly that.
    score += (expected / Math.max(1, faces.length)) * ORACLE_ACCURACY * 0.15;
  }

  // Keep a little of the stock preference for entering the home lane.
  if (moved.travelCount >= 51 && isVictoryLane(moved.pos, victoryStart)) {
    score += 40;
  }

  return score;
}

/** Choose a move for the advanced bot. Returns null when nothing can move. */
export function chooseStrongMove(
  model: GameModel,
  playerNo: number,
  dice: number,
  options: StrongOptions = {},
  victoryStart: number[] = [],
): Piece | null {
  const moves = legalMoves(model, playerNo, dice);
  if (moves.length === 0) {
    return null;
  }
  if (moves.length === 1) {
    return moves[0];
  }

  const random = options.random ?? Math.random;
  const vision = options.vision ?? DEFAULT_VISION_COVERAGE;
  // One vision scan per decision, not per candidate: the board is the same for every candidate
  // except the piece being moved, and scanning is the expensive part.
  const threats = scanOpponents(model, playerNo, {coverage: vision, random});

  let best = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const score =
      evaluateMove(model, playerNo, move, dice, options, threats, victoryStart) +
      random() * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}
