import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { RichText } from '../components/RichText';
import { ConceptIcon } from '../components/ConceptIcon';
import { cards, tracks, trackExerciseIds } from '../content';
import { conceptOfTheDay } from '../engine/conceptOfTheDay';
import { addDays, todayKey } from '../engine/dates';
import { TARGET_SESSION_SIZE } from '../engine/sessionComposer';
import { useStore } from '../store/useStore';
import './HomeScreen.css';

/** Mon-first labels for the trailing seven days, oldest to newest. */
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeScreen() {
  const navigate = useNavigate();
  const today = todayKey();
  const streak = useStore((s) => s.streak);
  const xpByDay = useStore((s) => s.xp.byDay);
  const dueCount = useStore((s) => s.dueCount());
  const trackMastery = useStore((s) => s.trackMastery);
  const setLastOpenedTrack = useStore((s) => s.setLastOpenedTrack);

  const card = conceptOfTheDay(cards, today);
  const activeToday = streak.lastActiveDay === today;
  const lastSeven = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className="stack home">
      <header className="streak">
        <span
          className={`streak__flame ${activeToday ? 'streak__flame--lit' : 'streak__flame--idle'}`}
        >
          <FlameIcon size={28} />
        </span>
        <div>
          <p className="streak__count">Day {streak.current}</p>
          <p className="streak__hint">
            {activeToday
              ? streak.current > 2
                ? 'This is becoming a habit.'
                : 'Done for today.'
              : streak.current > 0
                ? 'Keep it alive today.'
                : 'Your first session starts the streak.'}
          </p>
        </div>
      </header>

      <div className="streak__dots" aria-label="Last 7 days">
        {lastSeven.map((day, i) => {
          const practiced = (xpByDay[day] ?? 0) > 0;
          return (
            <span className={`streak__dot ${practiced ? 'is-on' : ''}`} key={day}>
              <span className="visually-hidden">
                {DAY_LABELS[i]}: {practiced ? 'practiced' : 'not practiced'}
              </span>
            </span>
          );
        })}
      </div>

      <section className="card">
        <h1 className="screen-title">Daily session</h1>
        <p className="screen-lede">
          ~{Math.max(3, Math.round(TARGET_SESSION_SIZE * 0.75))} min · {TARGET_SESSION_SIZE}{' '}
          exercises
        </p>
        <div className="home__cta">
          <Button onClick={() => navigate('/session')}>
            {activeToday ? 'Another session' : 'Start'}
          </Button>
        </div>
      </section>

      {dueCount > 0 && (
        <Link to="/review" className="card home__review">
          <span className="home__review-count">{dueCount}</span>
          <span className="home__review-text">
            {dueCount === 1 ? 'item due for review' : 'items due for review'}
          </span>
        </Link>
      )}

      <section>
        <h2 className="home__section-title">Tracks</h2>
        <div className="home__strip">
          {tracks.map((track) => {
            const mastery = trackMastery(track.id);
            return (
              <Link
                to="/tracks"
                className="home__track"
                key={track.id}
                onClick={() => setLastOpenedTrack(track.id)}
              >
                <span className="home__track-icon" style={{ color: `var(--track-${track.id})` }}>
                  <ConceptIcon name={track.icon} size={22} />
                </span>
                <span className="home__track-title">{track.title}</span>
                <span className="home__track-count">
                  {Math.round(mastery * 100)}% of {trackExerciseIds(track.id).length}
                </span>
                <span className="home__track-bar">
                  <span
                    className="home__track-fill"
                    style={{
                      width: `${mastery * 100}%`,
                      background: `var(--track-${track.id})`,
                    }}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {card && (
        <section className="card home__concept">
          <p className="home__concept-kicker">Concept of the day</p>
          <p className="home__concept-title">
            <span className="home__concept-icon">
              <ConceptIcon name={card.icon} size={20} />
            </span>
            {card.title}
          </p>
          <p className="home__concept-plain">
            <RichText text={card.plainWords} />
          </p>
        </section>
      )}
    </div>
  );
}
