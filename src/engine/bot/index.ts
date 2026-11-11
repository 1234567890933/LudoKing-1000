/**
 * Public surface of the offline bot stack.
 *
 * Three bots, all running on the device with no model download and no network:
 *
 *  * **Sentinel** (`cautious`) — protects pieces, avoids exposed squares.
 *  * **Raider** (`aggressive`) — hunts captures and accepts risk.
 *  * **Oracle** (`oracle`) — sees the board through partial vision and the dice through a
 *    49 %-accurate peek, which makes it the strongest of the three.
 *
 * Plus the match-level rules: mid-match takeover, the two-bot cap, and the visible luck assist.
 */
export {BOT_ORDER, BOT_PROFILES} from './types';
export type {BotPersonality, BotProfile} from './types';
export {
  DEFAULT_VISION_COVERAGE,
  scanOpponents,
  threatOf,
} from './vision';
export type {ThreatMap, VisionOptions} from './vision';
export {
  ORACLE_ACCURACY,
  ORACLE_LOOKAHEAD,
  peekFuture,
  trueFuture,
} from './oracle';
export {chooseStrongMove, evaluateMove} from './strongAi';
export type {OracleOptions, StrongOptions} from './strongAi';
export {ASSIST_RATES, assistedRoll} from './assist';
export type {AssistLevel, AssistResult} from './assist';
export {
  MAX_BOTS_PER_MATCH,
  canAddBot,
  idleTakeover,
  recordTakeoverMove,
  shouldAutoPlay,
  startTakeover,
  stopTakeover,
} from './takeover';
export type {SeatPlan, TakeoverState} from './takeover';
