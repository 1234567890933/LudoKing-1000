/**
 * Half-sighted dice foresight.
 *
 * The dice in this game come from a seeded stream: `rollRandom(seed, rollCount)` derives the
 * random source for a specific roll, so the next rolls *are* computable from the game seed.
 * The Oracle bot is allowed to look at them — but deliberately badly. Each peeked value is
 * reported correctly only 49 % of the time; the rest of the time it is replaced by a different
 * face. A wrong guess is guaranteed to be wrong (never the true value), so 49 % is a hard
 * ceiling on its accuracy rather than a soft one.
 *
 * That keeps the promise in the design: the bot is better than a blind opponent, and it is
 * never a perfect cheat. It also stays fair to the player because it never changes a roll —
 * it only *reads* one, badly.
 */
import {rollFairDice} from '../../helpers/ludoRules';
import {rollRandom} from '../../helpers/diceRng';

/** Hard ceiling on how often a peek is correct. */
export const ORACLE_ACCURACY = 0.49;

/** How many upcoming rolls the Oracle looks at. */
export const ORACLE_LOOKAHEAD = 2;

function wrongFace(trueFace: number, random: () => number): number {
  const others = [1, 2, 3, 4, 5, 6].filter(f => f !== trueFace);
  return others[Math.min(others.length - 1, Math.floor(random() * others.length))];
}

/**
 * Peek at the next `lookahead` rolls of this game.
 *
 * Returns one face per upcoming roll: correct with probability 0.49, otherwise a different
 * face. The caller cannot tell which is which, which is the point.
 */
export function peekFuture(
  seed: number | undefined,
  rollCount: number,
  lookahead: number = ORACLE_LOOKAHEAD,
  random: () => number = Math.random,
): number[] {
  const peeked: number[] = [];
  for (let k = 0; k < Math.max(1, lookahead); k += 1) {
    const trueFace = rollFairDice(rollRandom(seed, rollCount + k));
    const isAccurate = random() < ORACLE_ACCURACY;
    peeked.push(isAccurate ? trueFace : wrongFace(trueFace, random));
  }
  return peeked;
}

/** The true upcoming faces. Exported for tests and for the honest "practice" mode. */
export function trueFuture(
  seed: number | undefined,
  rollCount: number,
  lookahead: number = ORACLE_LOOKAHEAD,
): number[] {
  const faces: number[] = [];
  for (let k = 0; k < Math.max(1, lookahead); k += 1) {
    faces.push(rollFairDice(rollRandom(seed, rollCount + k)));
  }
  return faces;
}
