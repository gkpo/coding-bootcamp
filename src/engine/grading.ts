/**
 * Answer checking. Returns *structured* results rather than a bare boolean so
 * the UI can highlight exactly which part was wrong and show the misconception
 * feedback authored against that specific option.
 *
 * M1 covers `mcq`, `ladder` and `complexity`; the remaining renderers and their
 * grading land with M3 (docs/07-ROADMAP.md).
 */

import type { ComplexityExercise, McqExercise } from '../content/types';
import { STANDARD_COMPLEXITY_OPTIONS } from '../content/types';

export interface GradeResult {
  correct: boolean;
  /** Authored feedback for the specific wrong answer given, when there is any. */
  whyWrong?: string;
}

export function correctOptionIndex(exercise: McqExercise): number {
  return exercise.options.findIndex((o) => o.correct === true);
}

export function gradeMcq(exercise: McqExercise, selectedIndex: number): GradeResult {
  const option = exercise.options[selectedIndex];
  if (option === undefined) {
    throw new RangeError(
      `Option ${selectedIndex} is out of range for ${exercise.id} (${exercise.options.length} options)`,
    );
  }
  return option.correct === true
    ? { correct: true }
    : { correct: false, whyWrong: option.whyWrong };
}

/** The option set a complexity exercise should render, in growth order. */
export function complexityOptions(exercise: ComplexityExercise) {
  return exercise.optionSet ?? STANDARD_COMPLEXITY_OPTIONS;
}

export function gradeComplexity(exercise: ComplexityExercise, answer: string): GradeResult {
  return { correct: answer === exercise.answer };
}
