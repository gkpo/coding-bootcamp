/**
 * Streaks and freezes — docs/01 §Gamification.
 *
 * A day counts when at least one session is completed. Day boundaries are
 * local, never UTC: the streak should match the day the phone says it is.
 *
 * Freezes exist so one bad day doesn't erase three weeks of habit. You earn
 * one per 7 unbroken days, bank at most 2, and a missed day spends one
 * automatically. That is generous by design — the goal is daily reps, and
 * shame is a poor motivator.
 */

import { daysBetween, type DayKey } from './dates';

export const MAX_FREEZES = 2;
export const DAYS_PER_FREEZE = 7;

export interface StreakState {
  current: number;
  best: number;
  lastActiveDay: DayKey | null;
  freezes: number;
}

export function initialStreak(): StreakState {
  return { current: 0, best: 0, lastActiveDay: null, freezes: 0 };
}

/** Freezes are earned when the streak crosses a multiple of 7. */
function earnedFreeze(streakDays: number): boolean {
  return streakDays > 0 && streakDays % DAYS_PER_FREEZE === 0;
}

/**
 * Recompute the streak as of `today`, spending freezes for any missed days.
 * Call this on load as well as after a session — a streak can lapse while the
 * app is closed, and the user should see the truth when they open it.
 */
export function decayStreak(state: StreakState, today: DayKey): StreakState {
  if (state.lastActiveDay === null) return state;

  const gap = daysBetween(state.lastActiveDay, today);
  // Same day, or somehow in the past (clock change) — nothing to decay.
  if (gap <= 1) return state;

  const missedDays = gap - 1;
  if (missedDays <= state.freezes) {
    // Freezes cover the gap: the streak survives but does not grow.
    return { ...state, freezes: state.freezes - missedDays };
  }
  return { ...state, current: 0, freezes: 0 };
}

/** Record a completed session on `today`. Idempotent within the same day. */
export function completeSession(state: StreakState, today: DayKey): StreakState {
  const decayed = decayStreak(state, today);

  if (decayed.lastActiveDay === today) return decayed;

  const isConsecutive =
    decayed.lastActiveDay !== null && daysBetween(decayed.lastActiveDay, today) === 1;
  // A freeze-covered gap continues the streak too — that is what it bought.
  const survivedOnFreeze = decayed.lastActiveDay !== null && decayed.current > 0 && !isConsecutive;

  const current = isConsecutive || survivedOnFreeze ? decayed.current + 1 : 1;
  const freezes = earnedFreeze(current)
    ? Math.min(MAX_FREEZES, decayed.freezes + 1)
    : decayed.freezes;

  return {
    current,
    best: Math.max(decayed.best, current),
    lastActiveDay: today,
    freezes,
  };
}

export function isActiveToday(state: StreakState, today: DayKey): boolean {
  return state.lastActiveDay === today;
}
