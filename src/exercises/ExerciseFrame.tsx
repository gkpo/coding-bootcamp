import { useState, type ReactNode } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { ConceptCardView } from '../components/ConceptCardView';
import { CodeBlock } from '../components/CodeBlock';
import { RichText } from '../components/RichText';
import { stripMarkdown } from '../engine/markdown';
import { promptFor } from '../engine/prompts';
import { getCard } from '../content';
import { HelpIcon } from '../components/icons';
import { muscleLabelFor } from './muscleLabels';
import { useStore } from '../store/useStore';
import type { Exercise } from '../content/types';
import './ExerciseFrame.css';

export type Outcome = 'right' | 'wrong' | 'unsure';

interface Props {
  exercise: Exercise;
  /** Per-presentation seed; picks the prompt phrasing (docs/10 part B). */
  seed: number;
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
 * the concept chip, the answer area, and "I'm not sure".
 *
 * The chip opens the concept card *without* failing the exercise. Reading
 * before answering is encouraged. This is a learning app, not an exam.
 *
 * Its label names the object, not the concept. That distinction is the whole
 * rule: the concept's name is often the answer, so a chip reading "Sliding
 * window" or "Guard clauses" would hand over the option to pick and decode the
 * interviewer's riddle before the user has had a go at it (docs/00, gap 3).
 * "Concept card" gives away nothing and still tells a first-time user what one
 * tap gets them, which an unlabelled glyph never did.
 */
export function ExerciseFrame({
  exercise,
  seed,
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
        <p className="frame__kicker">{muscleLabelFor(exercise)}</p>
        <p className="frame__question">
          <RichText text={promptFor(exercise, seed)} />
        </p>
        {card && (
          <button type="button" className="chip chip--concept" onClick={openSheet}>
            <HelpIcon size={20} />
            Concept card
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
