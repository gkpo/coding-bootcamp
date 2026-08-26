import { describe, expect, it } from 'vitest';
import {
  answer,
  currentExerciseId,
  isComplete,
  resultsInOrder,
  startSession,
  totalExercises,
  toughestExerciseId,
} from './sessionRunner';

const session = () => startSession(['a', 'b', 'c']);

describe('queue progression', () => {
  it('serves exercises in order', () => {
    expect(currentExerciseId(session())).toBe('a');
  });

  it('advances past an exercise answered correctly', () => {
    expect(currentExerciseId(answer(session(), 'right'))).toBe('b');
  });

  it('completes only when the queue empties', () => {
    let s = session();
    expect(isComplete(s)).toBe(false);
    s = answer(s, 'right');
    s = answer(s, 'right');
    s = answer(s, 'right');
    expect(isComplete(s)).toBe(true);
  });

  it('does nothing when answering an already-complete session', () => {
    const done = startSession([]);
    expect(answer(done, 'right')).toEqual(done);
  });
});

describe('re-queue on a miss', () => {
  it('sends a missed exercise to the back rather than dropping it', () => {
    const s = answer(session(), 'wrong');
    expect(s.queue).toEqual(['b', 'c', 'a']);
  });

  it('re-queues an unsure the same way', () => {
    expect(answer(session(), 'unsure').queue).toEqual(['b', 'c', 'a']);
  });

  it('requires a correct answer before the session can finish', () => {
    let s = startSession(['a']);
    s = answer(s, 'wrong');
    expect(isComplete(s)).toBe(false);
    s = answer(s, 'right');
    expect(isComplete(s)).toBe(true);
  });

  it('keeps the FIRST outcome even after a later correct answer', () => {
    let s = startSession(['a']);
    s = answer(s, 'wrong');
    s = answer(s, 'right');
    // Otherwise the Leitner box would never drop for something you got wrong.
    expect(s.firstResults.a).toBe('wrong');
  });

  it('marks it cleared once it is finally right', () => {
    let s = startSession(['a']);
    s = answer(s, 'wrong');
    s = answer(s, 'right');
    expect(s.cleared).toEqual(['a']);
  });
});

describe('counts', () => {
  it('counts distinct exercises, not queue length', () => {
    const s = answer(session(), 'wrong');
    expect(s.queue).toHaveLength(3);
    expect(totalExercises(s)).toBe(3);
  });

  it('tracks attempts per exercise', () => {
    let s = startSession(['a', 'b']);
    s = answer(s, 'wrong');
    s = answer(s, 'right');
    s = answer(s, 'right');
    expect(s.attempts).toEqual({ a: 2, b: 1 });
  });
});

describe('toughest moment', () => {
  it('names the exercise that took the most attempts', () => {
    let s = startSession(['a', 'b']);
    s = answer(s, 'wrong');
    s = answer(s, 'right');
    s = answer(s, 'right');
    expect(toughestExerciseId(s)).toBe('a');
  });

  it('is undefined when everything went first try', () => {
    let s = session();
    s = answer(s, 'right');
    s = answer(s, 'right');
    s = answer(s, 'right');
    expect(toughestExerciseId(s)).toBeUndefined();
  });
});

describe('resultsInOrder', () => {
  it('returns one first-outcome per exercise in the given order', () => {
    let s = session();
    s = answer(s, 'wrong');
    s = answer(s, 'right');
    s = answer(s, 'unsure');
    s = answer(s, 'right');
    s = answer(s, 'right');
    expect(resultsInOrder(s, ['a', 'b', 'c'])).toEqual(['wrong', 'right', 'unsure']);
  });

  it('skips exercises never reached', () => {
    const s = answer(session(), 'right');
    expect(resultsInOrder(s, ['a', 'b', 'c'])).toEqual(['right']);
  });
});
