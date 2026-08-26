/**
 * XP rules from docs/01 §Gamification.
 *
 * XP is cosmetic on purpose: a lifetime number and a weekly bar, no leagues,
 * no leaderboards. It exists to make progress *felt*, not to rank anyone.
 */

import type { Result } from './leitner';

export const XP_FIRST_TRY = 10;
export const XP_AFTER_RETRY = 5;
export const XP_SESSION_COMPLETE = 5;
export const XP_STREAK_BONUS = 10;

/** Streak lengths that pay a one-off bonus. */
export const STREAK_BONUS_DAYS = [7, 30];

export function xpForResult(result: Result): number {
  return result === 'right' ? XP_FIRST_TRY : XP_AFTER_RETRY;
}

export function xpForStreak(streakDays: number): number {
  return STREAK_BONUS_DAYS.includes(streakDays) ? XP_STREAK_BONUS : 0;
}

export interface SessionXp {
  fromAnswers: number;
  completionBonus: number;
  streakBonus: number;
  total: number;
}

/**
 * `results` holds one entry per exercise. Its *first* outcome, since a
 * re-queued item that is finally answered right still only earns retry XP.
 */
export function xpForSession(results: Result[], streakDays: number): SessionXp {
  const fromAnswers = results.reduce((sum, r) => sum + xpForResult(r), 0);
  const completionBonus = results.length > 0 ? XP_SESSION_COMPLETE : 0;
  const streakBonus = results.length > 0 ? xpForStreak(streakDays) : 0;
  return {
    fromAnswers,
    completionBonus,
    streakBonus,
    total: fromAnswers + completionBonus + streakBonus,
  };
}
