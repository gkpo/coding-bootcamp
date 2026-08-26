import { conceptCards } from './concepts';
import { t1, t1Exercises } from './tracks/t1';
import { t2, t2Exercises } from './tracks/t2';
import { t3, t3Exercises } from './tracks/t3';
import { t4, t4Exercises } from './tracks/t4';
import { t5, t5Exercises } from './tracks/t5';
import { t6, t6Exercises } from './tracks/t6';
import { t7, t7Exercises } from './tracks/t7';
import { assertContentValid } from './validate';
import type { ConceptCard, Exercise, Track, TrackId } from './types';

/**
 * Content assembly. Tracks 2–6 are the v1 manifest (docs/03); tracks 7–9 are
 * the v1.1 expansion (docs/08). Adding one is an import and two array entries.
 */

export const tracks: Track[] = [t1, t2, t3, t4, t5, t6, t7];
export const exercises: Exercise[] = [
  ...t1Exercises,
  ...t2Exercises,
  ...t3Exercises,
  ...t4Exercises,
  ...t5Exercises,
  ...t6Exercises,
  ...t7Exercises,
];
export const cards: ConceptCard[] = conceptCards;

// Fail loudly, and fail at startup rather than mid-session. In production this
// runs once at import; the cost is a few hundred microseconds.
assertContentValid({ tracks, exercises, cards });

const exerciseById = new Map(exercises.map((e) => [e.id, e]));
const cardById = new Map(cards.map((c) => [c.id, c]));
const trackById = new Map(tracks.map((t) => [t.id, t]));

export function getExercise(id: string): Exercise | undefined {
  return exerciseById.get(id);
}

export function getCard(id: string): ConceptCard | undefined {
  return cardById.get(id);
}

export function getTrack(id: TrackId): Track | undefined {
  return trackById.get(id);
}

/** Exercise ids for a track, in the pedagogical order the lessons define. */
export function trackExerciseIds(id: TrackId): string[] {
  return getTrack(id)?.lessons.flatMap((l) => l.exerciseIds) ?? [];
}

export function cardsForTrack(id: TrackId): ConceptCard[] {
  return cards.filter((c) => c.trackIds.includes(id));
}

export { type ConceptCard, type Exercise, type Track, type TrackId };
