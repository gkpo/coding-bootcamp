import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { RichText } from '../components/RichText';
import { FlameIcon } from '../components/icons';
import { Confetti } from '../components/Confetti';
import { ConceptIcon } from '../components/ConceptIcon';
import { getCard, getExercise } from '../content';
import type { Result } from '../engine/leitner';
import { playTone, vibrate } from '../engine/feedback';
import { useStore } from '../store/useStore';
import './SessionSummaryScreen.css';

interface SummaryState {
  results: Result[];
  xpEarned: number;
  streakDays: number;
  toughestId?: string;
  conceptIds: string[];
}

export function SessionSummaryScreen() {
  const navigate = useNavigate();
  const state = (useLocation().state ?? null) as SummaryState | null;
  const sound = useStore((s) => s.settings.sound);
  const haptics = useStore((s) => s.settings.haptics);

  // The confetti had been landing in silence. This is the one moment in the
  // app that has earned the full cue, so it gets it, once, on arrival. The ref
  // is what keeps it to once: StrictMode runs effects twice in development,
  // and two copies of a five note chord an instant apart is not the sound.
  const celebrated = useRef(false);
  useEffect(() => {
    if (!state || celebrated.current) return;
    celebrated.current = true;
    playTone('complete', sound);
    vibrate('complete', haptics);
    // Deliberately arrival-only: re-firing when a setting is toggled from
    // another tab would replay the fanfare at nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) {
    // Landed here directly (refresh, deep link), nothing to celebrate.
    navigate('/', { replace: true });
    return null;
  }

  const { results, xpEarned, streakDays, toughestId, conceptIds } = state;
  const right = results.filter((r) => r === 'right').length;
  const answerXp = results.reduce((sum, r) => sum + (r === 'right' ? 10 : 5), 0);
  const toughest = toughestId ? getExercise(toughestId) : undefined;
  const cards = conceptIds.map((id) => getCard(id)).filter((c) => c !== undefined);

  return (
    <main className="summary">
      <Confetti active />
      <div className="summary__hero">
        <p className="summary__kicker">Session complete</p>
        <p className="summary__xp">+{answerXp + xpEarned} XP</p>
        <p className="summary__streak">
          <span className="summary__flame">
            <FlameIcon size={20} />
          </span>
          Day {streakDays}
          {streakDays === 7 && ' · a full week'}
          {streakDays === 30 && ' · thirty days'}
          {streakDays > 2 && streakDays !== 7 && streakDays !== 30 && ' · this is becoming a habit'}
        </p>
      </div>

      <section className="card summary__score">
        <p className="summary__score-line">
          <strong>
            {right} of {results.length}
          </strong>{' '}
          first try
        </p>
        <div className="summary__dots">
          {results.map((r, i) => (
            <span key={i} className={`summary__dot summary__dot--${r}`} />
          ))}
        </div>
      </section>

      {toughest && (
        <section className="card">
          <h2 className="summary__label">Toughest moment</h2>
          <p className="summary__tough">
            <RichText text={toughest.prompt} />
          </p>
          <p className="summary__takeaway">
            <RichText text={`${toughest.explanation.split('. ')[0]}.`} />
          </p>
        </section>
      )}

      {cards.length > 0 && (
        <section>
          <h2 className="summary__label summary__label--loose">Concepts touched</h2>
          <div className="summary__chips">
            {cards.map((card) => (
              <span className="summary__chip" key={card.id}>
                <ConceptIcon name={card.icon} size={16} />
                <RichText text={card.title} />
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="summary__cta">
        <Button onClick={() => navigate('/', { replace: true })}>Done</Button>
      </div>
    </main>
  );
}
