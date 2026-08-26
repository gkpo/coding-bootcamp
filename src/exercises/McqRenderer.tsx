import { useMemo } from 'react';
import { shuffle } from '../engine/shuffle';
import { RichText } from '../components/RichText';
import type { McqExercise } from '../content/types';
import './options.css';

interface Props {
  exercise: McqExercise;
  seed: number;
  /** Index into the *authored* options array, not the shuffled one. */
  selected: number | null;
  onSelect: (authoredIndex: number) => void;
  revealed: boolean;
}

/**
 * Tap to select and it grades immediately — no confirm step, because fewer
 * taps matters more than undo on a phone (docs/02). Nothing is coloured until
 * the user commits.
 */
export function McqRenderer({ exercise, seed, selected, onSelect, revealed }: Props) {
  const order = useMemo(
    () =>
      shuffle(
        exercise.options.map((_, i) => i),
        seed,
      ),
    [exercise, seed],
  );

  return (
    <>
      {order.map((authoredIndex) => {
        const option = exercise.options[authoredIndex];
        const isSelected = selected === authoredIndex;
        const isCorrect = option.correct === true;

        let state = 'idle';
        if (revealed && isCorrect) state = 'correct';
        else if (isSelected && !isCorrect) state = 'wrong';

        return (
          <button
            key={authoredIndex}
            type="button"
            className={`option option--${state}`}
            onClick={() => onSelect(authoredIndex)}
            disabled={revealed}
            aria-pressed={isSelected}
          >
            <RichText text={option.text} />
          </button>
        );
      })}
    </>
  );
}
