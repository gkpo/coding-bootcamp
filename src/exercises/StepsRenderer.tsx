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

/** Parsons for prose: drag the plan steps into the right order. */
export function StepsRenderer({ exercise, seed, revealed, wrongPositions, onCheck }: Props) {
  const [order, setOrder] = useState<string[]>(() =>
    shuffle(
      exercise.steps.map((_, i) => `s${i}`),
      seed,
    ),
  );
  const textOf = useMemo(
    () => new Map(exercise.steps.map((step, i) => [`s${i}`, step])),
    [exercise],
  );

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
      <SortableList
        items={items}
        onReorder={setOrder}
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
