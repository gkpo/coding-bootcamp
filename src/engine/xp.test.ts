import { describe, expect, it } from 'vitest';
import {
  XP_AFTER_RETRY,
  XP_FIRST_TRY,
  XP_SESSION_COMPLETE,
  XP_STREAK_BONUS,
  xpForResult,
  xpForSession,
  xpForStreak,
} from './xp';

describe('xpForResult', () => {
  it('pays full for a first-try answer', () => {
    expect(xpForResult('right')).toBe(XP_FIRST_TRY);
  });

  it('pays the retry rate for a miss or an unsure. You still learned something', () => {
    expect(xpForResult('wrong')).toBe(XP_AFTER_RETRY);
    expect(xpForResult('unsure')).toBe(XP_AFTER_RETRY);
  });
});

describe('xpForStreak', () => {
  it('pays at the 7 and 30 day marks', () => {
    expect(xpForStreak(7)).toBe(XP_STREAK_BONUS);
    expect(xpForStreak(30)).toBe(XP_STREAK_BONUS);
  });

  it('pays nothing on other days', () => {
    expect(xpForStreak(6)).toBe(0);
    expect(xpForStreak(8)).toBe(0);
    expect(xpForStreak(0)).toBe(0);
  });
});

describe('xpForSession', () => {
  it('sums answers and adds the completion bonus', () => {
    const xp = xpForSession(['right', 'right', 'wrong'], 3);
    expect(xp.fromAnswers).toBe(XP_FIRST_TRY * 2 + XP_AFTER_RETRY);
    expect(xp.completionBonus).toBe(XP_SESSION_COMPLETE);
    expect(xp.streakBonus).toBe(0);
    expect(xp.total).toBe(30);
  });

  it('adds the streak bonus on a milestone day', () => {
    const xp = xpForSession(['right'], 7);
    expect(xp.streakBonus).toBe(XP_STREAK_BONUS);
    expect(xp.total).toBe(XP_FIRST_TRY + XP_SESSION_COMPLETE + XP_STREAK_BONUS);
  });

  it('pays nothing at all for an empty session', () => {
    expect(xpForSession([], 7)).toEqual({
      fromAnswers: 0,
      completionBonus: 0,
      streakBonus: 0,
      total: 0,
    });
  });

  it('never pays less for doing better', () => {
    const allRight = xpForSession(['right', 'right'], 1).total;
    const oneMissed = xpForSession(['right', 'wrong'], 1).total;
    expect(allRight).toBeGreaterThan(oneMissed);
  });
});
