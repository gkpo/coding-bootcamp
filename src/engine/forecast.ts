/**
 * How far the whole bank is: docs/11 part A.
 *
 * The app knows less about pace than it looks like it does. `ExerciseProgress`
 * carries no timestamps, so the only history of when someone practised is
 * `xp.byDay`. Everything here is derived from that plus two constants the rest
 * of the engine already owns, and nothing new is persisted.
 *
 * The model is a straight line on purpose. It says so in the copy ("at your
 * recent pace"), which is what makes a rough number honest rather than a
 * promise. If a forecast reads wrong in use, tune the sentence, not the maths.
 *
 * This module must stay free of React and DOM imports (docs/05 §engine purity).
 */

import { addDays, daysBetween, type DayKey } from './dates';
import { BOX_INTERVALS, isMastered, type ExerciseProgress } from './leitner';
import { MAX_DECODER, TARGET_FRONTIER } from './sessionComposer';

/**
 * New exercises a completed session can introduce: the frontier stage plus the
 * decoder slot. Summed from the composer rather than restated, so tuning the
 * session size moves the forecast with it.
 */
export const NEW_PER_ACTIVE_DAY = TARGET_FRONTIER + MAX_DECODER;

/**
 * Days between first sight and the earliest possible mastery. Boxes 1, 2 and 3
 * have to be climbed in a row before box 4 (mastered) is reachable, so this is
 * the fastest the ladder can ever be, not an average.
 */
export const MASTERY_TRAIL_DAYS = BOX_INTERVALS[1] + BOX_INTERVALS[2] + BOX_INTERVALS[3];

/** Longest stretch of history the ratio looks at. */
const WINDOW_DAYS = 14;

/** Below this many days observed, the sample is noise rather than a habit. */
const MIN_OBSERVED_SPAN = 3;

export interface ForecastInput {
  /** Every exercise in scope: the whole bank for the journey header. */
  exerciseIds: string[];
  progress: Record<string, ExerciseProgress>;
  xpByDay: Record<DayKey, number>;
  today: DayKey;
}

export interface Forecast {
  unseen: number;
  unmastered: number;
  daysToSeeAll: number;
  daysToMasterAll: number;
  /**
   * True when the pace is an assumption rather than a measurement, so the copy
   * can say "at a session a day" instead of claiming to know the user's rhythm.
   */
  assumedDailyPace: boolean;
}

interface Pace {
  ratio: number;
  assumed: boolean;
}

function activeDays(xpByDay: Record<DayKey, number>, today: DayKey): DayKey[] {
  return Object.entries(xpByDay)
    .filter(([day, xp]) => xp > 0 && day <= today)
    .map(([day]) => day)
    .sort();
}

function measurePace(xpByDay: Record<DayKey, number>, today: DayKey): Pace {
  const active = activeDays(xpByDay, today);

  // Nothing recorded: assume a session a day rather than forecast from zero,
  // which would divide by nothing and read as "never".
  if (active.length === 0) return { ratio: 1, assumed: true };

  const observedSpan = daysBetween(active[0], today) + 1;
  // One or two days of history cannot tell a daily habit from a single sitting.
  if (observedSpan < MIN_OBSERVED_SPAN) return { ratio: 1, assumed: true };

  const windowLength = Math.min(WINDOW_DAYS, observedSpan);
  const windowStart = addDays(today, -(windowLength - 1));
  const hits = active.filter((day) => day >= windowStart).length;

  // A lapsed user has history but an empty window. Zero would divide by zero
  // downstream, so the floor is the most pessimistic honest reading: one day.
  return { ratio: Math.max(hits, 1) / windowLength, assumed: false };
}

/**
 * Fraction of the recent calendar days that carried any XP, in (0, 1]. Days
 * with no entry, or an entry of zero, count as inactive.
 */
export function practiceRatio(xpByDay: Record<DayKey, number>, today: DayKey): number {
  return measurePace(xpByDay, today).ratio;
}

export function forecast({ exerciseIds, progress, xpByDay, today }: ForecastInput): Forecast {
  let unseen = 0;
  let unmastered = 0;
  for (const id of exerciseIds) {
    const p = progress[id];
    if (p === undefined || p.seen === 0) unseen += 1;
    if (p === undefined || !isMastered(p)) unmastered += 1;
  }

  const { ratio, assumed } = measurePace(xpByDay, today);
  const pace = NEW_PER_ACTIVE_DAY * ratio;

  const daysToSeeAll = unseen === 0 ? 0 : Math.ceil(unseen / pace);
  const daysToMasterAll = unmastered === 0 ? 0 : daysToSeeAll + MASTERY_TRAIL_DAYS;

  return { unseen, unmastered, daysToSeeAll, daysToMasterAll, assumedDailyPace: assumed };
}

/**
 * A duration in plain words for the forecast sentence. Never handed a 0: the
 * callers say something different when there is nothing left to do. The string
 * carries no "about", the sentence around it does.
 */
export function formatDuration(days: number): string {
  if (days < 14) return days === 1 ? 'a day' : `${days} days`;
  if (days < 70) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? 'a week' : `${weeks} weeks`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? 'a month' : `${months} months`;
}
