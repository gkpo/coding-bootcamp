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
 * Tap to select and it grades immediately: no confirm step, because fewer
 * taps matters more than undo on a phone (docs/02). Nothing is coloured until
 * the user commits.
 *
 * Each option carries a radio marker and the list carries a "Pick one" label,
 * so the answer area reads as a set of choices rather than as a list of
 * statements. Without them a stack of full-width sentences gives the eye no
 * clue that it is meant to be tapped, and a tap that lands looks the same as
 * one that did not.
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
      <p className="options__label">Pick one</p>
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
            <span className="option__marker" aria-hidden />
            <span className="option__text">
              <RichText text={option.text} />
            </span>
          </button>
        );
      })}
    </>
  );
}
