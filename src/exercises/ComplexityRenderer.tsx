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
 * order so the ladder itself becomes reflex (docs/02 §complexity), the point
 * is recognising the shape, and the answers are notation, not positions.
 *
 * The grid of tiles already reads as pick-one, so it carries the same label as
 * the stacked options but no radio markers: a marker beside `O(n)` would crowd
 * a tile that is mostly notation.
 */
export function ComplexityRenderer({ exercise, selected, onSelect, revealed }: Props) {
  return (
    <>
      <p className="options__label">Pick one</p>
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
    </>
  );
}
