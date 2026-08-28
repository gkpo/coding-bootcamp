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

/**
 * Build-mode capstones (docs/12 part B), on the same scale as an answer: a
 * stage cleared unaided pays what a first-try answer pays, a stage cleared
 * with a hint pays the retry rate, and finishing pays one more stage on top.
 */
export const XP_CAPSTONE_STAGE = XP_FIRST_TRY;
export const XP_CAPSTONE_STAGE_ASSISTED = XP_AFTER_RETRY;
export const XP_CAPSTONE_COMPLETE = 10;

export interface CapstoneStageXp {
  /** A hint was taken somewhere in this stage. Hints are free, this is all. */
  hintTaken: boolean;
  isFinalStage: boolean;
  /** A capstone already completed can be played again, for the practice. */
  replay?: boolean;
}

export function xpForCapstoneStage({
  hintTaken,
  isFinalStage,
  replay = false,
}: CapstoneStageXp): number {
  if (replay) return 0;
  const stage = hintTaken ? XP_CAPSTONE_STAGE_ASSISTED : XP_CAPSTONE_STAGE;
  return stage + (isFinalStage ? XP_CAPSTONE_COMPLETE : 0);
}

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
