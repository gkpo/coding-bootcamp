import { Link } from 'react-router-dom';
import { exercises, tracks } from '../content';
import { ConceptIcon } from '../components/ConceptIcon';
import { ProgressBar } from '../components/ProgressBar';
import { useStore } from '../store/useStore';
import './TracksScreen.css';

/** Nothing is gated. Everything is available from day one (docs/03). */
export function TracksScreen() {
  const trackTally = useStore((s) => s.trackTally);

  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">Tracks</h1>
        <p className="screen-lede">
          {tracks.length} tracks, {exercises.length} exercises. Start anywhere.
        </p>
      </div>

      {tracks.map((track) => {
        const tally = trackTally(track.id);
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
          </Link>
        );
      })}
    </div>
  );
}
