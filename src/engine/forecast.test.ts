import { describe, expect, it } from 'vitest';
import { addDays, type DayKey } from './dates';
import { newProgress, type ExerciseProgress } from './leitner';
import {
  forecast,
  formatDuration,
  MASTERY_TRAIL_DAYS,
  NEW_PER_ACTIVE_DAY,
  practiceRatio,
} from './forecast';

const TODAY = '2026-06-15';

/** XP on each of the given days, counted back from today. 0 = today. */
function xpOn(offsets: number[], today: DayKey = TODAY): Record<DayKey, number> {
  const out: Record<DayKey, number> = {};
  for (const back of offsets) out[addDays(today, -back)] = 10;
  return out;
}

function seenProgress(box: number): ExerciseProgress {
  return { ...newProgress(TODAY), box: box as ExerciseProgress['box'], seen: 1 };
}

function ids(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `e${i}`);
}

describe('constants', () => {
  it('reads the session size and the box ladder from the engine', () => {
    expect(NEW_PER_ACTIVE_DAY).toBe(5);
    expect(MASTERY_TRAIL_DAYS).toBe(11);
  });
});

describe('practiceRatio', () => {
  it('assumes daily practice on a fresh profile', () => {
    expect(practiceRatio({}, TODAY)).toBe(1);
  });

  it('reads about half for 7 active days out of 14', () => {
    const xp = xpOn([0, 2, 4, 6, 8, 10, 13]);
    expect(practiceRatio(xp, TODAY)).toBeCloseTo(0.5, 5);
  });

  it('assumes daily practice while the observed span is under three days', () => {
    expect(practiceRatio(xpOn([0]), TODAY)).toBe(1);
    expect(practiceRatio(xpOn([0, 1]), TODAY)).toBe(1);
    // Three days observed is enough to measure: 2 of 3.
    expect(practiceRatio(xpOn([0, 2]), TODAY)).toBeCloseTo(2 / 3, 5);
  });

  it('measures against the observed span while it is shorter than the window', () => {
    // Five days of history, three of them active.
    expect(practiceRatio(xpOn([0, 2, 4]), TODAY)).toBeCloseTo(3 / 5, 5);
  });

  it('caps the window at 14 days however long the history is', () => {
    const xp = xpOn([0, 20, 40]);
    expect(practiceRatio(xp, TODAY)).toBeCloseTo(1 / 14, 5);
  });

  it('treats a zero-XP day as inactive', () => {
    const xp = { ...xpOn([0, 4]), [addDays(TODAY, -2)]: 0 };
    expect(practiceRatio(xp, TODAY)).toBeCloseTo(2 / 5, 5);
  });

  it('never returns zero, however long the lapse', () => {
    const ratio = practiceRatio(xpOn([30, 32]), TODAY);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeCloseTo(1 / 14, 5);
  });
});

describe('forecast', () => {
  it('counts an exercise with no record, and one recorded but never presented, as unseen', () => {
    const result = forecast({
      exerciseIds: ['a', 'b'],
      progress: { b: newProgress(TODAY) },
      xpByDay: {},
      today: TODAY,
    });
    expect(result.unseen).toBe(2);
    expect(result.unmastered).toBe(2);
  });

  it('counts everything below box 4 as unmastered, seen or not', () => {
    const result = forecast({
      exerciseIds: ['a', 'b', 'c'],
      progress: { a: seenProgress(4), b: seenProgress(3) },
      xpByDay: {},
      today: TODAY,
    });
    expect(result.unseen).toBe(1);
    expect(result.unmastered).toBe(2);
  });

  it('divides the unseen pile by the pace and rounds up', () => {
    // 100 unseen, fresh profile so the pace is the full 5 a day.
    const result = forecast({
      exerciseIds: ids(100),
      progress: {},
      xpByDay: {},
      today: TODAY,
    });
    expect(result.daysToSeeAll).toBe(20);

    // 101 needs a twenty-first day for the last one.
    expect(
      forecast({ exerciseIds: ids(101), progress: {}, xpByDay: {}, today: TODAY }).daysToSeeAll,
    ).toBe(21);
  });

  it('halves the pace when half the recent days were skipped', () => {
    const result = forecast({
      exerciseIds: ids(100),
      progress: {},
      xpByDay: xpOn([0, 2, 4, 6, 8, 10, 13]),
      today: TODAY,
    });
    expect(result.daysToSeeAll).toBe(40);
  });

  it('puts the mastery trail behind the last new exercise', () => {
    const result = forecast({
      exerciseIds: ids(100),
      progress: {},
      xpByDay: {},
      today: TODAY,
    });
    expect(result.daysToMasterAll).toBe(20 + MASTERY_TRAIL_DAYS);
  });

  it('returns zero days to see when everything has been seen', () => {
    const progress = Object.fromEntries(ids(3).map((id) => [id, seenProgress(1)]));
    const result = forecast({ exerciseIds: ids(3), progress, xpByDay: {}, today: TODAY });
    expect(result.unseen).toBe(0);
    expect(result.daysToSeeAll).toBe(0);
    expect(result.daysToMasterAll).toBe(MASTERY_TRAIL_DAYS);
  });

  it('returns zero on both counts when everything is mastered', () => {
    const progress = Object.fromEntries(ids(3).map((id) => [id, seenProgress(5)]));
    const result = forecast({ exerciseIds: ids(3), progress, xpByDay: {}, today: TODAY });
    expect(result.unmastered).toBe(0);
    expect(result.daysToSeeAll).toBe(0);
    expect(result.daysToMasterAll).toBe(0);
  });

  it('flags an assumed pace on a fresh profile and drops the flag once measured', () => {
    const fresh = forecast({ exerciseIds: ids(10), progress: {}, xpByDay: {}, today: TODAY });
    expect(fresh.assumedDailyPace).toBe(true);

    const measured = forecast({
      exerciseIds: ids(10),
      progress: {},
      xpByDay: xpOn([0, 2, 4]),
      today: TODAY,
    });
    expect(measured.assumedDailyPace).toBe(false);
  });

  it('handles an empty bank without dividing by zero', () => {
    const result = forecast({ exerciseIds: [], progress: {}, xpByDay: {}, today: TODAY });
    expect(result).toEqual({
      unseen: 0,
      unmastered: 0,
      daysToSeeAll: 0,
      daysToMasterAll: 0,
      assumedDailyPace: true,
    });
  });
});

describe('formatDuration', () => {
  it('counts in days below a fortnight', () => {
    expect(formatDuration(1)).toBe('a day');
    expect(formatDuration(2)).toBe('2 days');
    expect(formatDuration(13)).toBe('13 days');
  });

  it('switches to weeks at 14 days', () => {
    expect(formatDuration(14)).toBe('2 weeks');
    expect(formatDuration(69)).toBe('10 weeks');
  });

  it('switches to months at 70 days', () => {
    expect(formatDuration(70)).toBe('2 months');
    expect(formatDuration(365)).toBe('12 months');
  });

  it('spells a singular unit as a word if the boundaries ever move', () => {
    // The 14 and 70 day boundaries make "a week" and "a month" unreachable
    // today: anything rounding to one week is still under 14 days, and
    // anything rounding to one month is still under 70. Pinning them keeps
    // the wording right rather than "1 week" if a boundary is ever retuned.
    expect(formatDuration(7)).toBe('7 days');
    expect(formatDuration(30)).toBe('4 weeks');
  });
});
