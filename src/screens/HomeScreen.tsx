import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
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
 * How far the body text may be stepped down to fit the fixed card height.
 * Every card in the deck is the same height, so the deck reads as a deck; the
 * few cards whose plain words run long give up two type steps rather than
 * making all seventy-two carry the tallest one's empty space.
 */
const MAX_FIT_STEP = 2;

/** One face of the deck: the header row, the title line and the plain words. */
function ConceptFace({
  card,
  onSkip,
}: {
  card: ConceptCard;
  onSkip: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <>
      <div className="home__concept-header">
        <p className="home__concept-kicker">Daily concept</p>
        <Button variant="ghost" className="home__concept-another" onClick={onSkip}>
          One more
        </Button>
      </div>
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

function stepClass(step: number): string {
  return step > 0 ? ` home__concept-card--step${step}` : '';
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
  const [leaving, setLeaving] = useState<{ card: ConceptCard; step: number } | null>(null);
  // Which type step the card on top is drawn at, and which card that was
  // measured for. Reset to 0 whenever the card changes, then stepped down
  // below until the words fit the fixed height.
  const [fit, setFit] = useState({ id: card?.id, step: 0 });
  const faceRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);

  // The button rides the card, so a swap replaces the very button that was
  // pressed. A finger does not care, but a keyboard press would drop focus to
  // the page and the next press would go nowhere, so hand it to the new one.
  // `detail` is 0 only for a press that came from the keyboard.
  const handleSkip = (event: MouseEvent<HTMLButtonElement>) => {
    returnFocus.current = event.detail === 0;
    skipConcept();
  };

  // Declared before the fit effect on purpose: when the card changes, this one
  // runs first and still sees the step the outgoing card was drawn at, so the
  // snapshot flies out looking exactly as it did a moment ago.
  useLayoutEffect(() => {
    const last = shown.current;
    const tapped = last.day === today && skips > last.skips;
    if (tapped && last.card && last.card.id !== card?.id) {
      setLeaving({ card: last.card, step: fit.id === last.card.id ? fit.step : 0 });
      if (returnFocus.current) {
        // preventScroll: the button is already where the reader is looking.
        faceRef.current?.querySelector('button')?.focus({ preventScroll: true });
      }
    }
    returnFocus.current = false;
    shown.current = { day: today, skips, card };
    // `fit` is read, not tracked: this must fire on a card change, not on a
    // step change, or the snapshot would be replaced mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, skips, card]);

  // Fit check. Runs before paint, so an overflowing step is never shown: the
  // face is measured against the height it is allowed, and if the words spill
  // the next step down is applied and measured again, at most twice.
  useLayoutEffect(() => {
    if (!card) return;
    if (fit.id !== card.id) {
      setFit({ id: card.id, step: 0 });
      return;
    }
    const face = faceRef.current;
    if (!face) return;
    if (fit.step < MAX_FIT_STEP && face.scrollHeight > face.clientHeight) {
      setFit({ id: card.id, step: fit.step + 1 });
    }
  }, [card, fit]);

  // The fit check measures text, and the app's font arrives after the first
  // paint (font-display: swap in base.css), so the very first visit can
  // measure the fallback face. Re-run the ladder once the real font is in,
  // or a card that measured as fitting could end up a line short.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts || fonts.status === 'loaded') return;
    let live = true;
    fonts.ready
      .then(() => {
        if (live) setFit((current) => ({ id: current.id, step: 0 }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    // animationend is the usual end of it; this covers the cases where it
    // never fires, such as the tab being hidden part way through the swap.
    const timer = setTimeout(() => setLeaving(null), SWAP_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  // The row keeps calendar order, Monday first, so it never reads as a week
  // that begins on a Friday. Each tile holds the most recent occurrence of its
  // weekday: the days up to today are this week's, and a weekday still to come
  // stands for the same weekday last week. That is what keeps a practiced day
  // lit for a full seven days, so a streak started last Thursday is still on
  // screen come Monday. When a weekday comes around again its tile starts
  // representing the new day, which is why a lit tile goes out on the morning
  // it becomes today.
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
          its own weekday and today ringed. A tile for a weekday still to come
          carries that weekday from last week, so a day stays lit for seven days
          and last Thursday's work is still visible on Monday. A weekday still
          to come with nothing behind it is drawn as a hole rather than as a
          missed day. */}
      <div className="streak__week" aria-label="Your week">
        {thisWeek.map((day) => {
          const isToday = day === today;
          const ahead = day > today;
          // The tile for a weekday still to come stands for last week's
          // occurrence of it, which is the most recent one that has happened.
          const carried = ahead && (xpByDay[addDays(day, -7)] ?? 0) > 0;
          const practiced = ahead ? carried : (xpByDay[day] ?? 0) > 0;
          const empty = ahead && !carried;
          const weekday = weekdayIndex(day);
          return (
            <span
              className={`streak__day ${practiced ? 'is-on' : ''} ${isToday ? 'is-today' : ''} ${empty ? 'is-future' : ''}`}
              key={day}
            >
              <span className="streak__day-name" aria-hidden>
                {DAY_SHORT[weekday]}
              </span>
              <span className="streak__dot" aria-hidden />
              <span className="visually-hidden">
                {isToday ? 'Today' : DAY_NAMES[weekday]}
                {ahead
                  ? carried
                    ? ': practiced last week'
                    : ': still to come'
                  : practiced
                    ? ': practiced'
                    : ': not practiced'}
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
        // A stage rather than a card: the surfaces below are the deck, and the
        // one on top is the card being read.
        <section className="home__concept">
          {/* The rest of the deck. Keyed on the card being read so that a
              second tap mid-flight restarts them with the card layers rather
              than leaving them stranded half way through the last deal. */}
          <div
            className={`home__concept-under home__concept-under--back${leaving ? ' home__concept-under--arriving' : ''}`}
            key={`under-back-${card.id}`}
            aria-hidden
          />
          <div
            className={`home__concept-under home__concept-under--front${leaving ? ' home__concept-under--promoting' : ''}`}
            key={`under-front-${card.id}`}
            aria-hidden
          />
          {/* The card just left behind, held for the length of its flight and
              taken out of reach while it is on screen. */}
          {leaving && (
            <div
              className={`card home__concept-card home__concept-card--leaving${stepClass(leaving.step)}`}
              key={`leaving-${leaving.card.id}`}
              aria-hidden
              inert
              onAnimationEnd={() => setLeaving(null)}
            >
              <div className="home__concept-face">
                <ConceptFace card={leaving.card} onSkip={handleSkip} />
              </div>
            </div>
          )}
          {/* The card being read. During a swap it starts where the first
              surface below sits and rises into place, so what arrives is the
              card that was visibly behind the one leaving. */}
          <div
            className={`card home__concept-card${leaving ? ' home__concept-card--entering' : ''}${stepClass(fit.step)}`}
            key={card.id}
          >
            <div className="home__concept-face" ref={faceRef}>
              <ConceptFace card={card} onSkip={handleSkip} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
