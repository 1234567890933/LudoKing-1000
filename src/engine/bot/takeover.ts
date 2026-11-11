/**
 * Mid-match takeover.
 *
 * The feature: you are in the middle of a game, you have to leave the room, and you tap one
 * button. The bot plays your seat until you come back. This module holds the rules for that,
 * and nothing else, so the behaviour is testable without rendering anything.
 *
 * The hard limit from the design: a match may never contain more than two bots. That cap is
 * enforced here rather than in the UI, because a UI-only check can be bypassed by any future
 * caller.
 */

export const MAX_BOTS_PER_MATCH = 2;

export type SeatPlan = {
  /** Human players seated at the table. */
  humans: number;
  /** Bots already seated, including any seat handed over to a takeover. */
  bots: number;
};

/** True when another bot seat may be added without breaking the two-bot rule. */
export const canAddBot = (plan: SeatPlan): boolean =>
  plan.bots < MAX_BOTS_PER_MATCH && plan.bots + 1 <= plan.humans + plan.bots;

export type TakeoverState = {
  /** True while the bot is playing on the player's behalf. */
  active: boolean;
  /** Seat the bot is playing, 1-based, or null. */
  playerNo: number | null;
  /** How many moves the bot has played in this takeover. */
  movesPlayed: number;
};

export const idleTakeover: TakeoverState = {
  active: false,
  playerNo: null,
  movesPlayed: 0,
};

export const startTakeover = (playerNo: number): TakeoverState => ({
  active: true,
  playerNo,
  movesPlayed: 0,
});

export const stopTakeover = (): TakeoverState => ({...idleTakeover});

export const recordTakeoverMove = (state: TakeoverState): TakeoverState =>
  state.active ? {...state, movesPlayed: state.movesPlayed + 1} : state;

/** The bot should act when the takeover is on and it is that seat's turn. */
export const shouldAutoPlay = (
  state: TakeoverState,
  currentPlayer: number,
): boolean => state.active && state.playerNo === currentPlayer;
