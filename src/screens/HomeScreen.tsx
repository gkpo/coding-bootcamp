import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { RichText } from '../components/RichText';
import { ConceptIcon } from '../components/ConceptIcon';
import { ProgressBar } from '../components/ProgressBar';
import { cards, tracks } from '../content';
import type { ConceptCard } from '../content/types';
import { conceptOfTheDay } from '../engine/conceptOfTheDay';
import { addDays, startOfWeek, todayKey, weekdayIndex } from '../engine/dates';
import { TARGET_SESSION_SIZE } from '../engine/sessionComposer';
import { useStore } from '../store/useStore';
import './HomeScreen.css';

/** Both indexed by `weekdayIndex`, so Monday first. */
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Long enough to outlast the swap, in case animationend never arrives. */
const SWAP_FALLBACK_MS = 600;

/**
 * The part of the concept card that changes when the deck advances: the title
 * line and the plain words. The kicker and the button sit outside it, so they
 * stay put while this slides.
 */
function ConceptBody({ card }: { card: ConceptCard }) {
  return (
    <>
      <p className="home__concept-title">
        <span className="home__concept-icon">
          <ConceptIcon name={card.icon} size={20} />
        </span>
        {card.title}
      </p>
      <p className="home__concept-plain">
        <RichText text={card.plainWords} />
      </p>
    </>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const today = todayKey();
  const streak = useStore((s) => s.streak);
  const xpByDay = useStore((s) => s.xp.byDay);
  const dueCount = useStore((s) => s.dueCount());
  const trackTally = useStore((s) => s.trackTally);
  const setLastOpenedTrack = useStore((s) => s.setLastOpenedTrack);
  const conceptSkips = useStore((s) => s.conceptSkips);
  const skipConcept = useStore((s) => s.skipConcept);

  // Skips only count for the day they were made: tomorrow starts fresh on the
  // natural rotation rather than carrying today's offset forward.
  const skips = conceptSkips.day === today ? conceptSkips.count : 0;
  const card = conceptOfTheDay(cards, today, skips);
  const activeToday = streak.lastActiveDay === today;

  // Only a tap swaps with motion. `shown` is what was on screen last render,
  // so a first mount and a day rolling over (which resets skips to zero) both
  // fail the "same day, one more skip" test and simply appear.
  const shown = useRef({ day: today, skips, card });
  const [leaving, setLeaving] = useState<ConceptCard | null>(null);

  useLayoutEffect(() => {
    const last = shown.current;
    const tapped = last.day === today && skips > last.skips;
    if (tapped && last.card && last.card.id !== card?.id) setLeaving(last.card);
    shown.current = { day: today, skips, card };
  }, [today, skips, card]);

  useEffect(() => {
    if (!leaving) return;
    // animationend is the usual end of it; this covers the cases where it
    // never fires, such as the tab being hidden part way through the swap.
    const timer = setTimeout(() => setLeaving(null), SWAP_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  // The current Monday-to-Sunday week, the same week the profile calendar ends
  // on. A trailing seven days would start on whatever weekday today happens to
  // be, which reads as a week that begins on a Friday.
  const thisWeek = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));

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

      {/* Monday on the left through Sunday on the right, each tile named from
          its own date and today ringed. Days still to come are drawn as holes
          rather than as missed days. */}
      <div className="streak__week" aria-label="This week">
        {thisWeek.map((day) => {
          const practiced = (xpByDay[day] ?? 0) > 0;
          const isToday = day === today;
          const future = day > today;
          const weekday = weekdayIndex(day);
          return (
            <span
              className={`streak__day ${practiced ? 'is-on' : ''} ${isToday ? 'is-today' : ''} ${future ? 'is-future' : ''}`}
              key={day}
            >
              <span className="streak__day-name" aria-hidden>
                {DAY_SHORT[weekday]}
              </span>
              <span className="streak__dot" aria-hidden />
              <span className="visually-hidden">
                {isToday ? 'Today' : DAY_NAMES[weekday]}
                {future ? ': still to come' : practiced ? ': practiced' : ': not practiced'}
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
            const tally = trackTally(track.id);
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
                  {tally.seen} of {tally.total} seen
                </span>
                <ProgressBar className="home__track-bar" tally={tally} trackId={track.id} />
              </Link>
            );
          })}
        </div>
      </section>

      {card && (
        <section className="card home__concept">
          <p className="home__concept-kicker">Concept of the day</p>
          <div className="home__concept-stage">
            {/* The outgoing card is held here for the length of the swap only,
                laid over the incoming one so the two cross rather than queue. */}
            {leaving && (
              <div
                className="home__concept-body home__concept-body--leaving"
                key={leaving.id}
                aria-hidden
                onAnimationEnd={() => setLeaving(null)}
              >
                <ConceptBody card={leaving} />
              </div>
            )}
            <div
              className={`home__concept-body ${leaving ? 'home__concept-body--entering' : ''}`}
              key={card.id}
            >
              <ConceptBody card={card} />
            </div>
          </div>
          <Button variant="ghost" className="home__concept-another" onClick={skipConcept}>
            Show another
          </Button>
        </section>
      )}
    </div>
  );
}
