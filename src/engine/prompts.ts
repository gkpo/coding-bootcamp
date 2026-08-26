/**
 * Prompt variants: docs/10 part B.
 *
 * Some exercises are the same question wearing a different sentence. A
 * statement-to-pattern item asked twice a week teaches its wording as much as
 * its pattern, so those exercises carry alternate phrasings and the renderer
 * picks one per presentation. Same answer, same options, same code: only the
 * sentence moves.
 *
 * Deterministic on the presentation seed, so a re-render mid-question does not
 * swap the wording under the user's eyes.
 *
 * This module must stay free of React and DOM imports (docs/05 §engine purity).
 */

import { makeRng } from './shuffle';

export interface Promptable {
  prompt: string;
  promptVariants?: string[];
}

/** Every phrasing this exercise may show, authored prompt first. */
export function promptChoices(exercise: Promptable): string[] {
  return [exercise.prompt, ...(exercise.promptVariants ?? [])];
}

/** The phrasing to show for one presentation. */
export function promptFor(exercise: Promptable, seed: number): string {
  const choices = promptChoices(exercise);
  if (choices.length === 1) return choices[0];
  return choices[Math.floor(makeRng(seed)() * choices.length)];
}
