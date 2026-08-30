import { describe, expect, it } from 'vitest';
import { conceptOfTheDay } from './conceptOfTheDay';

const deck = ['a', 'b', 'c'];

describe('conceptOfTheDay', () => {
  it('returns the same card all day', () => {
    expect(conceptOfTheDay(deck, '2026-08-26')).toBe(conceptOfTheDay(deck, '2026-08-26'));
  });

  it('moves on the next day', () => {
    expect(conceptOfTheDay(deck, '2026-08-26')).not.toBe(conceptOfTheDay(deck, '2026-08-27'));
  });

  it('wraps around the deck instead of running out', () => {
    const seen = [0, 1, 2, 3].map((d) => conceptOfTheDay(deck, `2026-08-2${d}`));
    expect(seen[3]).toBe(seen[0]);
  });

  it('visits every card across a full cycle', () => {
    const seen = new Set(
      Array.from({ length: 9 }, (_, i) => conceptOfTheDay(deck, `2026-08-1${i}`)),
    );
    expect(seen.size).toBe(deck.length);
  });

  it('handles days before the epoch without going negative', () => {
    expect(deck).toContain(conceptOfTheDay(deck, '2025-06-14'));
  });

  it('returns undefined for an empty deck rather than throwing', () => {
    expect(conceptOfTheDay([], '2026-08-26')).toBeUndefined();
  });

  it('behaves exactly as before when skips is left out', () => {
    expect(conceptOfTheDay(deck, '2026-08-26', 0)).toBe(conceptOfTheDay(deck, '2026-08-26'));
  });

  it('moves one card forward per skip', () => {
    const natural = conceptOfTheDay(deck, '2026-08-26');
    const nextDay = conceptOfTheDay(deck, '2026-08-27');
    const dayAfter = conceptOfTheDay(deck, '2026-08-28');
    expect(conceptOfTheDay(deck, '2026-08-26', 1)).toBe(nextDay);
    expect(conceptOfTheDay(deck, '2026-08-26', 2)).toBe(dayAfter);
    expect(conceptOfTheDay(deck, '2026-08-26', 1)).not.toBe(natural);
  });

  it('wraps back to the starting card after a full deck of skips', () => {
    expect(conceptOfTheDay(deck, '2026-08-26', deck.length)).toBe(
      conceptOfTheDay(deck, '2026-08-26', 0),
    );
  });

  it('stays in range for a day before the epoch that has been skipped', () => {
    expect(deck).toContain(conceptOfTheDay(deck, '2025-06-14', 5));
  });
});
