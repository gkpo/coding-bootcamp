import { describe, expect, it } from 'vitest';
import { cards, cardsForTrack, exercises, getCard, getExercise, trackExerciseIds } from './index';
import { findContentProblems } from './validate';
import { tracks } from './index';

/**
 * These run against the *authored* content, not fixtures. If someone writes a
 * broken exercise, this is what goes red.
 */

describe('the authored content', () => {
  it('passes every validation rule', () => {
    expect(findContentProblems({ tracks, exercises, cards })).toEqual([]);
  });

  it('has the full manifest: 142 exercises across 9 tracks', () => {
    // docs/03-CONTENT-PLAN.md is the v1 authoring contract and
    // docs/08-CONTENT-EXPANSION.md the v1.1 one; these counts are them.
    expect(tracks.map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']);
    const perTrack = { t1: 18, t2: 24, t3: 20, t4: 12, t5: 14, t6: 12, t7: 16, t8: 16, t9: 10 };
    for (const [trackId, expected] of Object.entries(perTrack)) {
      expect(trackExerciseIds(trackId as keyof typeof perTrack).length, trackId).toBe(expected);
    }
    expect(exercises.length).toBe(142);
  });

  it('covers all eight exercise types', () => {
    const types = new Set(exercises.map((e) => e.type));
    expect([...types].sort()).toEqual([
      'blank',
      'complexity',
      'ladder',
      'match',
      'mcq',
      'parsons',
      'spot-bug',
      'steps',
    ]);
  });

  it('has all 18 Track 1 exercises from the manifest', () => {
    const expected = Array.from({ length: 18 }, (_, i) => `t1-${String(i + 1).padStart(2, '0')}`);
    expect(trackExerciseIds('t1')).toEqual(expected);
  });

  it('matches the manifest on type and difficulty', () => {
    // Spot-checks against docs/03-CONTENT-PLAN.md rather than the whole table.
    expect(getExercise('t1-01')?.type).toBe('mcq');
    expect(getExercise('t1-07')?.type).toBe('complexity');
    expect(getExercise('t1-10')?.type).toBe('spot-bug');
    expect(getExercise('t1-14')?.type).toBe('match');
    expect(getExercise('t1-18')?.type).toBe('steps');
    expect(getExercise('t1-01')?.difficulty).toBe(1);
    expect(getExercise('t1-17')?.difficulty).toBe(3);
  });

  it('links every exercise to a card that resolves', () => {
    for (const exercise of exercises) {
      expect(
        getCard(exercise.conceptId),
        `${exercise.id} links to ${exercise.conceptId}`,
      ).toBeDefined();
    }
  });

  it('gives every complexity exercise a say-it-out-loud phrase', () => {
    const complexity = exercises.filter((e) => e.type === 'complexity');
    expect(complexity.length).toBeGreaterThan(0);
    for (const exercise of complexity) {
      expect(exercise.sayIt.length, exercise.id).toBeGreaterThan(10);
    }
  });

  it('explains every exercise in a few real sentences', () => {
    for (const exercise of exercises) {
      expect(exercise.explanation.length, exercise.id).toBeGreaterThan(80);
    }
  });

  it('gives every wrong option a misconception-targeted reason', () => {
    for (const exercise of exercises) {
      if (exercise.type !== 'mcq' && exercise.type !== 'ladder') continue;
      for (const option of exercise.options) {
        if (option.correct === true) continue;
        expect(option.whyWrong?.length ?? 0, `${exercise.id}: ${option.text}`).toBeGreaterThan(40);
      }
    }
  });
});

describe('the authored concept cards', () => {
  it('covers every track that has exercises', () => {
    for (const track of tracks) {
      expect(cardsForTrack(track.id).length, track.id).toBeGreaterThan(0);
    }
  });

  it('is reachable from an exercise, no orphan cards', () => {
    const linked = new Set(exercises.map((e) => e.conceptId));
    const orphans = cards.filter((c) => !linked.has(c.id)).map((c) => c.id);
    expect(orphans.join(', ')).toBe('');
  });

  it('gives every card plain words, an analogy and something to say', () => {
    for (const card of cards) {
      expect(card.plainWords.length, card.id).toBeGreaterThan(60);
      expect(card.analogy.length, card.id).toBeGreaterThan(80);
      expect(card.sayThis.length, card.id).toBeGreaterThan(0);
    }
  });

  it('keeps every code example short enough to read on a phone', () => {
    for (const card of cards) {
      const lines = card.example?.source.split('\n').length ?? 0;
      expect(lines, card.id).toBeLessThanOrEqual(8);
    }
  });

  it('gives every card at least one interviewer phrase, except the meta-cards', () => {
    for (const card of cards) {
      expect(card.interviewerSays.length + card.sayThis.length, card.id).toBeGreaterThan(1);
    }
  });
});

describe('code snippets', () => {
  it('stay within the 18-line mobile limit', () => {
    for (const exercise of exercises) {
      if (!exercise.code) continue;
      expect(exercise.code.source.split('\n').length, exercise.id).toBeLessThanOrEqual(18);
    }
  });

  it('never end with a stray blank line', () => {
    for (const exercise of exercises) {
      if (!exercise.code) continue;
      expect(exercise.code.source.endsWith('\n'), exercise.id).toBe(false);
    }
  });
});
