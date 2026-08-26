import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { cards, tracks, trackExerciseIds } from '../content';
import { conceptOfTheDay } from '../engine/conceptOfTheDay';
import { todayKey } from '../engine/dates';
import './HomeScreen.css';

/**
 * M1: track cards and the concept of the day now come from the content
 * modules rather than being hard-coded here. Streak, XP and real progress
 * arrive with the store in M2 — the zeroes below are honest placeholders.
 */
export function HomeScreen() {
  const today = todayKey();
  const card = conceptOfTheDay(cards, today);

  return (
    <div className="stack home">
      <header className="streak">
        <span className="streak__flame streak__flame--idle">
          <FlameIcon size={28} />
        </span>
        <div>
          <p className="streak__count">Day 0</p>
          <p className="streak__hint">Your first session starts the streak.</p>
        </div>
      </header>

      <div className="streak__dots" aria-label="Last 7 days">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <span className="streak__dot" key={`${day}-${i}`}>
            <span className="visually-hidden">{day}: not practiced</span>
          </span>
        ))}
      </div>

      <section className="card">
        <h1 className="screen-title">Daily session</h1>
        <p className="screen-lede">~6 min · 8 exercises</p>
        <div className="home__cta">
          <Button disabled>Coming in M2</Button>
        </div>
      </section>

      <section>
        <h2 className="home__section-title">Tracks</h2>
        <div className="home__strip">
          {tracks.map((track) => (
            <article
              className="home__track"
              key={track.id}
              style={{ borderTopColor: `var(--track-${track.id})` }}
            >
              <span className="home__track-emoji" aria-hidden>
                {track.emoji}
              </span>
              <span className="home__track-title">{track.title}</span>
              <span className="home__track-count">
                {trackExerciseIds(track.id).length} exercises
              </span>
              <span className="home__track-bar">
                <span
                  className="home__track-fill"
                  style={{ background: `var(--track-${track.id})` }}
                />
              </span>
            </article>
          ))}
        </div>
      </section>

      {card && (
        <section className="card home__concept">
          <p className="home__concept-kicker">Concept of the day</p>
          <p className="home__concept-title">
            <span aria-hidden>{card.emoji}</span> {card.title}
          </p>
          <p className="home__concept-plain">{card.plainWords}</p>
        </section>
      )}
    </div>
  );
}
