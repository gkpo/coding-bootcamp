/**
 * Builds the daily session: docs/01 §The daily session.
 *
 * Target is ~8 exercises: up to 3 due reviews, ~4 from the frontier of the
 * least-advanced tracks (round-robin so tracks progress together), and one
 * decoder item because that track is fast and high-leverage.
 *
 * Deterministic given (progress, today, seed) so a session can be rebuilt
 * exactly, which is what makes it testable and resumable.
 */

import { dueExercises, isMastered, masteryRatio, type ExerciseProgress } from './leitner';
import { shuffle } from './shuffle';
import type { DayKey } from './dates';

export const MAX_REVIEWS = 3;
export const TARGET_FRONTIER = 4;
export const MAX_DECODER = 1;
export const TARGET_SESSION_SIZE = 8;

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

function isUnmastered(id: string, progress: Record<string, ExerciseProgress>): boolean {
  const p = progress[id];
  return p === undefined || !isMastered(p);
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
 * The frontier of a track: the exercises not yet mastered, in authored order,
 * because teaching order matters and this must never jump ahead.
 *
 * Two tiers. Fresh material comes first: anything new, or in progress but not
 * currently due. Overdue items come last, even though they are unmastered too:
 * the review stage already capped how much backlog a session may carry, and
 * without this split a large due pile would refill the frontier and the whole
 * session would be revision. Falling back to tier two keeps sessions full when
 * backlog is genuinely all that is left.
 */
function frontierOf(
  track: TrackPool,
  progress: Record<string, ExerciseProgress>,
  taken: Set<string>,
  today: DayKey,
): string[] {
  const available = track.exerciseIds.filter((id) => !taken.has(id) && isUnmastered(id, progress));
  const backlog = (id: string) => isBacklog(id, progress, today);
  return [...available.filter((id) => !backlog(id)), ...available.filter(backlog)];
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
  const queues = new Map(ordered.map((t) => [t.id, frontierOf(t, progress, taken, today)]));
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
  const decoderCandidates = decoderPool.filter(
    (id) => !taken.has(id) && isUnmastered(id, progress),
  );
  const decoderFallback = decoderPool.filter((id) => !taken.has(id));
  const decoderChoice = (decoderCandidates.length > 0 ? decoderCandidates : decoderFallback)[0];
  if (decoderChoice !== undefined && picked.length < TARGET_SESSION_SIZE) {
    for (let i = 0; i < MAX_DECODER; i++) take(decoderChoice);
  }

  // 4. Top up toward the target, still fresh-material-first so the cap in
  //    step 1 keeps meaning something.
  if (picked.length < TARGET_SESSION_SIZE) {
    const remaining = ordered.flatMap((track) => frontierOf(track, progress, taken, today));
    const fresh = remaining.filter((id) => !isBacklog(id, progress, today));
    const backlog = remaining.filter((id) => isBacklog(id, progress, today));
    for (const id of [...fresh, ...backlog]) {
      if (picked.length >= TARGET_SESSION_SIZE) break;
      take(id);
    }
  }
  // Everything mastered: revisit rather than hand back a short session.
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
