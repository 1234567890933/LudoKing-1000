/**
 * Luck assist.
 *
 * When a player hands their turn to the bot, the design asks for a small nudge in their favour.
 * This module is that nudge, and it is deliberately visible: the UI shows "Assist: light" and
 * the roll history marks boosted rolls, so nobody can mistake it for a fair die.
 *
 * The mechanism is a single extra draw, kept only when it is better than the first. It never
 * changes the probability of the *first* roll, so the game stays recognisable, and it is
 * bounded: at most `ASSIST_RATES[level]` of rolls can ever be replaced.
 *
 * IMPORTANT: this exists for the offline, single-device game only. If this app ever gains
 * online play, assist must be forced off for every online seat — boosting a roll against
 * another human is cheating, not assistance.
 */
import {rollFairDice} from '../../helpers/ludoRules';

export type AssistLevel = 'off' | 'light' | 'strong';

export const ASSIST_RATES: Record<AssistLevel, number> = {
  off: 0,
  light: 0.35,
  strong: 0.6,
};

export type AssistResult = {
  roll: number;
  /** True when the second draw replaced the first. */
  boosted: boolean;
};

/**
 * Roll once, then maybe roll again and keep the better face.
 * `reroll` is injected so the dice stream stays the single source of randomness.
 */
export function assistedRoll(
  baseRoll: number,
  level: AssistLevel,
  reroll: () => number = () => rollFairDice(),
  random: () => number = Math.random,
): AssistResult {
  const rate = ASSIST_RATES[level] ?? 0;
  if (rate <= 0 || random() >= rate) {
    return {roll: baseRoll, boosted: false};
  }
  const second = reroll();
  return second > baseRoll
    ? {roll: second, boosted: true}
    : {roll: baseRoll, boosted: false};
}
