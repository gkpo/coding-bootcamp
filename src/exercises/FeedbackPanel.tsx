import { useMemo, useState } from 'react';
import { RichText } from '../components/RichText';
import { Button } from '../components/Button';
import type { ReactNode } from 'react';
import type { Outcome } from './ExerciseFrame';
import './FeedbackPanel.css';

/** Design system §Copy voice: warm, brief, adult. Never "Incorrect!". */
const AFFIRMATIONS = ['That’s the one.', 'Second nature yet?', 'Interviewer nods.', 'Clean.'];

interface Props {
  outcome: Outcome;
  explanation: string;
  /** Feedback authored against the specific wrong option that was picked. */
  whyWrong?: string;
  /** The mandatory out-loud phrase on complexity exercises. */
  sayIt?: string;
  onContinue: () => void;
  seed: number;
  isLast: boolean;
  /** The correct answer, for types that cannot show it in place. */
  reveal?: ReactNode;
}

export function FeedbackPanel({
  outcome,
  explanation,
  whyWrong,
  sayIt,
  onContinue,
  seed,
  isLast,
  reveal,
}: Props) {
  const [showWhy, setShowWhy] = useState(outcome !== 'right');
  const affirmation = useMemo(() => AFFIRMATIONS[seed % AFFIRMATIONS.length], [seed]);

  const heading =
    outcome === 'right'
      ? affirmation
      : outcome === 'unsure'
        ? 'No stress. Here’s how it works:'
        : 'Not this one — here’s the idea:';

  return (
    <section className={`feedback feedback--${outcome}`} aria-live="polite">
      <p className="feedback__heading">{heading}</p>

      {whyWrong && (
        <p className="feedback__why-wrong">
          <RichText text={whyWrong} />
        </p>
      )}

      {reveal}

      {sayIt && (
        <p className="feedback__say-it">
          <span className="feedback__say-label">Say it like this</span>
          <RichText text={sayIt} />
        </p>
      )}

      {showWhy ? (
        <p className="feedback__explanation">
          <RichText text={explanation} />
        </p>
      ) : (
        <button type="button" className="feedback__why" onClick={() => setShowWhy(true)}>
          Why?
        </button>
      )}

      <div className="feedback__cta">
        <Button onClick={onContinue}>{isLast ? 'Finish' : 'Continue'}</Button>
      </div>
    </section>
  );
}
