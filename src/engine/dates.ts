/**
 * Day keys for streaks, XP-by-day and Leitner due dates.
 *
 * Everything is local-time: the user's "today" is the day their phone says it
 * is, never UTC. Keys are "YYYY-MM-DD" so they sort lexicographically.
 *
 * This module must stay free of React and DOM imports (docs/05 §engine purity).
 */

export type DayKey = string;

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: DayKey, to: DayKey): number {
  const ms = parseDayKey(to).getTime() - parseDayKey(from).getTime();
  // Round rather than floor: DST shifts a day by an hour either way.
  return Math.round(ms / 86_400_000);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

export function isOnOrBefore(key: DayKey, reference: DayKey): boolean {
  return key <= reference;
}

/** Day of the week as a Monday-first index: Monday 0 ... Sunday 6. */
export function weekdayIndex(key: DayKey): number {
  return (parseDayKey(key).getDay() + 6) % 7;
}

/** The Monday on or before `key`. */
export function startOfWeek(key: DayKey): DayKey {
  return addDays(key, -weekdayIndex(key));
}
