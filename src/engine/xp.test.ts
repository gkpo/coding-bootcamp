import { describe, expect, it } from 'vitest';
import {
  XP_AFTER_RETRY,
  XP_CAPSTONE_COMPLETE,
  XP_CAPSTONE_STAGE,
  XP_CAPSTONE_STAGE_ASSISTED,
  XP_FIRST_TRY,
  XP_SESSION_COMPLETE,
  XP_STREAK_BONUS,
  xpForCapstoneStage,
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

describe('xpForCapstoneStage', () => {
  it('pays a full stage for one cleared without a hint', () => {
    expect(xpForCapstoneStage({ hintTaken: false, isFinalStage: false })).toBe(XP_CAPSTONE_STAGE);
  });

  it('pays the assisted rate when a hint was taken. Hints cost nothing else', () => {
    expect(xpForCapstoneStage({ hintTaken: true, isFinalStage: false })).toBe(
      XP_CAPSTONE_STAGE_ASSISTED,
    );
  });

  it('pays the finishing bonus on top of the last stage, assisted or not', () => {
    expect(xpForCapstoneStage({ hintTaken: false, isFinalStage: true })).toBe(
      XP_CAPSTONE_STAGE + XP_CAPSTONE_COMPLETE,
    );
    expect(xpForCapstoneStage({ hintTaken: true, isFinalStage: true })).toBe(
      XP_CAPSTONE_STAGE_ASSISTED + XP_CAPSTONE_COMPLETE,
    );
  });

  it('pays nothing for a replay. The practice is the point, not the number', () => {
    expect(xpForCapstoneStage({ hintTaken: false, isFinalStage: true, replay: true })).toBe(0);
  });

  it('stays on the same scale as answering an exercise', () => {
    expect(XP_CAPSTONE_STAGE).toBe(XP_FIRST_TRY);
    expect(XP_CAPSTONE_STAGE_ASSISTED).toBe(XP_AFTER_RETRY);
  });
});
