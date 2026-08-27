import { describe, expect, it } from 'vitest';
import {
  applyResult,
  BOX_INTERVALS,
  dueExercises,
  dueDayForBox,
  isDue,
  isMastered,
  knownCardIds,
  masteryRatio,
  newProgress,
  nextBox,
  trackTally,
  type Box,
  type ExerciseProgress,
} from './leitner';

const at = (box: Box, dueDay = '2026-08-26'): ExerciseProgress => ({
  box,
  dueDay,
  seen: 3,
  lapses: 1,
  lastResult: 'right',
});

describe('nextBox', () => {
  it('promotes one box on a clean answer', () => {
    expect(nextBox(0, 'right')).toBe(1);
    expect(nextBox(3, 'right')).toBe(4);
  });

  it('caps promotion at box 5', () => {
    expect(nextBox(5, 'right')).toBe(5);
  });

  it('drops two boxes on a miss, so old material comes back fast', () => {
    expect(nextBox(5, 'wrong')).toBe(3);
    expect(nextBox(3, 'wrong')).toBe(1);
  });

  it('treats "unsure" exactly like a miss', () => {
    expect(nextBox(4, 'unsure')).toBe(nextBox(4, 'wrong'));
  });

  it('floors at box 0', () => {
    expect(nextBox(1, 'wrong')).toBe(0);
    expect(nextBox(0, 'wrong')).toBe(0);
  });
});

describe('due scheduling', () => {
  it('uses the published interval table', () => {
    expect(BOX_INTERVALS).toEqual([0, 1, 3, 7, 16, 35]);
  });

  it('schedules box 0 for today', () => {
    expect(dueDayForBox(0, '2026-08-26')).toBe('2026-08-26');
  });

  it('schedules each box its documented distance out', () => {
    expect(dueDayForBox(1, '2026-08-26')).toBe('2026-08-27');
    expect(dueDayForBox(2, '2026-08-26')).toBe('2026-08-29');
    expect(dueDayForBox(3, '2026-08-26')).toBe('2026-09-02');
    expect(dueDayForBox(4, '2026-08-26')).toBe('2026-09-11');
    expect(dueDayForBox(5, '2026-08-26')).toBe('2026-09-30');
  });
});

describe('applyResult', () => {
  it('promotes and reschedules on a right answer', () => {
    const next = applyResult(at(2), 'right', '2026-08-26');
    expect(next.box).toBe(3);
    expect(next.dueDay).toBe('2026-09-02');
    expect(next.lastResult).toBe('right');
  });

  it('counts every presentation', () => {
    expect(applyResult(at(2), 'right', '2026-08-26').seen).toBe(4);
    expect(applyResult(at(2), 'wrong', '2026-08-26').seen).toBe(4);
  });

  it('counts a lapse only on a miss', () => {
    expect(applyResult(at(2), 'right', '2026-08-26').lapses).toBe(1);
    expect(applyResult(at(2), 'wrong', '2026-08-26').lapses).toBe(2);
    expect(applyResult(at(2), 'unsure', '2026-08-26').lapses).toBe(2);
  });

  it('brings a missed item back the next day, not in a fortnight', () => {
    const next = applyResult(at(5), 'wrong', '2026-08-26');
    expect(next.box).toBe(3);
    expect(next.dueDay).toBe('2026-09-02');
  });

  it('makes a missed new item due immediately', () => {
    const next = applyResult(newProgress('2026-08-26'), 'wrong', '2026-08-26');
    expect(next.box).toBe(0);
    expect(next.dueDay).toBe('2026-08-26');
  });

  it('does not mutate the input', () => {
    const before = at(2);
    applyResult(before, 'wrong', '2026-08-26');
    expect(before).toEqual(at(2));
  });
});

describe('mastery', () => {
  it('is reached at box 4', () => {
    expect(isMastered(at(3))).toBe(false);
    expect(isMastered(at(4))).toBe(true);
    expect(isMastered(at(5))).toBe(true);
  });

  it('scores a track as mastered-over-total', () => {
    const all = { a: at(4), b: at(5), c: at(1) };
    expect(masteryRatio(['a', 'b', 'c', 'd'], all)).toBe(0.5);
  });

  it('counts unseen exercises as not mastered', () => {
    expect(masteryRatio(['x', 'y'], {})).toBe(0);
  });

  it('is 0 for an empty track rather than NaN', () => {
    expect(masteryRatio([], {})).toBe(0);
  });
});

describe('trackTally', () => {
  it('counts seen and mastered separately', () => {
    const all = { a: at(4), b: at(5), c: at(1) };
    expect(trackTally(['a', 'b', 'c', 'd'], all)).toEqual({ total: 4, seen: 3, mastered: 2 });
  });

  it('leaves an untouched track at zero without dividing by anything', () => {
    expect(trackTally(['x', 'y'], {})).toEqual({ total: 2, seen: 0, mastered: 0 });
    expect(trackTally([], {})).toEqual({ total: 0, seen: 0, mastered: 0 });
  });

  it('counts a wrong answer as seen, which is the point of the second layer', () => {
    const wrong = applyResult(newProgress('2026-08-26'), 'wrong', '2026-08-26');
    expect(trackTally(['a'], { a: wrong })).toEqual({ total: 1, seen: 1, mastered: 0 });
  });

  it('moves on the first session, when mastery still cannot', () => {
    const day0 = applyResult(newProgress('2026-08-26'), 'right', '2026-08-26');
    expect(trackTally(['a', 'b'], { a: day0 })).toEqual({ total: 2, seen: 1, mastered: 0 });
    expect(masteryRatio(['a', 'b'], { a: day0 })).toBe(0);
  });

  it('never reports more mastered than seen', () => {
    const all = { a: at(5), b: at(0) };
    const tally = trackTally(['a', 'b'], all);
    expect(tally.mastered).toBeLessThanOrEqual(tally.seen);
  });
});

describe('dueExercises', () => {
  const all = {
    't1-03': at(2, '2026-08-20'),
    't1-01': at(1, '2026-08-26'),
    't1-02': at(3, '2026-09-10'),
    't1-04': at(2, '2026-08-20'),
  };

  it('includes overdue and due-today, excludes the future', () => {
    expect(dueExercises(all, '2026-08-26')).toEqual(['t1-03', 't1-04', 't1-01']);
  });

  it('puts the most overdue first and breaks ties on id', () => {
    const [first, second] = dueExercises(all, '2026-08-26');
    expect(first).toBe('t1-03');
    expect(second).toBe('t1-04');
  });

  it('returns nothing when everything is scheduled ahead', () => {
    expect(dueExercises(all, '2026-08-01')).toEqual([]);
  });

  it('treats due-today as due', () => {
    expect(isDue(at(1, '2026-08-26'), '2026-08-26')).toBe(true);
    expect(isDue(at(1, '2026-08-27'), '2026-08-26')).toBe(false);
  });
});

describe('knownCardIds', () => {
  const cards = [{ id: 'closure' }, { id: 'hashing' }, { id: 'orphan' }];
  const exercises = [
    { id: 'a', conceptId: 'closure' },
    { id: 'b', conceptId: 'closure' },
    { id: 'c', conceptId: 'hashing' },
  ];

  it('knows a card only when every exercise linking to it is mastered', () => {
    const known = knownCardIds(cards, exercises, { a: at(4), b: at(5), c: at(2) });
    expect([...known]).toEqual(['closure']);
  });

  it('does not know a card with an exercise never attempted', () => {
    const known = knownCardIds(cards, exercises, { a: at(4) });
    expect(known.has('closure')).toBe(false);
  });

  it('never knows a card nothing links to', () => {
    const known = knownCardIds(cards, exercises, { a: at(5), b: at(5), c: at(5) });
    expect(known.has('orphan')).toBe(false);
    expect(known.size).toBe(2);
  });
});
