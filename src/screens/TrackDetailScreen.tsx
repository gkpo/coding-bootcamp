import { Link, useParams } from 'react-router-dom';
import { getExercise, getTrack } from '../content';
import { useStore } from '../store/useStore';
import { ConceptIcon } from '../components/ConceptIcon';
import { BackIcon } from '../components/icons';
import { isMastered } from '../engine/leitner';
import type { TrackId } from '../content/types';
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

  return (
    <div className="stack">
      <Link to="/tracks" className="track-detail__back">
        <BackIcon /> All tracks
      </Link>
      <div>
        <h1 className="screen-title track-detail__title">
          <span style={{ color: `var(--track-${track.id})` }}>
            <ConceptIcon name={track.icon} size={24} />
          </span>
          {track.title}
        </h1>
        <p className="screen-lede">{track.tagline}</p>
      </div>

      {track.lessons.map((lesson) => (
        <section className="card lesson" key={lesson.id}>
          <h2 className="lesson__title">{lesson.title}</h2>
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
                    style={done ? { background: `var(--track-${track.id})` } : undefined}
                    aria-hidden
                  />
                  <span className="lesson__type">{TYPE_LABEL[exercise.type]}</span>
                  <span className="lesson__diff" aria-label={`Difficulty ${exercise.difficulty}`}>
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
      ))}
    </div>
  );
}
