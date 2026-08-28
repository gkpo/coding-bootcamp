import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { RichText } from '../components/RichText';
import { FlameIcon } from '../components/icons';
import { ConceptIcon } from '../components/ConceptIcon';
import { useCountUp } from '../components/useCountUp';
import { BuildRender } from '../capstone/BuildRender';
import { ReferencePanel } from '../capstone/ReferencePanel';
import { getCapstone, getCard, getExercise } from '../content';
import type { Build } from '../engine/archgraph';
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
  /**
   * Set when a build-mode capstone sends the user here (docs/12 part D). The
   * celebration is the same one; what changes is what the figures count, and
   * that a capstone pays XP without touching the streak.
   */
  capstone?: { id: string; title: string; build: Build };
  /** Capstones only: the XP actually awarded, which is nothing on a replay. */
  totalXp?: number;
}

export function SessionSummaryScreen() {
  const navigate = useNavigate();
  const state = (useLocation().state ?? null) as SummaryState | null;
  const sound = useStore((s) => s.settings.sound);
  const haptics = useStore((s) => s.settings.haptics);
  const [debriefOpen, setDebriefOpen] = useState(false);

  // This is the one moment in the app that has earned the full cue, so it gets
  // it, once, on arrival. The ref is what keeps it to once: StrictMode runs
  // effects twice in development, and two copies of a five note chord an
  // instant apart is not the sound.
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

  // Derived above the early return below, because the count-up is a hook and
  // hooks cannot sit behind a condition.
  const results = state?.results ?? [];
  const right = results.filter((r) => r === 'right').length;
  const answerXp = results.reduce((sum, r) => sum + (r === 'right' ? 10 : 5), 0);
  // A capstone hands over the figure it actually paid; a session's is the sum
  // of its answers plus the completion and streak bonuses.
  const totalXp = state?.capstone ? (state.totalXp ?? 0) : answerXp + (state?.xpEarned ?? 0);
  const shownXp = useCountUp(totalXp);

  if (!state) {
    // Landed here directly (refresh, deep link), nothing to celebrate.
    navigate('/', { replace: true });
    return null;
  }

  const { streakDays, toughestId, conceptIds, capstone } = state;
  const builtCapstone = capstone ? getCapstone(capstone.id) : undefined;
  const toughest = toughestId ? getExercise(toughestId) : undefined;
  const cards = conceptIds.map((id) => getCard(id)).filter((c) => c !== undefined);

  return (
    <main className="summary">
      <div className="summary__hero">
        {/* One soft breath of accent behind the figure, the whole of the
            celebration now that there are no particles (docs/06 §Motion). */}
        <span className="summary__bloom" aria-hidden />
        <p className="summary__kicker">{capstone ? 'Capstone complete' : 'Session complete'}</p>
        {/* A replay pays nothing by design, and "+0 XP" as the hero figure
            reads as a bug rather than as a rule. */}
        {capstone && totalXp === 0 ? (
          <p className="summary__xp">Built again</p>
        ) : (
          <p className="summary__xp">+{shownXp} XP</p>
        )}
        {capstone ? (
          <p className="summary__built">{capstone.title}</p>
        ) : (
          <p className="summary__streak">
            <span className="summary__flame">
              <FlameIcon size={20} />
            </span>
            Day {streakDays}
            {streakDays === 7 && ' · a full week'}
            {streakDays === 30 && ' · thirty days'}
            {streakDays > 2 &&
              streakDays !== 7 &&
              streakDays !== 30 &&
              ' · this is becoming a habit'}
          </p>
        )}
      </div>

      <section className="card summary__score">
        <p className="summary__score-line">
          <strong>
            {right} of {results.length}
          </strong>{' '}
          {capstone ? 'stages without a hint' : 'first try'}
        </p>
        <div className="summary__dots">
          {results.map((r, i) => (
            <span
              key={i}
              className={`summary__dot summary__dot--${r}`}
              // Delays are expressed in motion tokens so both the OS
              // preference and the in-app toggle collapse them to nothing.
              style={{ animationDelay: `calc(var(--dur-micro) * ${(2.4 + i * 0.3).toFixed(2)})` }}
            />
          ))}
        </div>
      </section>

      {capstone && (
        <section className="card summary__build">
          <h2 className="summary__label">What you built</h2>
          <BuildRender build={capstone.build} />
          {/* The debrief, reachable only from here: the capstone is finished,
              so the reference build has nothing left to give away. */}
          {builtCapstone && (
            <Button
              variant="ghost"
              className="summary__debrief"
              aria-expanded={debriefOpen}
              onClick={() => setDebriefOpen((open) => !open)}
            >
              {debriefOpen ? 'Hide the reference build' : 'See the reference build'}
            </Button>
          )}
        </section>
      )}

      {/* Under the drawing it is being compared with, the same panel the board
          screen opens on a cleared stage (docs/12 part F2). */}
      {builtCapstone && debriefOpen && (
        <ReferencePanel capstone={builtCapstone} stageIndex={builtCapstone.stages.length - 1} />
      )}

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
