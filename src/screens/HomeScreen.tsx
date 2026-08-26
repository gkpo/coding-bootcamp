import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import './HomeScreen.css';

const TRACKS = [
  { id: 't1', emoji: '📈', title: 'Big-O & optimization talk' },
  { id: 't2', emoji: '🧩', title: 'Algorithm patterns' },
  { id: 't3', emoji: '⚙️', title: 'JS/TS language concepts' },
  { id: 't4', emoji: '🪜', title: 'Refactoring & code quality' },
  { id: 't5', emoji: '🏗️', title: 'System design foundations' },
  { id: 't6', emoji: '🗣️', title: 'Interview decoder' },
];

/**
 * M0 placeholder: real streak, session composition and track progress arrive
 * with the store and engine in M1/M2. The layout follows docs/01 §Home so the
 * shell can be judged on-brand today.
 */
export function HomeScreen() {
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
          {TRACKS.map((track) => (
            <article
              className="home__track"
              key={track.id}
              style={{ borderColor: `var(--track-${track.id})` }}
            >
              <span className="home__track-emoji">{track.emoji}</span>
              <span className="home__track-title">{track.title}</span>
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

      <section className="card home__concept">
        <p className="home__concept-kicker">Concept of the day</p>
        <p className="home__concept-title">
          <span aria-hidden>🎒</span> Closure
        </p>
        <p className="home__concept-plain">
          A function that carries a backpack: it keeps access to the variables that existed where it
          was created, even after that place is gone.
        </p>
      </section>
    </div>
  );
}
