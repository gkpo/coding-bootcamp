/**
 * The session queue: Duolingo's rule: you must get an item right once before
 * the session completes, so a miss sends it to the back of the queue.
 *
 * Pure logic, kept out of the component so the re-queue rule is testable. The
 * *first* outcome is what counts for XP and the Leitner box; later retries
 * only clear the item from the queue.
 */

import type { Result } from './leitner';

export interface SessionState {
  /** Ids still to answer, in order. */
  queue: string[];
  /** First outcome per exercise, what gets recorded. */
  firstResults: Record<string, Result>;
  /** How many times each item has been presented, for "toughest moment". */
  attempts: Record<string, number>;
  /** Exercises fully cleared (answered correctly at least once). */
  cleared: string[];
}

export function startSession(exerciseIds: string[]): SessionState {
  return { queue: [...exerciseIds], firstResults: {}, attempts: {}, cleared: [] };
}

export function currentExerciseId(state: SessionState): string | undefined {
  return state.queue[0];
}

export function isComplete(state: SessionState): boolean {
  return state.queue.length === 0;
}

/** Distinct exercises in this session, for the progress bar segments. */
export function totalExercises(state: SessionState): number {
  return new Set([...state.queue, ...state.cleared]).size;
}

export function answer(state: SessionState, result: Result): SessionState {
  const id = currentExerciseId(state);
  if (id === undefined) return state;

  const rest = state.queue.slice(1);
  const attempts = { ...state.attempts, [id]: (state.attempts[id] ?? 0) + 1 };
  // Only the first attempt is recorded. A retry must not overwrite a miss
  // with a pass, or the Leitner box would never drop.
  const firstResults =
    state.firstResults[id] === undefined
      ? { ...state.firstResults, [id]: result }
      : state.firstResults;

  if (result === 'right') {
    return { queue: rest, firstResults, attempts, cleared: [...state.cleared, id] };
  }
  // Missed or unsure: back of the queue, to be seen again this session.
  return { queue: [...rest, id], firstResults, attempts, cleared: state.cleared };
}

/** The exercise that took the most attempts. The summary's "toughest moment". */
export function toughestExerciseId(state: SessionState): string | undefined {
  let toughest: string | undefined;
  let most = 1;
  for (const [id, count] of Object.entries(state.attempts)) {
    if (count > most) {
      most = count;
      toughest = id;
    }
  }
  return toughest;
}

/** First-attempt outcomes in a stable order, for XP and the summary. */
export function resultsInOrder(state: SessionState, order: string[]): Result[] {
  return order.map((id) => state.firstResults[id]).filter((r): r is Result => r !== undefined);
}
