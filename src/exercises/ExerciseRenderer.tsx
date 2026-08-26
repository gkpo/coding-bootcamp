import { useState } from 'react';
import { McqRenderer } from './McqRenderer';
import { ComplexityRenderer } from './ComplexityRenderer';
import { ParsonsRenderer } from './ParsonsRenderer';
import { StepsRenderer } from './StepsRenderer';
import { SpotBugRenderer } from './SpotBugRenderer';
import { BlankRenderer } from './BlankRenderer';
import { MatchRenderer } from './MatchRenderer';
import {
  gradeBlank,
  gradeComplexity,
  gradeMcq,
  gradeParsons,
  gradeSpotBug,
  gradeSteps,
} from '../engine/grading';
import type { Exercise } from '../content/types';
import type { Outcome } from './ExerciseFrame';

/**
 * Dispatches to the renderer for this exercise type and owns the per-type
 * attempt rules from docs/02.
 *
 * Outcome mapping follows docs/01: only a *first-attempt* correct answer is
 * 'right' (box +1). Solving after a retry still earns retry XP but counts as a
 * miss for spaced repetition, because that is what "correct first-try" means.
 */

/** Checks allowed before the answer is revealed, per docs/02. */
const MAX_CHECKS = 3;
const MAX_WRONG_TAPS = 2;

interface Props {
  exercise: Exercise;
  seed: number;
  revealed: boolean;
  onResolve: (outcome: Outcome, whyWrong?: string) => void;
}

export function ExerciseRenderer({ exercise, seed, revealed, onResolve }: Props) {
  const [checks, setChecks] = useState(0);
  const [wrongParts, setWrongParts] = useState<boolean[] | undefined>();
  const [wrongTaps, setWrongTaps] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | string | null>(null);

  const settle = (correct: boolean, attempt: number, whyWrong?: string) => {
    if (correct) onResolve(attempt === 1 ? 'right' : 'wrong');
    else onResolve('wrong', whyWrong);
  };

  /** Shared Check handler for the ordered types. */
  const handleCheck = (correct: boolean, parts: boolean[]) => {
    const attempt = checks + 1;
    setChecks(attempt);
    if (correct) {
      setWrongParts(parts.map(() => false));
      settle(true, attempt);
      return;
    }
    setWrongParts(parts.map((ok) => !ok));
    if (attempt >= MAX_CHECKS) settle(false, attempt);
  };

  switch (exercise.type) {
    case 'mcq':
    case 'ladder':
      return (
        <McqRenderer
          exercise={exercise}
          seed={seed}
          selected={typeof selected === 'number' ? selected : null}
          revealed={revealed}
          onSelect={(index) => {
            if (revealed) return;
            setSelected(index);
            const result = gradeMcq(exercise, index);
            onResolve(result.correct ? 'right' : 'wrong', result.whyWrong);
          }}
        />
      );

    case 'complexity':
      return (
        <ComplexityRenderer
          exercise={exercise}
          selected={typeof selected === 'string' ? selected : null}
          revealed={revealed}
          onSelect={(answer) => {
            if (revealed) return;
            setSelected(answer);
            onResolve(gradeComplexity(exercise, answer).correct ? 'right' : 'wrong');
          }}
        />
      );

    case 'parsons':
      return (
        <ParsonsRenderer
          exercise={exercise}
          seed={seed}
          revealed={revealed}
          wrongPositions={wrongParts}
          onCheck={(placed) => {
            const result = gradeParsons(exercise, placed);
            handleCheck(result.correct, result.parts);
          }}
        />
      );

    case 'steps':
      return (
        <StepsRenderer
          exercise={exercise}
          seed={seed}
          revealed={revealed}
          wrongPositions={wrongParts}
          onCheck={(placed) => {
            const result = gradeSteps(exercise, placed);
            handleCheck(result.correct, result.parts);
          }}
        />
      );

    case 'blank':
      return (
        <BlankRenderer
          exercise={exercise}
          seed={seed}
          revealed={revealed}
          wrongGaps={wrongParts}
          onCheck={(filled) => {
            const result = gradeBlank(exercise, filled);
            handleCheck(result.correct, result.parts);
          }}
        />
      );

    case 'spot-bug':
      return (
        <SpotBugRenderer
          exercise={exercise}
          revealed={revealed}
          wrongTaps={wrongTaps}
          onTapLine={(index) => {
            if (revealed || wrongTaps.includes(index)) return;
            const result = gradeSpotBug(exercise, index);
            if (result.correct) {
              onResolve(wrongTaps.length === 0 ? 'right' : 'wrong');
              return;
            }
            const taps = [...wrongTaps, index];
            setWrongTaps(taps);
            if (taps.length >= MAX_WRONG_TAPS) onResolve('wrong', result.whyWrong);
          }}
        />
      );

    case 'match':
      return (
        <MatchRenderer
          exercise={exercise}
          seed={seed}
          revealed={revealed}
          onComplete={(_, missedAny) => onResolve(missedAny ? 'wrong' : 'right')}
        />
      );
  }
}
