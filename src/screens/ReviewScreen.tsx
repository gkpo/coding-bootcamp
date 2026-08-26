import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { getExercise, getTrack, tracks } from '../content';
import { dueExercises } from '../engine/leitner';
import { todayKey } from '../engine/dates';
import { useStore } from '../store/useStore';
import { ConceptIcon } from '../components/ConceptIcon';
import type { TrackId } from '../content/types';
import './ReviewScreen.css';

export function ReviewScreen() {
  const navigate = useNavigate();
  const progress = useStore((s) => s.exercises);

  const byTrack = useMemo(() => {
    const due = dueExercises(progress, todayKey()).filter((id) => getExercise(id) !== undefined);
    const grouped = new Map<TrackId, string[]>();
    for (const id of due) {
      const trackId = getExercise(id)!.trackId;
      grouped.set(trackId, [...(grouped.get(trackId) ?? []), id]);
    }
    return grouped;
  }, [progress]);

  const total = [...byTrack.values()].reduce((n, ids) => n + ids.length, 0);

  if (total === 0) {
    return (
      <div className="stack">
        <div>
          <h1 className="screen-title">Review</h1>
          <p className="screen-lede">Items you missed come back here until they stick.</p>
        </div>
        <section className="card review__empty">
          <p className="review__empty-title">Nothing due.</p>
          <p className="review__empty-body">Come back tomorrow, or learn something new.</p>
          <Button variant="secondary" onClick={() => navigate('/tracks')}>
            Browse tracks
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">Review</h1>
        <p className="screen-lede">
          {total} {total === 1 ? 'item is' : 'items are'} due.
        </p>
      </div>

      {tracks.map((track) => {
        const ids = byTrack.get(track.id);
        if (!ids || ids.length === 0) return null;
        return (
          <section className="card" key={track.id}>
            <h2 className="review__track">
              <span style={{ color: `var(--track-${track.id})` }}>
                <ConceptIcon name={track.icon} size={20} />
              </span>
              {getTrack(track.id)?.title}
              <span className="review__count">{ids.length}</span>
            </h2>
          </section>
        );
      })}

      <div className="review__cta">
        <Button onClick={() => navigate('/session?mode=review')}>Review all</Button>
      </div>
    </div>
  );
}
