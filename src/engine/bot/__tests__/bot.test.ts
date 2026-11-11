/**
 * Tests for the offline bot stack.
 *
 * These are the tests that matter for the claims made in the UI: that the Oracle really is
 * capped near 49 % accuracy, that the personalities really score differently, that the assist
 * never fires when it is off, and that the two-bot cap holds.
 */
import {createModel, applyMove, legalMoves, isSafeSquare, GameModel, Piece} from '../../gameEngine';
import {victoryStart} from '../../../helpers/PlotData';
import {
  ORACLE_ACCURACY,
  peekFuture,
  trueFuture,
} from '../oracle';
import {scanOpponents, threatOf} from '../vision';
import {chooseStrongMove, evaluateMove} from '../strongAi';
import {ASSIST_RATES, assistedRoll} from '../assist';
import {
  MAX_BOTS_PER_MATCH,
  canAddBot,
  idleTakeover,
  recordTakeoverMove,
  shouldAutoPlay,
  startTakeover,
  stopTakeover,
} from '../takeover';
import {BOT_ORDER, BOT_PROFILES} from '../types';

const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) >>> 0;
    return ((s >>> 8) & 0xffffff) / 0x1000000;
  };
};

/** Put one of our pieces on the board and one enemy piece where it can be taken. */
function modelWith(ourPos: number, enemyPos: number): GameModel {
  const model = createModel(2);
  model.players[0][0] = {id: 'A1', pos: ourPos, travelCount: ourPos};
  model.players[1][0] = {id: 'B1', pos: enemyPos, travelCount: enemyPos};
  return model;
}

/** Search the board for a real capture our piece can make with `dice`. */
function findCaptureScenario(dice: number): {ourPos: number; enemyPos: number} | null {
  for (let ourPos = 1; ourPos <= 52; ourPos += 1) {
    for (let enemyPos = 1; enemyPos <= 52; enemyPos += 1) {
      if (ourPos === enemyPos) {
        continue;
      }
      const model = modelWith(ourPos, enemyPos);
      const moves = legalMoves(model, 1, dice);
      if (!moves.some((m: Piece) => m.id === 'A1')) {
        continue;
      }
      if (applyMove(model, 1, 'A1', dice).captured === 'B1') {
        return {ourPos, enemyPos};
      }
    }
  }
  return null;
}

describe('Oracle dice foresight', () => {
  it('is correct about as often as it claims, and never more', () => {
    const random = seeded(7);
    let correct = 0;
    const rounds = 20000;
    for (let i = 0; i < rounds; i += 1) {
      const seed = 1000 + i;
      const truth = trueFuture(seed, 3, 1)[0];
      const peek = peekFuture(seed, 3, 1, random)[0];
      if (peek === truth) {
        correct += 1;
      }
    }
    const rate = correct / rounds;
    expect(rate).toBeGreaterThan(ORACLE_ACCURACY - 0.02);
    expect(rate).toBeLessThan(ORACLE_ACCURACY + 0.02);
    expect(rate).toBeLessThan(0.5);
  });

  it('reports a different face whenever it is wrong', () => {
    // A random source that always lands above the accuracy threshold forces a wrong peek.
    const alwaysWrong = () => 0.99;
    const truth = trueFuture(42, 5, 2);
    const peek = peekFuture(42, 5, 2, alwaysWrong);
    expect(peek).toHaveLength(2);
    peek.forEach((face: number, i: number) => {
      expect(face).toBeGreaterThanOrEqual(1);
      expect(face).toBeLessThanOrEqual(6);
      expect(face).not.toBe(truth[i]);
    });
  });
});

describe('vision', () => {
  it('sees a piece standing in front of an enemy', () => {
    const scenario = findCaptureScenario(2);
    expect(scenario).not.toBeNull();
    const {ourPos, enemyPos} = scenario!;
    if (isSafeSquare(ourPos)) {
      return; // safe squares cannot be taken; nothing to see
    }
    const model = modelWith(ourPos, enemyPos);
    // Full coverage so the sampled die set certainly contains the capturing face.
    const threats = scanOpponents(model, 1, {coverage: 1, random: seeded(3)});
    expect(threatOf(threats, 'A1')).toBeGreaterThan(0);
  });

  it('reports no threat when nothing can reach us', () => {
    const model = createModel(2);
    model.players[0][0] = {id: 'A1', pos: 5, travelCount: 5};
    // Enemy still in its pocket: it cannot capture anything.
    const threats = scanOpponents(model, 1, {coverage: 1, random: seeded(4)});
    expect(threatOf(threats, 'A1')).toBe(0);
  });
});

describe('advanced bot decisions', () => {
  it('returns null when no move is legal', () => {
    const model = createModel(2);
    expect(chooseStrongMove(model, 1, 3)).toBeNull();
  });

  it('takes a capture when one is available', () => {
    const dice = 3;
    const scenario = findCaptureScenario(dice);
    expect(scenario).not.toBeNull();
    const {ourPos, enemyPos} = scenario!;
    const model = modelWith(ourPos, enemyPos);
    const chosen = chooseStrongMove(model, 1, dice, {
      personality: 'aggressive',
      random: seeded(11),
    });
    expect(chosen?.id).toBe('A1');
  });

  it('scores the same risky move lower for Sentinel than for Raider', () => {
    // Find a position where the move really does land in front of an enemy, so the risk term
    // is exercised instead of being skipped.
    let model: GameModel | null = null;
    for (let ourPos = 1; ourPos <= 52 && !model; ourPos += 1) {
      for (let enemyPos = 1; enemyPos <= 52 && !model; enemyPos += 1) {
        if (ourPos === enemyPos) {
          continue;
        }
        const candidate = modelWith(ourPos, enemyPos);
        const moves = legalMoves(candidate, 1, 1);
        if (!moves.some((m: Piece) => m.id === 'A1')) {
          continue;
        }
        const after = applyMove(candidate, 1, 'A1', 1);
        const moved = after.model.players[0].find((p: Piece) => p.id === 'A1')!;
        const threats = scanOpponents(after.model, 1, {coverage: 1, random: seeded(5)});
        if (threatOf(threats, moved.id) > 0) {
          model = candidate;
        }
      }
    }
    expect(model).not.toBeNull();
    const piece: Piece = model!.players[0][0];
    const cautious = evaluateMove(model!, 1, piece, 1, {
      personality: 'cautious',
      vision: 1,
      random: seeded(5),
    });
    const aggressive = evaluateMove(model!, 1, piece, 1, {
      personality: 'aggressive',
      vision: 1,
      random: seeded(5),
    });
    expect(aggressive).toBeGreaterThan(cautious);
  });

  it('prefers the move that finishes the game', () => {
    const model = createModel(2);
    const lanePos = victoryStart[0] + 5;
    model.players[0][0] = {id: 'A1', pos: lanePos, travelCount: 56};
    model.players[0][1] = {id: 'A2', pos: 3, travelCount: 3};
    const chosen = chooseStrongMove(model, 1, 1, {
      personality: 'oracle',
      random: seeded(9),
    });
    expect(chosen?.id).toBe('A1');
  });

  it('has three distinct personalities with profiles', () => {
    expect(BOT_ORDER).toHaveLength(3);
    for (const id of BOT_ORDER) {
      expect(BOT_PROFILES[id].name.length).toBeGreaterThan(0);
      expect(BOT_PROFILES[id].blurb.length).toBeGreaterThan(0);
    }
  });
});

describe('luck assist', () => {
  it('never changes the roll when it is off', () => {
    for (let i = 0; i < 200; i += 1) {
      const result = assistedRoll(3, 'off', () => 6, () => 0);
      expect(result.roll).toBe(3);
      expect(result.boosted).toBe(false);
    }
  });

  it('boosts more often on strong than on light', () => {
    const random = seeded(21);
    const count = (level: 'light' | 'strong') => {
      let boosted = 0;
      for (let i = 0; i < 4000; i += 1) {
        if (assistedRoll(2, level, () => 5, random).boosted) {
          boosted += 1;
        }
      }
      return boosted;
    };
    const light = count('light');
    const strong = count('strong');
    expect(strong).toBeGreaterThan(light);
    expect(strong / 4000).toBeLessThanOrEqual(ASSIST_RATES.strong + 0.03);
  });
});

describe('takeover', () => {
  it('caps a match at two bots', () => {
    expect(MAX_BOTS_PER_MATCH).toBe(2);
    expect(canAddBot({humans: 2, bots: 1})).toBe(true);
    expect(canAddBot({humans: 2, bots: 2})).toBe(false);
    expect(canAddBot({humans: 4, bots: 2})).toBe(false);
  });

  it('tracks the takeover lifecycle', () => {
    expect(shouldAutoPlay(idleTakeover, 1)).toBe(false);
    const started = startTakeover(2);
    expect(shouldAutoPlay(started, 2)).toBe(true);
    expect(shouldAutoPlay(started, 1)).toBe(false);
    const after = recordTakeoverMove(started);
    expect(after.movesPlayed).toBe(1);
    expect(stopTakeover().active).toBe(false);
  });
});
