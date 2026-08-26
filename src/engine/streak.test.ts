import { describe, expect, it } from 'vitest';
import {
  completeSession,
  decayStreak,
  initialStreak,
  isActiveToday,
  MAX_FREEZES,
  type StreakState,
} from './streak';

const state = (over: Partial<StreakState> = {}): StreakState => ({
  current: 3,
  best: 5,
  lastActiveDay: '2026-08-26',
  freezes: 0,
  ...over,
});

describe('completeSession', () => {
  it('starts a streak from nothing', () => {
    const next = completeSession(initialStreak(), '2026-08-26');
    expect(next.current).toBe(1);
    expect(next.best).toBe(1);
    expect(next.lastActiveDay).toBe('2026-08-26');
  });

  it('extends the streak on a consecutive day', () => {
    expect(completeSession(state(), '2026-08-27').current).toBe(4);
  });

  it('is idempotent within the same day — a second session is not a second day', () => {
    const once = completeSession(state(), '2026-08-27');
    expect(completeSession(once, '2026-08-27')).toEqual(once);
  });

  it('restarts at 1 after an uncovered gap', () => {
    const next = completeSession(state(), '2026-08-30');
    expect(next.current).toBe(1);
  });

  it('keeps the best streak after a break', () => {
    expect(completeSession(state({ current: 9, best: 9 }), '2026-09-05').best).toBe(9);
  });

  it('raises best as the streak grows past it', () => {
    const next = completeSession(state({ current: 5, best: 5 }), '2026-08-27');
    expect(next.best).toBe(6);
  });

  it('crosses a month boundary', () => {
    expect(completeSession(state({ lastActiveDay: '2026-08-31' }), '2026-09-01').current).toBe(4);
  });
});

describe('freezes', () => {
  it('earns one at every 7 days', () => {
    expect(completeSession(state({ current: 6, freezes: 0 }), '2026-08-27').freezes).toBe(1);
    expect(completeSession(state({ current: 13, freezes: 1 }), '2026-08-27').freezes).toBe(2);
  });

  it('does not earn one on other days', () => {
    expect(completeSession(state({ current: 5, freezes: 0 }), '2026-08-27').freezes).toBe(0);
  });

  it('banks at most two', () => {
    const next = completeSession(state({ current: 20, freezes: MAX_FREEZES }), '2026-08-27');
    expect(next.freezes).toBe(MAX_FREEZES);
  });

  it('spends one to cover a single missed day', () => {
    // Last active the 26th, opening on the 28th: the 27th was missed.
    const next = decayStreak(state({ current: 8, freezes: 1 }), '2026-08-28');
    expect(next.current).toBe(8);
    expect(next.freezes).toBe(0);
  });

  it('spends two to cover two missed days', () => {
    const next = decayStreak(state({ current: 8, freezes: 2 }), '2026-08-29');
    expect(next.current).toBe(8);
    expect(next.freezes).toBe(0);
  });

  it('breaks the streak when the gap outruns the freezes', () => {
    const next = decayStreak(state({ current: 8, freezes: 1 }), '2026-08-29');
    expect(next.current).toBe(0);
    expect(next.freezes).toBe(0);
  });

  it('continues the streak through a freeze-covered gap', () => {
    const next = completeSession(state({ current: 8, freezes: 1 }), '2026-08-28');
    expect(next.current).toBe(9);
    expect(next.freezes).toBe(0);
  });
});

describe('decayStreak', () => {
  it('leaves an untouched streak alone on the same day', () => {
    const s = state();
    expect(decayStreak(s, '2026-08-26')).toEqual(s);
  });

  it('leaves it alone the very next day — nothing is missed yet', () => {
    const s = state();
    expect(decayStreak(s, '2026-08-27')).toEqual(s);
  });

  it('does nothing when there is no history', () => {
    expect(decayStreak(initialStreak(), '2026-08-26')).toEqual(initialStreak());
  });

  it('tolerates a clock that moved backwards', () => {
    const s = state();
    expect(decayStreak(s, '2026-08-20')).toEqual(s);
  });
});

describe('isActiveToday', () => {
  it('is true only on the recorded day', () => {
    expect(isActiveToday(state(), '2026-08-26')).toBe(true);
    expect(isActiveToday(state(), '2026-08-27')).toBe(false);
    expect(isActiveToday(initialStreak(), '2026-08-26')).toBe(false);
  });
});
