import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  isOnOrBefore,
  parseDayKey,
  startOfWeek,
  toDayKey,
  todayKey,
  weekdayIndex,
} from './dates';

describe('day keys', () => {
  it('formats local dates as YYYY-MM-DD with padding', () => {
    expect(toDayKey(new Date(2026, 7, 26))).toBe('2026-08-26');
    expect(toDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local time, not UTC', () => {
    // 23:30 local on the 26th stays the 26th even when UTC has rolled over.
    expect(toDayKey(new Date(2026, 7, 26, 23, 30))).toBe('2026-08-26');
  });

  it('round-trips through parseDayKey', () => {
    expect(toDayKey(parseDayKey('2026-02-28'))).toBe('2026-02-28');
  });

  it('sorts lexicographically in chronological order', () => {
    const keys = ['2026-10-01', '2026-02-11', '2025-12-31'];
    expect([...keys].sort()).toEqual(['2025-12-31', '2026-02-11', '2026-10-01']);
  });

  it('todayKey matches toDayKey for the same instant', () => {
    const now = new Date();
    expect(todayKey(now)).toBe(toDayKey(now));
  });
});

describe('day arithmetic', () => {
  it('counts calendar days between keys', () => {
    expect(daysBetween('2026-08-26', '2026-08-27')).toBe(1);
    expect(daysBetween('2026-08-26', '2026-08-26')).toBe(0);
    expect(daysBetween('2026-08-27', '2026-08-26')).toBe(-1);
  });

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('handles leap days', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('adds the Leitner intervals', () => {
    // Box schedule from docs/01: 1, 3, 7, 16, 35 days.
    expect(addDays('2026-08-26', 1)).toBe('2026-08-27');
    expect(addDays('2026-08-26', 3)).toBe('2026-08-29');
    expect(addDays('2026-08-26', 7)).toBe('2026-09-02');
    expect(addDays('2026-08-26', 16)).toBe('2026-09-11');
    expect(addDays('2026-08-26', 35)).toBe('2026-09-30');
  });

  it('subtracts days', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('isOnOrBefore', () => {
  it('treats same-day as due', () => {
    expect(isOnOrBefore('2026-08-26', '2026-08-26')).toBe(true);
  });

  it('is true for past due dates and false for future ones', () => {
    expect(isOnOrBefore('2026-08-20', '2026-08-26')).toBe(true);
    expect(isOnOrBefore('2026-09-02', '2026-08-26')).toBe(false);
  });
});

describe('weekdayIndex', () => {
  it('counts from Monday, not Sunday', () => {
    // 2026-08-24 is a Monday.
    expect(weekdayIndex('2026-08-24')).toBe(0);
    expect(weekdayIndex('2026-08-27')).toBe(3);
    expect(weekdayIndex('2026-08-30')).toBe(6);
  });
});

describe('startOfWeek', () => {
  it('returns the Monday on or before the day', () => {
    expect(startOfWeek('2026-08-24')).toBe('2026-08-24');
    expect(startOfWeek('2026-08-27')).toBe('2026-08-24');
    expect(startOfWeek('2026-08-30')).toBe('2026-08-24');
  });

  it('gives every day of a week the same column offset', () => {
    const week = Array.from({ length: 7 }, (_, i) => addDays('2026-08-24', i));
    for (const day of week) {
      expect(addDays(startOfWeek(day), weekdayIndex(day))).toBe(day);
    }
  });
});
