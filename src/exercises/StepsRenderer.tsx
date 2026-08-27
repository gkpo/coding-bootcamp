import { useMemo, useState } from 'react';
import { SortableList, type SortableItem } from '../components/SortableList';
import { RichText } from '../components/RichText';
import { Button } from '../components/Button';
import { shuffle } from '../engine/shuffle';
import type { StepsExercise } from '../content/types';
import './parsons.css';

interface Props {
  exercise: StepsExercise;
  seed: number;
  revealed: boolean;
  wrongPositions?: boolean[];
  onCheck: (placed: string[]) => void;
}

/**
 * Parsons for prose: drag the plan steps into the right order.
 *
 * Tapping two rows swaps them, the same fallback docs/02 requires of parsons
 * and for the same reasons: dragging is the hard gesture to discover and the
 * hard one to perform. Without it a tap on a row did nothing whatsoever, which
 * is indistinguishable from a screen that has stopped responding.
 */
export function StepsRenderer({ exercise, seed, revealed, wrongPositions, onCheck }: Props) {
  const [order, setOrder] = useState<string[]>(() =>
    shuffle(
      exercise.steps.map((_, i) => `s${i}`),
      seed,
    ),
  );
  const [picked, setPicked] = useState<string | null>(null);
  const textOf = useMemo(
    () => new Map(exercise.steps.map((step, i) => [`s${i}`, step])),
    [exercise],
  );

  /** First tap lifts a row, second drops it on the row it lands on. */
  const tap = (id: string) => {
    if (revealed) return;
    if (picked === null || picked === id) {
      setPicked(picked === id ? null : id);
      return;
    }
    setOrder((prev) => {
      const from = prev.indexOf(picked);
      const to = prev.indexOf(id);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next[from] = id;
      next[to] = picked;
      return next;
    });
    setPicked(null);
  };

  const items: SortableItem[] = order.map((id) => ({
    id,
    content: (
      <span className="steps__text">
        <RichText text={textOf.get(id) ?? ''} />
      </span>
    ),
  }));

  return (
    <div className="parsons">
      {!revealed && <p className="parsons__label">Drag a row, or tap two to swap them</p>}
      <SortableList
        items={items}
        onReorder={(ids) => {
          setPicked(null);
          setOrder(ids);
        }}
        onTap={tap}
        pickedId={picked}
        disabled={revealed}
        stateOf={(_, index) =>
          wrongPositions ? (wrongPositions[index] ? 'wrong' : 'correct') : 'idle'
        }
      />
      {!revealed && (
        <Button
          quiet
          variant="secondary"
          onClick={() => onCheck(order.map((id) => textOf.get(id) ?? ''))}
        >
          Check
        </Button>
      )}
    </div>
  );
}
