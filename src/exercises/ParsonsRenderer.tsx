import { useCallback, useMemo, useState } from 'react';
import { DragGroup, SortableZone, type SortableItem } from '../components/SortableList';
import { shuffle } from '../engine/shuffle';
import { Button } from '../components/Button';
import type { ParsonsExercise } from '../content/types';
import './parsons.css';

const noop = () => {};

interface Props {
  exercise: ParsonsExercise;
  seed: number;
  revealed: boolean;
  /** Positions marked wrong by the grader, after a Check. */
  wrongPositions?: boolean[];
  onCheck: (placed: string[]) => void;
}

/**
 * Drag lines into order, or tap to move them between the bank and the
 * solution. Indentation is pre-rendered on each pill, v1 never makes the
 * user choose it (docs/02).
 */
export function ParsonsRenderer({ exercise, seed, revealed, wrongPositions, onCheck }: Props) {
  const pool = useMemo(() => {
    // Index-based ids keep duplicate code lines distinguishable.
    const all = exercise.lines.map((line, i) => ({ ...line, id: `l${i}` }));
    return shuffle(all, seed);
  }, [exercise, seed]);

  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const byId = useMemo(() => new Map(pool.map((l) => [l.id, l])), [pool]);

  const bank = pool.filter((l) => !placedIds.includes(l.id));
  const placed = placedIds.map((id) => byId.get(id)!).filter(Boolean);

  const toItem = (line: { id: string; code: string; indent: number }): SortableItem => ({
    id: line.id,
    content: <span className="parsons__code">{line.code}</span>,
    indent: line.indent,
  });

  // A drop in the solution lands at the index the pointer picked; a drop back
  // in the bank just leaves the solution, since the bank is an unordered pile.
  const onMove = useCallback(
    (id: string, _from: string, to: string, index: number) => {
      setPlacedIds((ids) => {
        const next = ids.filter((x) => x !== id);
        if (to === 'solution') next.splice(index, 0, id);
        return next;
      });
    },
    [],
  );

  return (
    <div className="parsons">
      <DragGroup onMove={revealed ? noop : onMove}>
        <div className="parsons__area">
          <p className="parsons__label">Your solution</p>
          <SortableZone
            zone="solution"
            items={placed.map(toItem)}
            onTap={(id) => !revealed && setPlacedIds((ids) => ids.filter((x) => x !== id))}
            disabled={revealed}
            emptyLabel="Drag a line up here, or tap it to add it."
            stateOf={(_, index) =>
              wrongPositions ? (wrongPositions[index] ? 'wrong' : 'correct') : 'idle'
            }
          />
        </div>

        {bank.length > 0 && (
          <div className="parsons__area">
            <p className="parsons__label">Available lines</p>
            <SortableZone
              zone="bank"
              items={bank.map(toItem)}
              onTap={(id) => !revealed && setPlacedIds((ids) => [...ids, id])}
              disabled={revealed}
            />
          </div>
        )}
      </DragGroup>

      {!revealed && (
        <Button
          variant="secondary"
          disabled={placed.length === 0}
          onClick={() => onCheck(placed.map((l) => l.code))}
        >
          Check
        </Button>
      )}
    </div>
  );
}
