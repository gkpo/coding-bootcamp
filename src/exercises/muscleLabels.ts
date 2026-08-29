import type { Exercise, ExerciseType } from '../content/types';

/**
 * The interview muscle each mechanic trains, shown as a kicker above the
 * question.
 *
 * It names the skill being exercised, never the concept being tested: the
 * concept's name is often the answer, so a kicker reading "Sliding window"
 * would hand it over before the user has had a go (same rule as the concept
 * chip, see ExerciseFrame.tsx). Keyed off the mechanic and never the concept
 * for that reason; `muscleLabelFor` below adds the one exception, which reads
 * the exercise's code rather than its concept and so leaks nothing either.
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

/**
 * `mcq` is the one mechanic that runs both with and without a snippet, and most
 * of them have nothing to read: they ask for a judgement, a trade-off, or what
 * an interviewer is really after. "Read and judge" over an empty screen sends
 * the user hunting for code that was never there, so the label follows the
 * code rather than the type alone.
 *
 * The other seven are safe on `type`: their labels describe what the user does
 * with the material in front of them, whether or not that material is code.
 */
const MCQ_WITHOUT_CODE = 'Weigh the options';

/** The kicker to show above one exercise. */
export function muscleLabelFor(exercise: Exercise): string {
  if (exercise.type === 'mcq' && exercise.code === undefined) return MCQ_WITHOUT_CODE;
  return muscleLabels[exercise.type];
}
