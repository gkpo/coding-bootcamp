import { useMemo } from 'react';
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
  /**
   * The exercise was completed, but not on the first try (a match board
   * finished after a wrong pair). It scores as a miss, so the outcome stays
   * 'wrong', but nothing is left unsolved on screen and the panel says so.
   */
  recovered?: boolean;
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
  recovered,
}: Props) {
  const affirmation = useMemo(() => AFFIRMATIONS[seed % AFFIRMATIONS.length], [seed]);

  const heading = recovered
    ? 'All paired, but not on the first try.'
    : outcome === 'right'
      ? affirmation
      : outcome === 'unsure'
        ? 'No stress. Here’s how it works:'
        : 'Not this one, here’s the idea:';

  return (
    <section
      className={recovered ? 'feedback feedback--recovered' : `feedback feedback--${outcome}`}
      aria-live="polite"
    >
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

      {/* Always shown, including after a correct answer. It used to hide behind
          a "Why?" link there, to keep the reward beat short. That traded the
          thing the app exists to teach against two lines of prose, and put the
          explanation behind a 41px-wide tap target that read as a caption.
          Getting it right is exactly when the reasoning is cheapest to take
          in, so it is no longer something to ask for. */}
      <p className="feedback__explanation">
        <RichText text={explanation} />
      </p>

      <div className="feedback__cta">
        <Button quiet={isLast} onClick={onContinue}>
          {isLast ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </section>
  );
}
