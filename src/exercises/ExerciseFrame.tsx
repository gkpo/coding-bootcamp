import { useState, type ReactNode } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { ConceptCardView } from '../components/ConceptCardView';
import { CodeBlock } from '../components/CodeBlock';
import { RichText } from '../components/RichText';
import { stripMarkdown } from '../engine/markdown';
import { getCard } from '../content';
import { HelpIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import type { Exercise } from '../content/types';
import './ExerciseFrame.css';

export type Outcome = 'right' | 'wrong' | 'unsure';

interface Props {
  exercise: Exercise;
  /** The answer area. Supplied by the per-type renderer. */
  children: ReactNode;
  /** Hidden once the exercise is resolved. */
  onUnsure?: () => void;
  showUnsure: boolean;
  feedback?: ReactNode;
  /** Rendered instead of the code block when a renderer draws its own. */
  suppressCode?: boolean;
}

/**
 * The shared chrome every exercise type sits inside: prompt, optional code,
 * the "?" concept chip, the answer area, and "I'm not sure".
 *
 * The "?" chip opens the concept card *without* failing the exercise. Reading
 * before answering is encouraged. This is a learning app, not an exam.
 *
 * It carries no label, because the concept's name is often the answer: on
 * "name the pattern" exercises a chip reading "Sliding window" or "Guard
 * clauses" hands over the option to pick, and everywhere else it decodes the
 * interviewer's riddle before the user has had a go at it (docs/00, gap 3).
 * The help is still one tap away; it is just no longer given away unasked.
 */
export function ExerciseFrame({
  exercise,
  children,
  onUnsure,
  showUnsure,
  feedback,
  suppressCode,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openConceptCard = useStore((s) => s.openConceptCard);
  const card = getCard(exercise.conceptId);

  const openSheet = () => {
    setSheetOpen(true);
    openConceptCard(exercise.conceptId);
  };

  return (
    <div className="frame">
      <div className="frame__prompt">
        <p className="frame__question">
          <RichText text={exercise.prompt} />
        </p>
        {card && (
          <button
            type="button"
            className="chip chip--concept"
            aria-label="Open the concept card for this exercise"
            onClick={openSheet}
          >
            <HelpIcon size={20} />
          </button>
        )}
      </div>

      {exercise.code && !suppressCode && <CodeBlock code={exercise.code} />}

      <div className="frame__answers">{children}</div>

      {showUnsure && onUnsure && (
        <button type="button" className="frame__unsure" onClick={onUnsure}>
          I&rsquo;m not sure
        </button>
      )}

      {feedback}

      {card && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={stripMarkdown(card.title)}
        >
          <ConceptCardView card={card} />
        </BottomSheet>
      )}
    </div>
  );
}
