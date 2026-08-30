/**
 * Picks the card surfaced on Home each day.
 *
 * Deterministic per day so it doesn't change under you when the screen
 * re-renders. `skips` is how many times the reader has asked for a different
 * card today: each one steps a single place further along the same deck order,
 * wrapping at the end, so the choice stays stable between renders and the next
 * day picks up the natural rotation again. M5 refines this to rotate through
 * cards you haven't mastered yet (docs/07); for now it walks the deck in a
 * stable order.
 */

import { daysBetween, type DayKey } from './dates';

const EPOCH: DayKey = '2026-01-01';

export function conceptOfTheDay<T>(cards: readonly T[], today: DayKey, skips = 0): T | undefined {
  if (cards.length === 0) return undefined;
  const dayNumber = daysBetween(EPOCH, today) + skips;
  // Modulo can go negative for days before the epoch; normalise it.
  const index = ((dayNumber % cards.length) + cards.length) % cards.length;
  return cards[index];
}
