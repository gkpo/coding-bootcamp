/**
 * Builds the daily session: docs/01 §The daily session.
 *
 * Target is ~8 exercises: up to 3 due reviews, ~4 from the frontier of the
 * least-advanced tracks (round-robin so tracks progress together), and one
 * decoder item because that track is fast and high-leverage.
 *
 * The frontier introduces, it does not re-expose: it holds only exercises that
 * have never been presented (docs/10 part A). Anything already seen comes back
 * through the review stage when spaced repetition says it is due, so a session
 * is mostly new material rather than the same handful of items every day until
 * they graduate.
 *
 * Deterministic given (progress, today, seed) so a session can be rebuilt
 * exactly, which is what makes it testable and resumable. Variety comes from
 * progress moving, never from randomness.
 */

import { dueExercises, masteryRatio, type ExerciseProgress } from './leitner';
import { shuffle } from './shuffle';
import { daysBetween, type DayKey } from './dates';

export const MAX_REVIEWS = 3;
export const TARGET_FRONTIER = 4;
export const MAX_DECODER = 1;
export const TARGET_SESSION_SIZE = 8;

/** Arbitrary fixed origin for the day-rotation counter. Only differences matter. */
const ROTATION_EPOCH = '2000-01-01';

export interface TrackPool {
  id: string;
  /** Exercise ids in pedagogical order. */
  exerciseIds: string[];
}

export interface ComposeInput {
  tracks: TrackPool[];
  /** Track 6 ids; one is always mixed in when any are available. */
  decoderExerciseIds?: string[];
  progress: Record<string, ExerciseProgress>;
  today: DayKey;
  seed: number;
  /** Slight bias toward the track last opened. */
  lastOpenedTrackId?: string;
}

/** Never presented. This, and only this, is frontier material. */
function isUnseen(id: string, progress: Record<string, ExerciseProgress>): boolean {
  return progress[id] === undefined;
}

/**
 * Backlog = seen before and due now. The review stage caps how much of it a
 * session carries, so every later stage has to agree on what counts, or the
 * cap leaks (which it did: the top-up stage used to refill from the pile).
 */
function isBacklog(id: string, progress: Record<string, ExerciseProgress>, today: DayKey): boolean {
  const p = progress[id];
  return p !== undefined && p.dueDay <= today;
}

/** Least-advanced first, with the last-opened track pulled to the front. */
function orderTracks(
  tracks: TrackPool[],
  progress: Record<string, ExerciseProgress>,
  lastOpenedTrackId?: string,
): TrackPool[] {
  const byProgress = [...tracks].sort((a, b) => {
    const diff = masteryRatio(a.exerciseIds, progress) - masteryRatio(b.exerciseIds, progress);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  const favoured = byProgress.find((t) => t.id === lastOpenedTrackId);
  if (!favoured) return byProgress;
  return [favoured, ...byProgress.filter((t) => t.id !== favoured.id)];
}

/**
 * The frontier of a track: the exercises never presented, in authored order,
 * because teaching order matters and this must never jump ahead.
 *
 * Deliberately excludes seen-but-unmastered items. Including them meant an
 * exercise answered correctly yesterday was back today, and the day after, and
 * the day after that, until its box reached 4: the bank felt tiny. Re-exposure
 * is spaced repetition's job, and the review stage does it on schedule.
 */
function frontierOf(
  track: TrackPool,
  progress: Record<string, ExerciseProgress>,
  taken: Set<string>,
): string[] {
  return track.exerciseIds.filter((id) => !taken.has(id) && isUnseen(id, progress));
}

/** Due items, most-overdue first, matching the order the review stage uses. */
function backlogIn(
  ids: string[],
  progress: Record<string, ExerciseProgress>,
  today: DayKey,
): string[] {
  return ids
    .filter((id) => isBacklog(id, progress, today))
    .sort((a, b) => {
      const dueA = progress[a].dueDay;
      const dueB = progress[b].dueDay;
      return dueA === dueB ? a.localeCompare(b) : dueA.localeCompare(dueB);
    });
}

/**
 * One decoder item, rotating rather than pinned. Unseen material first, then
 * whatever is due, and once the whole track is seen and nothing is due it
 * steps one place per calendar day so three consecutive days give three
 * different items.
 */
function pickDecoder(
  pool: string[],
  progress: Record<string, ExerciseProgress>,
  taken: Set<string>,
  today: DayKey,
): string | undefined {
  const available = pool.filter((id) => !taken.has(id));
  if (available.length === 0) return undefined;

  const unseen = available.filter((id) => isUnseen(id, progress));
  if (unseen.length > 0) return unseen[0];

  const due = backlogIn(available, progress, today);
  if (due.length > 0) return due[0];

  const day = daysBetween(ROTATION_EPOCH, today);
  const index = ((day % available.length) + available.length) % available.length;
  return available[index];
}

export function composeSession(input: ComposeInput): string[] {
  const { tracks, progress, today, seed, lastOpenedTrackId } = input;
  const decoderPool = input.decoderExerciseIds ?? [];

  const known = new Set(tracks.flatMap((t) => t.exerciseIds));
  const picked: string[] = [];
  const taken = new Set<string>();

  const take = (id: string) => {
    if (taken.has(id)) return;
    taken.add(id);
    picked.push(id);
  };

  // 1. Due reviews first. The pile should visibly shrink.
  for (const id of dueExercises(progress, today)) {
    if (picked.length >= MAX_REVIEWS) break;
    // Only surface reviews for content that still exists.
    if (known.has(id)) take(id);
  }

  // 2. Frontier, round-robin across tracks so none stalls.
  const ordered = orderTracks(tracks, progress, lastOpenedTrackId);
  const queues = new Map(ordered.map((t) => [t.id, frontierOf(t, progress, taken)]));
  let frontierCount = 0;
  let exhausted = false;
  while (frontierCount < TARGET_FRONTIER && !exhausted) {
    exhausted = true;
    for (const track of ordered) {
      if (frontierCount >= TARGET_FRONTIER) break;
      const queue = queues.get(track.id);
      const next = queue?.shift();
      if (next === undefined) continue;
      exhausted = false;
      if (taken.has(next)) continue;
      take(next);
      frontierCount++;
    }
  }

  // 3. Always one decoder item when the track exists, it is fast and it is
  //    the highest-leverage gap (docs/01).
  const decoderChoice = pickDecoder(decoderPool, progress, taken, today);
  if (decoderChoice !== undefined && picked.length < TARGET_SESSION_SIZE) {
    for (let i = 0; i < MAX_DECODER; i++) take(decoderChoice);
  }

  // 4. Top up toward the target with more unseen material, then, only once
  //    nothing unseen is left anywhere, with the due pile: a session must not
  //    come up short just because the bank has all been seen once.
  if (picked.length < TARGET_SESSION_SIZE) {
    const unseen = ordered.flatMap((track) => frontierOf(track, progress, taken));
    const backlog = backlogIn(
      ordered.flatMap((track) => track.exerciseIds.filter((id) => !taken.has(id))),
      progress,
      today,
    );
    for (const id of [...unseen, ...backlog]) {
      if (picked.length >= TARGET_SESSION_SIZE) break;
      take(id);
    }
  }
  // Everything seen and nothing due: revisit rather than hand back a short
  // session.
  if (picked.length < TARGET_SESSION_SIZE) {
    for (const track of ordered) {
      for (const id of track.exerciseIds) {
        if (picked.length >= TARGET_SESSION_SIZE) break;
        if (!taken.has(id)) take(id);
      }
    }
  }

  // Presentation order is shuffled so the session doesn't feel like a list,
  // but the *set* stays deterministic for a given day.
  return shuffle(picked, seed);
}
