import { Link, useParams } from 'react-router-dom';
import { getCard, getExercise, getTrack } from '../content';
import { useStore } from '../store/useStore';
import { ConceptIcon } from '../components/ConceptIcon';
import { seenFill } from '../components/progressFill';
import { BackIcon, CheckIcon } from '../components/icons';
import { isMastered, type ExerciseProgress } from '../engine/leitner';
import type { ConceptCard, Lesson, TrackId } from '../content/types';
import './TracksScreen.css';

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Choose',
  complexity: 'Name the growth',
  parsons: 'Build it',
  'spot-bug': 'Find the bug',
  blank: 'Fill the blanks',
  ladder: 'Next move',
  match: 'Pair them',
  steps: 'Order them',
};

type NodeState = 'untouched' | 'started' | 'mastered';

/**
 * A track as a path: lessons are stations on one vertical spine, each carrying
 * the concepts it teaches and the exercises it asks (docs/11 part C).
 *
 * The path describes the recommended order and nothing more. Every station is
 * open from day one; the node states and the "you are here" pill say where the
 * user stands, never where they are allowed to go.
 */
export function TrackDetailScreen() {
  const { trackId } = useParams<{ trackId: TrackId }>();
  const track = trackId ? getTrack(trackId) : undefined;
  const progress = useStore((s) => s.exercises);

  if (!track) {
    return (
      <div className="stack">
        <h1 className="screen-title">Not found</h1>
        <Link to="/tracks" className="track-detail__back">
          <BackIcon /> All tracks
        </Link>
      </div>
    );
  }

  const colour = `var(--track-${track.id})`;
  const hereId = track.lessons.find((lesson) => hasUnseen(lesson, progress))?.id;

  return (
    <div className="stack">
      <Link to="/tracks" className="track-detail__back">
        <BackIcon /> All tracks
      </Link>
      <div>
        <h1 className="screen-title track-detail__title">
          <span style={{ color: colour }}>
            <ConceptIcon name={track.icon} size={24} />
          </span>
          {track.title}
        </h1>
        <p className="screen-lede">{track.tagline}</p>
      </div>

      <ol className="path">
        {track.lessons.map((lesson, index) => (
          <li className="path__station" key={lesson.id}>
            <div className="path__rail">
              <PathNode number={index + 1} state={nodeState(lesson, progress)} colour={colour} />
            </div>

            <section className="card station">
              <div className="station__head">
                <h2 className="station__title">{lesson.title}</h2>
                {lesson.id === hereId && (
                  <span
                    className="station__pill"
                    style={{ background: `color-mix(in srgb, ${colour} 10%, var(--surface))` }}
                  >
                    You are here
                  </span>
                )}
              </div>

              <ConceptChips cards={conceptsIn(lesson)} />

              <ul className="lesson__list">
                {lesson.exerciseIds.map((id) => {
                  const exercise = getExercise(id);
                  if (!exercise) return null;
                  const p = progress[id];
                  const done = p !== undefined && isMastered(p);
                  const seen = p !== undefined && p.seen > 0;
                  return (
                    <li className="lesson__item" key={id}>
                      <span
                        className={`lesson__dot ${done ? 'is-mastered' : seen ? 'is-seen' : ''}`}
                        style={done ? { background: colour } : undefined}
                        aria-hidden
                      />
                      <span className="lesson__type">{TYPE_LABEL[exercise.type]}</span>
                      <span
                        className="lesson__diff"
                        aria-label={`Difficulty ${exercise.difficulty}`}
                      >
                        {[1, 2, 3].map((level) => (
                          <span
                            key={level}
                            className={`lesson__pip ${level <= exercise.difficulty ? 'is-on' : ''}`}
                          />
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The station marker. Its fill is the progress bar's own seen recipe rather
 * than a second mix of the same colour: the two sit on the same screen and any
 * drift between them reads as a rendering bug.
 */
function PathNode({ number, state, colour }: { number: number; state: NodeState; colour: string }) {
  const fill = state === 'mastered' ? colour : state === 'started' ? seenFill(colour) : undefined;

  return (
    <span
      className={`path__node path__node--${state}`}
      style={fill ? { background: fill } : undefined}
    >
      {state === 'mastered' ? (
        <CheckIcon size={14} />
      ) : (
        <span className="path__node-number">{number}</span>
      )}
      <span className="visually-hidden">
        {state === 'mastered' ? 'Mastered' : state === 'started' ? 'Started' : 'Not started'}
      </span>
    </span>
  );
}

/**
 * The concepts a station teaches, each a way into its cheat sheet. A concept
 * reappearing on a later station is correct and wanted: revisiting hash lookups
 * in a harder lesson is the same idea coming back, not a duplicate.
 */
function ConceptChips({ cards }: { cards: ConceptCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="station__chips">
      {cards.map((card) => (
        <Link key={card.id} to={`/sheets/${card.id}`} className="station__chip">
          <ConceptIcon name={card.icon} size={16} />
          {card.title}
        </Link>
      ))}
    </div>
  );
}

/** Distinct concepts of a lesson, in the order its exercises introduce them. */
function conceptsIn(lesson: Lesson): ConceptCard[] {
  const seen = new Set<string>();
  const out: ConceptCard[] = [];
  for (const id of lesson.exerciseIds) {
    const conceptId = getExercise(id)?.conceptId;
    if (conceptId === undefined || seen.has(conceptId)) continue;
    seen.add(conceptId);
    const card = getCard(conceptId);
    if (card) out.push(card);
  }
  return out;
}

function hasUnseen(lesson: Lesson, progress: Record<string, ExerciseProgress>): boolean {
  return lesson.exerciseIds.some((id) => {
    const p = progress[id];
    return p === undefined || p.seen === 0;
  });
}

function nodeState(lesson: Lesson, progress: Record<string, ExerciseProgress>): NodeState {
  let seen = 0;
  let mastered = 0;
  for (const id of lesson.exerciseIds) {
    const p = progress[id];
    if (p === undefined || p.seen === 0) continue;
    seen += 1;
    if (isMastered(p)) mastered += 1;
  }
  if (lesson.exerciseIds.length > 0 && mastered === lesson.exerciseIds.length) return 'mastered';
  return seen > 0 ? 'started' : 'untouched';
}
