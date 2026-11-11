/**
 * Colour grading for the board and the lobby.
 *
 * The old screens used flat saturated primaries, which is why they read as a toy rather than as
 * a game. The palette here keeps the four seat identities that players already recognise —
 * red, green, yellow, blue — but grades them: each seat colour has a light face for the token
 * and a deep face for its shadow, and the background is a deep navy rather than black so the
 * glass panels have something to refract.
 *
 * Contrast is deliberate: body text sits at 4.5:1 or better on the panel fill, and no seat
 * colour is used for text anywhere.
 */

export const SEAT_COLORS = {
  red: {face: '#F05561', deep: '#8E1B25', glow: '#FF7C86'},
  green: {face: '#37C97E', deep: '#12613C', glow: '#5BE39B'},
  yellow: {face: '#F7C948', deep: '#8A6406', glow: '#FFDA73'},
  blue: {face: '#4E93FF', deep: '#1A3F86', glow: '#7CB2FF'},
} as const;

export type SeatName = keyof typeof SEAT_COLORS;

/** Seat order used by the board: 1 = red, 2 = green, 3 = yellow, 4 = blue. */
export const SEAT_ORDER: SeatName[] = ['red', 'green', 'yellow', 'blue'];

export const PALETTE = {
  bgTop: '#0B1026',
  bgMid: '#080C1C',
  bgBottom: '#04060F',

  text: '#F3F6FF',
  textDim: 'rgba(243,246,255,0.64)',
  textFaint: 'rgba(243,246,255,0.38)',

  gold: '#F5C56B',
  cyan: '#63E6F2',
  violet: '#9A8CFF',
  danger: '#FF7A7A',

  boardRim: 'rgba(255,255,255,0.14)',
  boardInner: '#101833',
} as const;

export const seatColor = (seat: number) =>
  SEAT_COLORS[SEAT_ORDER[(Math.max(1, Math.min(4, seat)) - 1) % 4]];

/** Background gradient stops, top to bottom. */
export const BACKGROUND_STOPS = [PALETTE.bgTop, PALETTE.bgMid, PALETTE.bgBottom];
