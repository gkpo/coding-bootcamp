import type { ConceptCard, Exercise, Track } from './types';

/**
 * Runtime checks the type system cannot express: cross-references resolving,
 * ids being unique, per-type invariants holding.
 *
 * Content bugs must be loud (docs/04). A typo'd conceptId would otherwise show
 * up as a concept chip that opens nothing. A silent hole in the learning path.
 */

export interface ContentBundle {
  tracks: Track[];
  exercises: Exercise[];
  cards: ConceptCard[];
}

export function findContentProblems({ tracks, exercises, cards }: ContentBundle): string[] {
  const problems: string[] = [];
  const cardIds = new Set(cards.map((c) => c.id));
  const exerciseIds = new Set<string>();

  for (const exercise of exercises) {
    if (exerciseIds.has(exercise.id)) {
      problems.push(`Duplicate exercise id "${exercise.id}"`);
    }
    exerciseIds.add(exercise.id);

    if (!cardIds.has(exercise.conceptId)) {
      problems.push(`${exercise.id} links to unknown concept card "${exercise.conceptId}"`);
    }
    if (!exercise.explanation.trim()) {
      problems.push(`${exercise.id} has an empty explanation`);
    }
    if (exercise.promptVariants !== undefined) {
      if (exercise.promptVariants.length === 0) {
        problems.push(`${exercise.id} has an empty promptVariants list, drop the field instead`);
      }
      for (const variant of exercise.promptVariants) {
        if (typeof variant !== 'string' || !variant.trim()) {
          problems.push(`${exercise.id} has a blank prompt variant`);
        }
      }
    }

    switch (exercise.type) {
      case 'mcq':
      case 'ladder': {
        const correct = exercise.options.filter((o) => o.correct === true);
        if (correct.length !== 1) {
          problems.push(`${exercise.id} has ${correct.length} correct options, expected exactly 1`);
        }
        if (exercise.options.length < 2 || exercise.options.length > 4) {
          problems.push(`${exercise.id} has ${exercise.options.length} options, expected 2–4`);
        }
        for (const option of exercise.options) {
          if (option.correct !== true && !option.whyWrong?.trim()) {
            problems.push(`${exercise.id} wrong option "${option.text}" has no whyWrong`);
          }
        }
        break;
      }
      case 'complexity': {
        if (!exercise.sayIt.trim()) {
          problems.push(`${exercise.id} is missing the mandatory sayIt phrase`);
        }
        const options = exercise.optionSet;
        if (options && !options.includes(exercise.answer)) {
          problems.push(`${exercise.id} answer "${exercise.answer}" is not in its optionSet`);
        }
        break;
      }
      case 'spot-bug': {
        const lineCount = exercise.code.source.split('\n').length;
        if (exercise.buggyLineIndex < 0 || exercise.buggyLineIndex >= lineCount) {
          problems.push(
            `${exercise.id} buggyLineIndex ${exercise.buggyLineIndex} is outside its ${lineCount}-line snippet`,
          );
        }
        for (const key of Object.keys(exercise.lineHints ?? {})) {
          const index = Number(key);
          if (index === exercise.buggyLineIndex) {
            problems.push(`${exercise.id} has a lineHint on the buggy line itself`);
          }
          if (index < 0 || index >= lineCount) {
            problems.push(`${exercise.id} has a lineHint for out-of-range line ${index}`);
          }
        }
        break;
      }
      case 'parsons': {
        const solution = exercise.lines.filter((l) => l.distractor !== true);
        if (solution.length < 3) {
          problems.push(`${exercise.id} has only ${solution.length} non-distractor lines`);
        }
        break;
      }
      case 'blank': {
        const gapCount = exercise.template.split('____').length - 1;
        if (gapCount !== exercise.gaps.length) {
          problems.push(
            `${exercise.id} template has ${gapCount} gaps but ${exercise.gaps.length} answers`,
          );
        }
        for (const gap of exercise.gaps) {
          if (!exercise.bank.includes(gap)) {
            problems.push(`${exercise.id} answer "${gap}" is missing from its word bank`);
          }
        }
        break;
      }
      case 'match': {
        if (exercise.pairs.length < 3 || exercise.pairs.length > 5) {
          problems.push(`${exercise.id} has ${exercise.pairs.length} pairs, expected 3–5`);
        }
        break;
      }
      case 'steps': {
        if (exercise.steps.length < 4 || exercise.steps.length > 6) {
          problems.push(`${exercise.id} has ${exercise.steps.length} steps, expected 4–6`);
        }
        break;
      }
    }
  }

  const seenCardIds = new Set<string>();
  for (const card of cards) {
    if (seenCardIds.has(card.id)) problems.push(`Duplicate concept card id "${card.id}"`);
    seenCardIds.add(card.id);

    for (const relatedId of card.related) {
      if (!cardIds.has(relatedId)) {
        problems.push(`Card "${card.id}" relates to unknown card "${relatedId}"`);
      }
      if (relatedId === card.id) {
        problems.push(`Card "${card.id}" lists itself as related`);
      }
    }
    if (card.sayThis.length === 0) {
      problems.push(`Card "${card.id}" has no sayThis lines`);
    }
  }

  // Lessons are the browsing path through a track: every exercise must appear
  // in exactly one, or it becomes unreachable outside the daily session.
  for (const track of tracks) {
    const listed = track.lessons.flatMap((l) => l.exerciseIds);
    const trackExercises = exercises.filter((e) => e.trackId === track.id);

    for (const id of listed) {
      if (!exerciseIds.has(id)) {
        problems.push(`Track ${track.id} lesson references unknown exercise "${id}"`);
      }
    }
    if (new Set(listed).size !== listed.length) {
      problems.push(`Track ${track.id} lists the same exercise in more than one lesson`);
    }
    for (const exercise of trackExercises) {
      if (!listed.includes(exercise.id)) {
        problems.push(`${exercise.id} belongs to ${track.id} but is in no lesson`);
      }
    }
    for (const lesson of track.lessons) {
      if (lesson.exerciseIds.length < 3 || lesson.exerciseIds.length > 5) {
        problems.push(
          `Lesson ${lesson.id} has ${lesson.exerciseIds.length} exercises, expected 3–5`,
        );
      }
    }
  }

  return problems;
}

export function assertContentValid(bundle: ContentBundle): void {
  const problems = findContentProblems(bundle);
  if (problems.length > 0) {
    throw new Error(
      `Content validation failed with ${problems.length} problem(s):\n` +
        problems.map((p) => `  • ${p}`).join('\n'),
    );
  }
}
