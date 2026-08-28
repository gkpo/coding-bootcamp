import { describe, expect, it } from 'vitest';
import { defaultPersisted, reconcile, SCHEMA_VERSION } from './persistence';

describe('reconcile', () => {
  it('returns defaults for a completely absent document', () => {
    expect(reconcile(undefined)).toEqual(defaultPersisted());
    expect(reconcile(null)).toEqual(defaultPersisted());
  });

  it('returns defaults for a document of the wrong shape', () => {
    expect(reconcile('not an object')).toEqual(defaultPersisted());
    expect(reconcile([1, 2, 3])).toEqual(defaultPersisted());
  });

  it('keeps a well-formed document intact', () => {
    const doc = {
      schemaVersion: SCHEMA_VERSION,
      xp: { lifetime: 120, byDay: { '2026-08-26': 40 } },
      streak: { current: 4, best: 9, lastActiveDay: '2026-08-26', freezes: 1 },
      exercises: {
        't1-01': { box: 2, dueDay: '2026-08-29', seen: 3, lapses: 1, lastResult: 'right' },
      },
      conceptCardsOpened: ['big-o'],
      capstones: { 'c5-01': { stagesCleared: 2, assisted: false, completedDay: null } },
      settings: { sound: false, haptics: true, reduceMotion: true },
      onboarded: true,
    };
    expect(reconcile(doc)).toEqual(doc);
  });

  it('adds the capstone record to a document saved before build mode existed', () => {
    // docs/12 part B: the field is additive, which is why there is no
    // schemaVersion bump to go with it.
    const before = { ...defaultPersisted(), xp: { lifetime: 90, byDay: {} } };
    delete (before as Partial<typeof before>).capstones;
    const after = reconcile(before);
    expect(after.capstones).toEqual({});
    expect(after.xp.lifetime).toBe(90);
    expect(after.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('refuses a capstone record of the wrong shape', () => {
    expect(reconcile({ capstones: 'none' }).capstones).toEqual({});
    expect(reconcile({ capstones: [] }).capstones).toEqual({});
  });

  it('fills in fields a partial document is missing', () => {
    const result = reconcile({ xp: { lifetime: 50 } });
    expect(result.xp.lifetime).toBe(50);
    expect(result.xp.byDay).toEqual({});
    expect(result.streak).toEqual(defaultPersisted().streak);
    expect(result.settings).toEqual(defaultPersisted().settings);
  });

  it('replaces fields of the wrong type rather than trusting them', () => {
    const result = reconcile({
      xp: { lifetime: 'lots', byDay: 'nope' },
      streak: { current: null, best: 3, lastActiveDay: 42, freezes: undefined },
      conceptCardsOpened: 'big-o',
      settings: { sound: 'yes' },
    });
    expect(result.xp.lifetime).toBe(0);
    expect(result.xp.byDay).toEqual({});
    expect(result.streak.current).toBe(0);
    expect(result.streak.best).toBe(3);
    expect(result.streak.lastActiveDay).toBeNull();
    expect(result.streak.freezes).toBe(0);
    expect(result.conceptCardsOpened).toEqual([]);
    expect(result.settings.sound).toBe(true);
  });

  it('drops non-string entries from the opened-cards list', () => {
    expect(reconcile({ conceptCardsOpened: ['big-o', 7, null] }).conceptCardsOpened).toEqual([
      'big-o',
    ]);
  });

  it('defaults a document from before onboarding existed to not-onboarded', () => {
    // An older save has no `onboarded` key; showing the intro once is the
    // safe fallback, and it is a single tap to skip.
    expect(reconcile({ xp: { lifetime: 10 } }).onboarded).toBe(false);
  });

  it('keeps the onboarded flag once it is set', () => {
    expect(reconcile({ onboarded: true }).onboarded).toBe(true);
  });

  it('preserves progress. The one thing that cannot be regenerated', () => {
    const exercises = {
      't1-01': { box: 5, dueDay: '2026-12-01', seen: 9, lapses: 2, lastResult: 'right' },
    };
    expect(reconcile({ exercises }).exercises).toEqual(exercises);
  });
});
