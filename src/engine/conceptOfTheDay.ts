/**
 * Picks the card surfaced on Home each day.
 *
 * Deterministic per day so it doesn't change under you when the screen
 * re-renders. M5 refines this to rotate through cards you haven't mastered
 * yet (docs/07); for now it walks the deck in a stable order.
 */

import { daysBetween, type DayKey } from './dates';

const EPOCH: DayKey = '2026-01-01';

export function conceptOfTheDay<T>(cards: readonly T[], today: DayKey): T | undefined {
  if (cards.length === 0) return undefined;
  const dayNumber = daysBetween(EPOCH, today);
  // Modulo can go negative for days before the epoch; normalise it.
  const index = ((dayNumber % cards.length) + cards.length) % cards.length;
  return cards[index];
}
