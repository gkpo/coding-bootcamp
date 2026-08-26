import { describe, expect, it } from 'vitest';
import {
  composeSession,
  MAX_REVIEWS,
  TARGET_SESSION_SIZE,
  type ComposeInput,
} from './sessionComposer';
import { applyResult, newProgress, type ExerciseProgress } from './leitner';

const ids = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);

const progressAt = (box: number, dueDay: string): ExerciseProgress => ({
  box: box as ExerciseProgress['box'],
  dueDay,
  seen: 1,
  lapses: 0,
  lastResult: 'right',
});

const input = (over: Partial<ComposeInput> = {}): ComposeInput => ({
  tracks: [
    { id: 't1', exerciseIds: ids('t1', 18) },
    { id: 't2', exerciseIds: ids('t2', 24) },
  ],
  progress: {},
  today: '2026-08-26',
  seed: 1,
  ...over,
});

describe('session size', () => {
  it('builds a session of the target size', () => {
    expect(composeSession(input())).toHaveLength(TARGET_SESSION_SIZE);
  });

  it('never repeats an exercise within a session', () => {
    const session = composeSession(input());
    expect(new Set(session).size).toBe(session.length);
  });

  it('returns a short session when there simply is not enough content', () => {
    const session = composeSession(input({ tracks: [{ id: 't1', exerciseIds: ids('t1', 3) }] }));
    expect(session).toHaveLength(3);
  });

  it('returns nothing when there is no content at all', () => {
    expect(composeSession(input({ tracks: [] }))).toEqual([]);
  });
});

describe('determinism', () => {
  it('produces the same session for the same inputs', () => {
    expect(composeSession(input())).toEqual(composeSession(input()));
  });

  it('varies presentation order with the seed', () => {
    const a = composeSession(input({ seed: 1 }));
    const b = composeSession(input({ seed: 2 }));
    expect(a).not.toEqual(b);
  });

  it('picks the same set of exercises regardless of seed', () => {
    const a = [...composeSession(input({ seed: 1 }))].sort();
    const b = [...composeSession(input({ seed: 99 }))].sort();
    expect(a).toEqual(b);
  });
});

describe('due reviews', () => {
  it('pulls in due items', () => {
    const progress = { 't1-05': progressAt(3, '2026-08-20') };
    expect(composeSession(input({ progress }))).toContain('t1-05');
  });

  it('caps reviews so a session is never all backlog', () => {
    const progress = Object.fromEntries(
      ids('t1', 10).map((id) => [id, progressAt(3, '2026-08-01')]),
    );
    const session = composeSession(input({ progress }));
    const reviews = session.filter((id) => progress[id] !== undefined);
    expect(reviews.length).toBeLessThanOrEqual(MAX_REVIEWS);
  });

  it('ignores items that are not yet due', () => {
    const progress = { 't1-05': progressAt(4, '2026-12-01') };
    const session = composeSession(input({ progress }));
    // It may still appear as frontier filler, but not as a review pick.
    expect(session.filter((id) => id === 't1-05').length).toBeLessThanOrEqual(1);
  });

  it('skips due items whose content no longer exists', () => {
    const progress = { 'removed-01': progressAt(2, '2026-08-01') };
    expect(composeSession(input({ progress }))).not.toContain('removed-01');
  });
});

describe('frontier', () => {
  it('respects authored order, never jumps ahead in a track', () => {
    const session = composeSession(input({ tracks: [{ id: 't1', exerciseIds: ids('t1', 18) }] }));
    expect([...session].sort()).toEqual(ids('t1', 8));
  });

  it('skips exercises already mastered', () => {
    const progress = Object.fromEntries(
      ids('t1', 5).map((id) => [id, progressAt(5, '2026-12-01')]),
    );
    const session = composeSession(
      input({ tracks: [{ id: 't1', exerciseIds: ids('t1', 18) }], progress }),
    );
    for (const mastered of ids('t1', 5)) {
      expect(session).not.toContain(mastered);
    }
  });

  it('round-robins so both tracks advance together', () => {
    const session = composeSession(input());
    expect(session.some((id) => id.startsWith('t1'))).toBe(true);
    expect(session.some((id) => id.startsWith('t2'))).toBe(true);
  });

  it('favours the least-advanced track', () => {
    // t1 is fully mastered, so the frontier should come from t2.
    const progress = Object.fromEntries(
      ids('t1', 18).map((id) => [id, progressAt(5, '2026-12-01')]),
    );
    const session = composeSession(input({ progress }));
    expect(session.every((id) => id.startsWith('t2'))).toBe(true);
  });

  it('biases toward the track last opened', () => {
    const withBias = composeSession(input({ lastOpenedTrackId: 't2' }));
    const t2Count = withBias.filter((id) => id.startsWith('t2')).length;
    const neutral = composeSession(input());
    expect(t2Count).toBeGreaterThanOrEqual(neutral.filter((id) => id.startsWith('t2')).length);
  });
});

describe('decoder item', () => {
  it('always mixes one in when the decoder track exists', () => {
    const session = composeSession(input({ decoderExerciseIds: ids('t6', 12) }));
    expect(session.filter((id) => id.startsWith('t6'))).toHaveLength(1);
  });

  it('copes when the decoder track has no content yet', () => {
    expect(() => composeSession(input({ decoderExerciseIds: [] }))).not.toThrow();
    expect(composeSession(input({ decoderExerciseIds: [] }))).toHaveLength(TARGET_SESSION_SIZE);
  });

  it('prefers an unmastered decoder item', () => {
    const progress = { 't6-01': progressAt(5, '2026-12-01') };
    const session = composeSession(input({ decoderExerciseIds: ids('t6', 12), progress }));
    expect(session).toContain('t6-02');
    expect(session).not.toContain('t6-01');
  });
});

describe('everything mastered', () => {
  it('still returns a full session rather than an empty one', () => {
    const all = [...ids('t1', 18), ...ids('t2', 24)];
    const progress = Object.fromEntries(all.map((id) => [id, progressAt(5, '2026-12-01')]));
    expect(composeSession(input({ progress }))).toHaveLength(TARGET_SESSION_SIZE);
  });
});

describe('frontier is unseen only', () => {
  it('leaves out an item that was seen yesterday and is not due yet', () => {
    const progress = { 't1-01': progressAt(1, '2026-08-27') };
    const session = composeSession(
      input({ tracks: [{ id: 't1', exerciseIds: ids('t1', 18) }], progress }),
    );
    expect(session).not.toContain('t1-01');
    expect(session).toContain('t1-02');
  });

  it('brings a seen item back through the review stage instead, once it is due', () => {
    const progress = { 't1-01': progressAt(1, '2026-08-26') };
    const session = composeSession(
      input({ tracks: [{ id: 't1', exerciseIds: ids('t1', 18) }], progress }),
    );
    expect(session).toContain('t1-01');
  });

  it('deals a second session of new material on the same day', () => {
    const today = '2026-08-26';
    const first = composeSession(input({ today, seed: 1 }));
    // Answering an exercise is the only thing that changes between the two
    // sessions: same day, same seed rules, same bank.
    const progress = Object.fromEntries(
      first.map((id) => [id, applyResult(newProgress(today), 'right', today)]),
    );
    const second = composeSession(input({ today, progress, seed: 1 }));
    expect(second).toHaveLength(TARGET_SESSION_SIZE);
    for (const id of second) {
      expect(first).not.toContain(id);
    }
  });
});

describe('decoder rotation', () => {
  const seenLongAgo = Object.fromEntries(
    ids('t6', 12).map((id) => [id, progressAt(5, '2026-12-01')]),
  );

  it('changes the decoder item across three consecutive days', () => {
    const pick = (today: string) =>
      composeSession(
        input({ today, progress: seenLongAgo, decoderExerciseIds: ids('t6', 12) }),
      ).find((id) => id.startsWith('t6'));

    const picks = ['2026-08-26', '2026-08-27', '2026-08-28'].map(pick);
    expect(picks.every((id) => id !== undefined)).toBe(true);
    expect(new Set(picks).size).toBe(3);
  });

  it('still prefers a due decoder item over the daily rotation', () => {
    const progress = { ...seenLongAgo, 't6-07': progressAt(2, '2026-08-01') };
    const session = composeSession(
      input({ today: '2026-08-26', progress, decoderExerciseIds: ids('t6', 12) }),
    );
    expect(session).toContain('t6-07');
  });
});

describe('everything seen', () => {
  it('fills the session from the due pile once nothing is unseen', () => {
    const all = [...ids('t1', 18), ...ids('t2', 24)];
    const progress = Object.fromEntries(all.map((id) => [id, progressAt(2, '2026-08-01')]));
    const session = composeSession(input({ progress }));
    expect(session).toHaveLength(TARGET_SESSION_SIZE);
    expect(session.every((id) => all.includes(id))).toBe(true);
  });
});
