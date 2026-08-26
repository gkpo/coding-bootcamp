import { complexityOptions } from '../engine/grading';
import type { ComplexityExercise } from '../content/types';
import './options.css';

interface Props {
  exercise: ComplexityExercise;
  selected: string | null;
  onSelect: (answer: string) => void;
  revealed: boolean;
}

/**
 * Deliberately *not* shuffled. The option set is fixed and always in growth
 * order so the ladder itself becomes reflex (docs/02 §complexity) — the point
 * is recognising the shape, and the answers are notation, not positions.
 */
export function ComplexityRenderer({ exercise, selected, onSelect, revealed }: Props) {
  return (
    <div className="option-grid">
      {complexityOptions(exercise).map((option) => {
        const isSelected = selected === option;
        const isCorrect = option === exercise.answer;

        let state = 'idle';
        if (revealed && isCorrect) state = 'correct';
        else if (isSelected && !isCorrect) state = 'wrong';

        return (
          <button
            key={option}
            type="button"
            className={`option option--mono option--${state}`}
            onClick={() => onSelect(option)}
            disabled={revealed}
            aria-pressed={isSelected}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
