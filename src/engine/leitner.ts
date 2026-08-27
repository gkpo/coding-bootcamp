/**
 * Leitner boxes: the spaced-repetition rules from docs/01 §Spaced repetition.
 *
 * Deliberately simple and explainable rather than SM-2: a box 0–5, one step up
 * for a clean answer, two steps down for a miss. Dropping two is intentional: * something you got wrong on old material must come back fast, not in 16 days.
 */

import { addDays, isOnOrBefore, type DayKey } from './dates';

export type Box = 0 | 1 | 2 | 3 | 4 | 5;
export type Result = 'right' | 'wrong' | 'unsure';

export interface ExerciseProgress {
  box: Box;
  dueDay: DayKey;
  seen: number;
  lapses: number;
  lastResult: Result | null;
}

/** Days until an item in each box comes back. Index = box. */
export const BOX_INTERVALS: readonly number[] = [0, 1, 3, 7, 16, 35];

export const MASTERED_BOX = 4;

export function isMastered(progress: ExerciseProgress): boolean {
  return progress.box >= MASTERED_BOX;
}

export function newProgress(today: DayKey): ExerciseProgress {
  return { box: 0, dueDay: today, seen: 0, lapses: 0, lastResult: null };
}

function clampBox(n: number): Box {
  return Math.max(0, Math.min(5, n)) as Box;
}

export function nextBox(box: Box, result: Result): Box {
  // Only a clean first-try answer promotes. "Unsure" is treated as a miss on
  // purpose: it keeps guess-gambling out of the learning signal.
  return result === 'right' ? clampBox(box + 1) : clampBox(box - 2);
}

export function dueDayForBox(box: Box, today: DayKey): DayKey {
  return addDays(today, BOX_INTERVALS[box]);
}

export function applyResult(
  progress: ExerciseProgress,
  result: Result,
  today: DayKey,
): ExerciseProgress {
  const box = nextBox(progress.box, result);
  return {
    box,
    dueDay: dueDayForBox(box, today),
    seen: progress.seen + 1,
    lapses: progress.lapses + (result === 'right' ? 0 : 1),
    lastResult: result,
  };
}

export function isDue(progress: ExerciseProgress, today: DayKey): boolean {
  return isOnOrBefore(progress.dueDay, today);
}

/**
 * Ids of everything due today, most-overdue first so the worst-remembered
 * material leads. Ties break on id to stay deterministic.
 */
export function dueExercises(all: Record<string, ExerciseProgress>, today: DayKey): string[] {
  return Object.entries(all)
    .filter(([, p]) => isDue(p, today))
    .sort(([idA, a], [idB, b]) =>
      a.dueDay === b.dueDay ? idA.localeCompare(idB) : a.dueDay.localeCompare(b.dueDay),
    )
    .map(([id]) => id);
}

/** Fraction of a track's exercises that are mastered, 0–1. */
export function masteryRatio(exerciseIds: string[], all: Record<string, ExerciseProgress>): number {
  if (exerciseIds.length === 0) return 0;
  const mastered = exerciseIds.filter((id) => {
    const p = all[id];
    return p !== undefined && isMastered(p);
  }).length;
  return mastered / exerciseIds.length;
}

export interface TrackTally {
  total: number;
  /** Presented at least once, whatever the answer was. */
  seen: number;
  /** Box >= 4. Always a subset of `seen`. */
  mastered: number;
}

/**
 * Counts behind a track's progress bar.
 *
 * Mastery alone is a poor progress signal for the first fortnight of use: a
 * box only moves one step per correct answer and the intervals are 1, 3 and 7
 * days, so the earliest an exercise can reach box 4 is eleven days after it is
 * first seen. A bar that can only read 0% for that long tells a daily user
 * their work vanished. Seen and mastered are reported separately so the UI can
 * show both, without loosening what "mastered" means.
 */
export function trackTally(
  exerciseIds: string[],
  all: Record<string, ExerciseProgress>,
): TrackTally {
  let seen = 0;
  let mastered = 0;
  for (const id of exerciseIds) {
    const p = all[id];
    if (p === undefined || p.seen === 0) continue;
    seen += 1;
    if (isMastered(p)) mastered += 1;
  }
  return { total: exerciseIds.length, seen, mastered };
}

/**
 * Concept cards whose every linked exercise is mastered.
 *
 * The Sheets tick and the journey header's "known" figure are the same claim,
 * so they share one rule rather than each carrying its own copy of the loop.
 * A card nothing links to is never known: there is no evidence either way.
 *
 * Structurally typed so the engine stays free of content imports.
 */
export function knownCardIds(
  cards: readonly { id: string }[],
  exercises: readonly { id: string; conceptId: string }[],
  all: Record<string, ExerciseProgress>,
): Set<string> {
  const linked = new Map<string, string[]>();
  for (const exercise of exercises) {
    const existing = linked.get(exercise.conceptId);
    if (existing) existing.push(exercise.id);
    else linked.set(exercise.conceptId, [exercise.id]);
  }

  const known = new Set<string>();
  for (const card of cards) {
    const ids = linked.get(card.id);
    if (ids === undefined || ids.length === 0) continue;
    const everyOneMastered = ids.every((id) => {
      const p = all[id];
      return p !== undefined && isMastered(p);
    });
    if (everyOneMastered) known.add(card.id);
  }
  return known;
}
