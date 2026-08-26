import { useMemo, useState } from 'react';
import { RichText } from '../components/RichText';
import { shuffle } from '../engine/shuffle';
import { isMatchingPair } from '../engine/grading';
import type { MatchExercise } from '../content/types';
import './match.css';

interface Props {
  exercise: MatchExercise;
  seed: number;
  revealed: boolean;
  onComplete: (matched: { left: string; right: string }[], missedAny: boolean) => void;
}

/**
 * Tap one from each column to pair them. Correct pairs lock green and leave
 * the board; a wrong pair shakes apart and is remembered as a miss, so the
 * exercise still counts as missed even though the user can carry on.
 */
export function MatchRenderer({ exercise, seed, revealed, onComplete }: Props) {
  const lefts = useMemo(
    () =>
      shuffle(
        exercise.pairs.map((p) => p.left),
        seed,
      ),
    [exercise, seed],
  );
  const rights = useMemo(
    () =>
      shuffle(
        exercise.pairs.map((p) => p.right),
        seed + 977,
      ),
    [exercise, seed],
  );

  const [matched, setMatched] = useState<{ left: string; right: string }[]>([]);
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);
  const [pickedRight, setPickedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [missed, setMissed] = useState(false);

  const isDone = (value: string, side: 'left' | 'right') => matched.some((m) => m[side] === value);

  const tryPair = (left: string | null, right: string | null) => {
    if (left === null || right === null) return;
    if (isMatchingPair(exercise, left, right)) {
      const next = [...matched, { left, right }];
      setMatched(next);
      setPickedLeft(null);
      setPickedRight(null);
      if (next.length === exercise.pairs.length) onComplete(next, missed);
    } else {
      setMissed(true);
      setWrongFlash(true);
      setTimeout(() => {
        setWrongFlash(false);
        setPickedLeft(null);
        setPickedRight(null);
      }, 300);
    }
  };

  const pick = (side: 'left' | 'right', value: string) => {
    if (revealed || wrongFlash) return;
    if (side === 'left') {
      setPickedLeft(value);
      tryPair(value, pickedRight);
    } else {
      setPickedRight(value);
      tryPair(pickedLeft, value);
    }
  };

  const cls = (value: string, side: 'left' | 'right', picked: string | null) =>
    [
      'match__cell',
      isDone(value, side) ? 'is-matched' : '',
      picked === value ? (wrongFlash ? 'is-wrong' : 'is-picked') : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="match">
      <div className="match__col">
        {lefts.map((left) => (
          <button
            key={left}
            type="button"
            className={cls(left, 'left', pickedLeft)}
            onClick={() => pick('left', left)}
            disabled={revealed || isDone(left, 'left')}
          >
            <RichText text={left} />
          </button>
        ))}
      </div>
      <div className="match__col">
        {rights.map((right) => (
          <button
            key={right}
            type="button"
            className={`${cls(right, 'right', pickedRight)} match__cell--term`}
            onClick={() => pick('right', right)}
            disabled={revealed || isDone(right, 'right')}
          >
            <RichText text={right} />
          </button>
        ))}
      </div>
    </div>
  );
}
