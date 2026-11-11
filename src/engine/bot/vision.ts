/**
 * The bot's "eye": how much of the opponent's next turn it can see.
 *
 * A human sees the whole board and can count six squares ahead of every enemy piece, so a bot
 * that cannot is just blind. But a bot that sees everything perfectly plays like a machine and
 * stops being fun. This module therefore gives the bot *partial* vision: it samples a fraction
 * of the opponent's (die value) space and estimates the capture probability of each of our
 * pieces from that sample.
 *
 * With a coverage of 1/6 it looks at exactly one die value per opponent, which is the ~17 %
 * the design calls for. The estimate is an unbiased rate over the sampled dice, not a
 * fabricated number: if the sampled die can capture a piece, that piece's risk is 1/k where k
 * is the number of dice values examined.
 */
import {GameModel, Piece, applyMove, legalMoves} from '../gameEngine';

export type VisionOptions = {
  /** Fraction of the six die values examined per opponent, 0..1. Default 1/6. */
  coverage?: number;
  random?: () => number;
};

/** Piece id -> estimated probability (0..1) of being captured on the opponent's next turn. */
export type ThreatMap = Record<string, number>;

export const DEFAULT_VISION_COVERAGE = 1 / 6;

function sampleDice(coverage: number, random: () => number): number[] {
  const wanted = Math.min(6, Math.max(1, Math.round(6 * coverage)));
  const all = [1, 2, 3, 4, 5, 6];
  // Deterministic partial shuffle: take `wanted` distinct values.
  for (let i = all.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = all[i];
    all[i] = all[j];
    all[j] = tmp;
  }
  return all.slice(0, wanted);
}

/**
 * Estimated chance that each of our pieces is captured by any opponent on their next turn.
 * Pieces that are already home or safe are omitted, because they cannot be taken.
 */
export function scanOpponents(
  model: GameModel,
  playerNo: number,
  options: VisionOptions = {},
): ThreatMap {
  const random = options.random ?? Math.random;
  const coverage = options.coverage ?? DEFAULT_VISION_COVERAGE;
  const diceValues = sampleDice(coverage, random);
  const threats: ThreatMap = {};

  for (let p = 1; p <= model.playerCount; p += 1) {
    if (p === playerNo) {
      continue;
    }
    for (const dice of diceValues) {
      const moves: Piece[] = legalMoves(model, p, dice);
      for (const move of moves) {
        const result = applyMove(model, p, move.id, dice);
        if (result.captured) {
          const previous = threats[result.captured] ?? 0;
          // Each opponent rolls once, so the contribution of one die value is 1/k of that
          // opponent's turn, spread across the opponents that can reach us.
          threats[result.captured] = Math.min(
            1,
            previous + 1 / (diceValues.length * Math.max(1, model.playerCount - 1)),
          );
        }
      }
    }
  }
  return threats;
}

/** Convenience: risk for one piece id, 0 when unknown. */
export const threatOf = (map: ThreatMap, pieceId: string): number =>
  map[pieceId] ?? 0;
