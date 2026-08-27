import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { shuffle } from '../engine/shuffle';
import type { BlankExercise } from '../content/types';
import './blank.css';

interface Props {
  exercise: BlankExercise;
  seed: number;
  revealed: boolean;
  wrongGaps?: boolean[];
  onCheck: (filled: (string | null)[]) => void;
}

/**
 * Tap a token to fill the next empty gap, or tap a gap first to aim at it.
 * Tapping a filled gap clears it. All gaps are graded together on Check, then
 * coloured individually (docs/02).
 */
export function BlankRenderer({ exercise, seed, revealed, wrongGaps, onCheck }: Props) {
  const gapCount = exercise.gaps.length;
  const [filled, setFilled] = useState<(string | null)[]>(() => Array(gapCount).fill(null));
  const [aimed, setAimed] = useState<number | null>(null);
  const bank = useMemo(() => shuffle(exercise.bank, seed), [exercise, seed]);

  const segments = exercise.template.split('____');
  const used = filled.filter((f): f is string => f !== null);

  const place = (token: string) => {
    if (revealed) return;
    const target = aimed ?? filled.findIndex((f) => f === null);
    if (target < 0) return;
    setFilled((prev) => prev.map((f, i) => (i === target ? token : f)));
    setAimed(null);
  };

  const clear = (index: number) => {
    if (revealed) return;
    if (filled[index] === null) {
      setAimed(aimed === index ? null : index);
      return;
    }
    setFilled((prev) => prev.map((f, i) => (i === index ? null : f)));
    setAimed(index);
  };

  return (
    <div className="blank">
      <pre className="blank__template">
        <code>
          {segments.map((segment, i) => (
            <span key={i}>
              {segment}
              {i < gapCount && (
                <button
                  type="button"
                  className={[
                    'blank__gap',
                    filled[i] ? 'is-filled' : '',
                    aimed === i ? 'is-aimed' : '',
                    wrongGaps ? (wrongGaps[i] ? 'is-wrong' : 'is-right') : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => clear(i)}
                  disabled={revealed}
                >
                  {filled[i] ?? '____'}
                </button>
              )}
            </span>
          ))}
        </code>
      </pre>

      {!revealed && (
        <>
          <div className="blank__bank">
            {bank.map((token) => (
              <button
                key={token}
                type="button"
                className="blank__token"
                onClick={() => place(token)}
                disabled={used.includes(token) && !exercise.gaps.includes(token)}
              >
                {token}
              </button>
            ))}
          </div>
          <Button
            quiet
            variant="secondary"
            disabled={filled.some((f) => f === null)}
            onClick={() => onCheck(filled)}
          >
            Check
          </Button>
        </>
      )}
    </div>
  );
}
