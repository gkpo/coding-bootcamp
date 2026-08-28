import type { ExerciseType } from '../content/types';

/**
 * The interview muscle each mechanic trains, shown as a kicker above the
 * question.
 *
 * It names the skill being exercised, never the concept being tested: the
 * concept's name is often the answer, so a kicker reading "Sliding window"
 * would hand it over before the user has had a go (same rule as the concept
 * chip, see ExerciseFrame.tsx). Keyed off `type` alone for that reason.
 *
 * `Record` over the union rather than a lookup with a fallback: a ninth
 * mechanic then fails the build until it gets a label.
 */
export const muscleLabels: Record<ExerciseType, string> = {
  mcq: 'Read and judge',
  complexity: 'Name the growth',
  parsons: 'Build the solution',
  'spot-bug': 'Spot the bug',
  blank: 'Fill the blank',
  ladder: 'Pick the next move',
  match: 'Pair the riddle',
  steps: 'Order the plan',
};
