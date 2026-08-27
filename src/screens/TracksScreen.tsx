import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cards, exercises, tracks } from '../content';
import { ConceptIcon } from '../components/ConceptIcon';
import { ProgressBar } from '../components/ProgressBar';
import { todayKey } from '../engine/dates';
import { forecast, formatDuration, MASTERY_TRAIL_DAYS } from '../engine/forecast';
import { knownCardIds, trackTally as tallyOf } from '../engine/leitner';
import { useStore } from '../store/useStore';
import type { ExerciseProgress } from '../engine/leitner';
import type { Track } from '../content/types';
import './TracksScreen.css';

const ALL_EXERCISE_IDS = exercises.map((e) => e.id);

/** Nothing is gated. Everything is available from day one (docs/03). */
export function TracksScreen() {
  const trackTally = useStore((s) => s.trackTally);
  const progress = useStore((s) => s.exercises);

  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">Tracks</h1>
        <p className="screen-lede">
          {tracks.length} tracks, in a recommended order. Nothing is locked.
        </p>
      </div>

      <JourneyHeader />

      {tracks.map((track) => {
        const tally = trackTally(track.id);
        const next = nextLesson(track, progress);
        return (
          <Link key={track.id} to={`/tracks/${track.id}`} className="track-card">
            <div className="track-card__head">
              <span className="track-card__icon" style={{ color: `var(--track-${track.id})` }}>
                <ConceptIcon name={track.icon} size={24} />
              </span>
              <div className="track-card__titles">
                <h2 className="track-card__title">{track.title}</h2>
                <p className="track-card__tagline">{track.tagline}</p>
              </div>
            </div>
            <div className="track-card__meta">
              <ProgressBar className="track-card__bar" tally={tally} trackId={track.id} />
              <span className="track-card__pct">
                {tally.seen} of {tally.total} seen · {tally.mastered} mastered
              </span>
            </div>
            {next ? (
              <p className="track-card__next">
                <span className="track-card__next-label">Next up:</span>{' '}
                <span className="track-card__next-title">{next.title}</span>
              </p>
            ) : (
              <p className="track-card__next track-card__next--done">
                All seen. Reviews take it from here.
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * The whole territory in one card: how much of the bank has been met, how much
 * of it has stuck, and roughly how far the far end is.
 *
 * The screen's one big numeral lives here (docs/06 §one big friendly figure).
 * Everything below it is secondary type on purpose: if the forecast sentence
 * starts competing with the count, the sentence is too big.
 */
function JourneyHeader() {
  const progress = useStore((s) => s.exercises);
  const xpByDay = useStore((s) => s.xp.byDay);

  const tally = useMemo(() => tallyOf(ALL_EXERCISE_IDS, progress), [progress]);
  const known = useMemo(() => knownCardIds(cards, exercises, progress).size, [progress]);
  const view = useMemo(
    () =>
      forecast({
        exerciseIds: ALL_EXERCISE_IDS,
        progress,
        xpByDay,
        today: todayKey(),
      }),
    [progress, xpByDay],
  );

  return (
    <section className="card journey">
      <h2 className="journey__title">The whole path</h2>

      <p className="journey__figure">
        <span className="journey__count">{tally.seen}</span>
        <span className="journey__of">of {tally.total} exercises seen</span>
      </p>

      <ProgressBar className="journey__bar" tally={tally} colour="var(--accent)" />

      <p className="journey__figures">
        {tally.mastered} mastered · {known} of {cards.length} concepts known
      </p>

      <p className="journey__forecast">{forecastSentence(view)}</p>
    </section>
  );
}

/**
 * Three states, in the order they arrive. The distance is always hedged ("at
 * your recent pace", "about"): the model behind it is a straight line and the
 * copy must not pretend otherwise (docs/11 part A).
 */
function forecastSentence(view: ReturnType<typeof forecast>): string {
  if (view.unmastered === 0) return 'Everything mastered. Reviews keep it warm from here.';

  if (view.unseen === 0) {
    return `You have seen everything once. About ${formatDuration(
      view.daysToMasterAll,
    )} of reviews stand between here and the last mastery.`;
  }

  const opening = view.assumedDailyPace ? 'At a session a day' : 'At your recent pace';
  return `${opening} the last new exercise is about ${formatDuration(
    view.daysToSeeAll,
  )} away. Mastery follows about ${formatDuration(
    MASTERY_TRAIL_DAYS,
  )} behind, one review at a time.`;
}

/** The first lesson still holding something never presented. */
function nextLesson(track: Track, progress: Record<string, ExerciseProgress>) {
  return track.lessons.find((lesson) =>
    lesson.exerciseIds.some((id) => {
      const p = progress[id];
      return p === undefined || p.seen === 0;
    }),
  );
}
