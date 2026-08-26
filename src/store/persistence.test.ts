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
      settings: { sound: false, haptics: true, reduceMotion: true },
    };
    expect(reconcile(doc)).toEqual(doc);
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

  it('preserves progress — the one thing that cannot be regenerated', () => {
    const exercises = {
      't1-01': { box: 5, dueDay: '2026-12-01', seen: 9, lapses: 2, lastResult: 'right' },
    };
    expect(reconcile({ exercises }).exercises).toEqual(exercises);
  });
});
