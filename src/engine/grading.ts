/**
 * Answer checking. Returns *structured* results rather than a bare boolean so
 * the UI can highlight exactly which part was wrong and show the misconception
 * feedback authored against that specific option.
 */

import type {
  ExerciseType,
  BlankExercise,
  ComplexityExercise,
  MatchExercise,
  McqExercise,
  ParsonsExercise,
  SpotBugExercise,
  StepsExercise,
} from '../content/types';
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

// ---------------------------------------------------------------------------
// M3 types
// ---------------------------------------------------------------------------

export interface PartsGradeResult extends GradeResult {
  /** Index-aligned with the submitted answer: true where that part is right. */
  parts: boolean[];
}

/** The canonical solution: authored order, distractors removed. */
export function parsonsSolution(exercise: ParsonsExercise): string[] {
  return exercise.lines.filter((l) => l.distractor !== true).map((l) => l.code);
}

/**
 * Order must match exactly. Distractors are never part of a correct answer, so
 * including one is wrong at that position rather than silently ignored.
 */
export function gradeParsons(exercise: ParsonsExercise, placed: string[]): PartsGradeResult {
  const solution = parsonsSolution(exercise);
  const parts = placed.map((code, i) => solution[i] === code);
  return { correct: placed.length === solution.length && parts.every(Boolean), parts };
}

export function gradeSteps(exercise: StepsExercise, placed: string[]): PartsGradeResult {
  const parts = placed.map((step, i) => exercise.steps[i] === step);
  return { correct: placed.length === exercise.steps.length && parts.every(Boolean), parts };
}

export function gradeSpotBug(exercise: SpotBugExercise, lineIndex: number): GradeResult {
  if (lineIndex === exercise.buggyLineIndex) return { correct: true };
  return { correct: false, whyWrong: exercise.lineHints?.[lineIndex] };
}

/** Per-gap grading so the UI can colour each gap individually. */
export function gradeBlank(exercise: BlankExercise, filled: (string | null)[]): PartsGradeResult {
  const parts = exercise.gaps.map((answer, i) => filled[i] === answer);
  return { correct: parts.every(Boolean), parts };
}

export function blankGapCount(exercise: BlankExercise): number {
  return exercise.gaps.length;
}

/** One tapped pair. Matching is by exact authored text. */
export function isMatchingPair(exercise: MatchExercise, left: string, right: string): boolean {
  return exercise.pairs.some((p) => p.left === left && p.right === right);
}

export function gradeMatch(
  exercise: MatchExercise,
  matched: { left: string; right: string }[],
): GradeResult {
  const allFound =
    matched.length === exercise.pairs.length &&
    exercise.pairs.every((p) => matched.some((m) => m.left === p.left && m.right === p.right));
  return { correct: allFound };
}

/**
 * Types whose correct answer cannot be shown in place on reveal.
 *
 * mcq and complexity highlight the winning option, spot-bug highlights the
 * line, and match cannot complete while a pair is missing — the ordered types
 * have nowhere to put the answer, so the feedback panel shows it instead.
 */
export function needsExplicitReveal(type: ExerciseType): boolean {
  return type === 'parsons' || type === 'steps' || type === 'blank';
}
