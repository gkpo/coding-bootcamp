import { describe, expect, it } from 'vitest';
import { cards, cardsForTrack, exercises, getCard, getExercise, trackExerciseIds } from './index';
import { findContentProblems } from './validate';
import { composeSession } from '../engine/sessionComposer';
import type { ExerciseProgress } from '../engine/leitner';
import { tracks } from './index';

/**
 * These run against the *authored* content, not fixtures. If someone writes a
 * broken exercise, this is what goes red.
 */

describe('the authored content', () => {
  it('passes every validation rule', () => {
    expect(findContentProblems({ tracks, exercises, cards })).toEqual([]);
  });

  it('has the full manifest: 190 exercises across 9 tracks', () => {
    // docs/03-CONTENT-PLAN.md is the v1 authoring contract, docs/08 the v1.1
    // one and docs/10 part C the wave 3 one; these counts are them.
    expect(tracks.map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']);
    const perTrack = { t1: 26, t2: 44, t3: 20, t4: 12, t5: 14, t6: 20, t7: 20, t8: 20, t9: 14 };
    for (const [trackId, expected] of Object.entries(perTrack)) {
      expect(trackExerciseIds(trackId as keyof typeof perTrack).length, trackId).toBe(expected);
    }
    expect(exercises.length).toBe(190);
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

  it('has every Track 1 exercise from the manifest, in order', () => {
    const expected = Array.from({ length: 26 }, (_, i) => `t1-${String(i + 1).padStart(2, '0')}`);
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

describe('the daily session over the real content', () => {
  // docs/08 promised the new tracks would join the round-robin with no
  // composer change. Worth asserting rather than assuming: a track no session
  // can ever reach is content nobody will ever see.
  const pools = () => tracks.map((t) => ({ id: t.id, exerciseIds: trackExerciseIds(t.id) }));
  const mastered = (ids: string[]): Record<string, ExerciseProgress> =>
    Object.fromEntries(
      ids.map((id) => [
        id,
        { box: 5, dueDay: '2026-12-01', seen: 4, lapses: 0, lastResult: 'right' },
      ]),
    );
  const compose = (progress: Record<string, ExerciseProgress>) => {
    const reached = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const session = composeSession({
        tracks: pools(),
        decoderExerciseIds: trackExerciseIds('t6'),
        progress,
        today: '2026-08-26',
        seed,
      });
      for (const id of session) reached.add(id.slice(0, 2));
    }
    return reached;
  };

  it('works the least-advanced tracks first, so day one is not spread across nine subjects', () => {
    // Four frontier slots and an even mastery ratio, so the tie-break on id
    // decides: t1 to t4, plus the decoder item. This is by design, and it is
    // why the assertion below is about a profile that has made progress.
    expect([...compose({})].sort()).toEqual(['t1', 't2', 't3', 't4', 't6']);
  });

  it('deals a second session of fresh material on the same day', () => {
    // docs/10 part A over the real bank, not fixtures: with 190 exercises
    // there is no reason a second sitting should repeat the first.
    const today = '2026-08-26';
    const compose = (progress: Record<string, ExerciseProgress>) =>
      composeSession({
        tracks: pools(),
        decoderExerciseIds: trackExerciseIds('t6'),
        progress,
        today,
        seed: 3,
      });
    const first = compose({});
    const answered = Object.fromEntries(
      first.map((id) => [
        id,
        { box: 1, dueDay: '2026-08-27', seen: 1, lapses: 0, lastResult: 'right' } as const,
      ]),
    );
    const second = compose(answered);
    expect(second).toHaveLength(8);
    expect(second.filter((id) => first.includes(id))).toEqual([]);
  });

  it('rotates the decoder item across consecutive days once the track is seen', () => {
    const seen = mastered(trackExerciseIds('t6'));
    const pick = (today: string) =>
      composeSession({
        tracks: pools(),
        decoderExerciseIds: trackExerciseIds('t6'),
        progress: seen,
        today,
        seed: 1,
      }).find((id) => id.startsWith('t6'));
    const picks = ['2026-08-26', '2026-08-27', '2026-08-28'].map(pick);
    expect(new Set(picks).size).toBe(3);
  });

  it('brings the v1.1 tracks in once the earlier ones are done', () => {
    const done = ['t1', 't2', 't3', 't4', 't5', 't6'].flatMap((t) =>
      trackExerciseIds(t as Parameters<typeof trackExerciseIds>[0]),
    );
    const reached = compose(mastered(done));
    for (const id of ['t7', 't8', 't9']) expect(reached, id).toContain(id);
  });
});

describe('one concept, several skins (docs/09)', () => {
  // The rule exists because drilling one surface story per concept teaches the
  // story rather than the mapping, and the v1 content had exactly that shape.
  it('gives the commonly-asked concepts more than one phrasing to recognise', () => {
    for (const id of ['closure', 'big-o', 'hash-lookup', 'greedy', 'chunking']) {
      expect(getCard(id)?.interviewerSays.length ?? 0, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('never makes a match pair the card its own canonical phrase back', () => {
    const offenders: string[] = [];
    for (const exercise of exercises) {
      if (exercise.type !== 'match') continue;
      const canonical = getCard(exercise.conceptId)?.interviewerSays[0]?.toLowerCase();
      for (const pair of exercise.pairs) {
        if (canonical && pair.left.toLowerCase() === canonical) {
          offenders.push(`${exercise.id}: "${pair.left}"`);
        }
      }
    }
    expect(offenders.join('\n')).toBe('');
  });

  it('never reuses a pairing phrase, so every match trains a fresh one', () => {
    const seen = new Map<string, string>();
    const offenders: string[] = [];
    for (const exercise of exercises) {
      if (exercise.type !== 'match') continue;
      for (const pair of exercise.pairs) {
        const key = pair.left
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .trim();
        const first = seen.get(key);
        if (first) offenders.push(`${exercise.id} repeats ${first}: "${pair.left}"`);
        else seen.set(key, exercise.id);
      }
    }
    expect(offenders.join('\n')).toBe('');
  });

  it('gives the statement-to-pattern items an alternate phrasing to show', () => {
    // docs/10 part B: variants belong on problem statements and riddles, and
    // wave 3 is where they landed first.
    const wave3 = exercises.filter((e) => /^t2-(2[5-9]|3\d|4[0-4])$/.test(e.id));
    expect(wave3.length).toBe(20);
    for (const exercise of wave3) {
      expect(exercise.promptVariants?.length ?? 0, exercise.id).toBeGreaterThan(0);
    }
  });

  it('spreads the greedy lesson across several surface stories', () => {
    const greedy = exercises.filter((e) => e.conceptId === 'greedy');
    expect(greedy.length).toBeGreaterThanOrEqual(3);
    // Making change is canon and stays, but in exactly one exercise.
    const change = greedy.filter((e) => /banknote|coin/i.test(e.prompt));
    expect(change.map((e) => e.id)).toEqual(['t2-02']);
  });
});
