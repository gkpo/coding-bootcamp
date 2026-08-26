/**
 * localStorage load/save — docs/04 §Progress & persistence.
 *
 * One key, one JSON document, read once at startup and written debounced.
 * Every read is defensive: a user's saved progress is the only thing in this
 * app that cannot be regenerated, so a corrupt or partial document must
 * degrade to defaults rather than crash the app on launch.
 */

import type { ExerciseProgress } from '../engine/leitner';
import type { DayKey } from '../engine/dates';

export const STORAGE_KEY = 'interview-reps:v1';
export const SCHEMA_VERSION = 1;

export interface Settings {
  sound: boolean;
  haptics: boolean;
  reduceMotion: boolean;
}

export interface Persisted {
  schemaVersion: number;
  xp: { lifetime: number; byDay: Record<DayKey, number> };
  streak: { current: number; best: number; lastActiveDay: DayKey | null; freezes: number };
  exercises: Record<string, ExerciseProgress>;
  conceptCardsOpened: string[];
  settings: Settings;
  /** False until the intro has been seen (or skipped) once. */
  onboarded: boolean;
}

export function defaultPersisted(): Persisted {
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: { lifetime: 0, byDay: {} },
    streak: { current: 0, best: 0, lastActiveDay: null, freezes: 0 },
    exercises: {},
    conceptCardsOpened: [],
    settings: { sound: true, haptics: true, reduceMotion: false },
    onboarded: false,
  };
}

/** Forward migrations, applied in order. Empty while we are still on v1. */
function migrate(raw: Persisted): Persisted {
  return raw;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merge a parsed document over the defaults field by field. A missing or
 * malformed field falls back rather than propagating `undefined` into the UI.
 */
export function reconcile(parsed: unknown): Persisted {
  const base = defaultPersisted();
  if (!isRecord(parsed)) return base;

  const xp = isRecord(parsed.xp) ? parsed.xp : {};
  const streak = isRecord(parsed.streak) ? parsed.streak : {};
  const settings = isRecord(parsed.settings) ? parsed.settings : {};

  return migrate({
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : SCHEMA_VERSION,
    xp: {
      lifetime: typeof xp.lifetime === 'number' ? xp.lifetime : 0,
      byDay: isRecord(xp.byDay) ? (xp.byDay as Record<string, number>) : {},
    },
    streak: {
      current: typeof streak.current === 'number' ? streak.current : 0,
      best: typeof streak.best === 'number' ? streak.best : 0,
      lastActiveDay: typeof streak.lastActiveDay === 'string' ? streak.lastActiveDay : null,
      freezes: typeof streak.freezes === 'number' ? streak.freezes : 0,
    },
    exercises: isRecord(parsed.exercises)
      ? (parsed.exercises as Record<string, ExerciseProgress>)
      : {},
    conceptCardsOpened: Array.isArray(parsed.conceptCardsOpened)
      ? parsed.conceptCardsOpened.filter((id): id is string => typeof id === 'string')
      : [],
    settings: {
      sound: typeof settings.sound === 'boolean' ? settings.sound : true,
      haptics: typeof settings.haptics === 'boolean' ? settings.haptics : true,
      reduceMotion: typeof settings.reduceMotion === 'boolean' ? settings.reduceMotion : false,
    },
    onboarded: typeof parsed.onboarded === 'boolean' ? parsed.onboarded : false,
  });
}

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return defaultPersisted();
    return reconcile(JSON.parse(raw));
  } catch {
    // Private browsing, quota errors, hand-edited JSON — start fresh rather
    // than leaving the user staring at a blank screen.
    return defaultPersisted();
  }
}

export function save(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Nothing useful to do: the session still works, it just will not persist.
  }
}

/** Trailing-edge debounce so a burst of answers is one write. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
