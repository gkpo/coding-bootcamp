import { PART_LANES, validateCapstone, type PartKind } from '../engine/archgraph';
import type { Capstone, ConceptCard, Exercise, Track } from './types';

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
  capstones?: Capstone[];
}

export function findContentProblems({
  tracks,
  exercises,
  cards,
  capstones = [],
}: ContentBundle): string[] {
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

  problems.push(...findCapstoneProblems(capstones, cards, tracks));

  return problems;
}

/**
 * Capstone rules (docs/12 part B). The graph half, solvability and the hint
 * moves matching the checks, is the engine's job; what is checked here is the
 * authoring around it.
 */
function findCapstoneProblems(
  capstones: Capstone[],
  cards: ConceptCard[],
  tracks: Track[],
): string[] {
  const problems: string[] = [];
  const cardIds = new Set(cards.map((c) => c.id));
  const trackIds = new Set(tracks.map((t) => t.id));
  const seenIds = new Set<string>();

  for (const capstone of capstones) {
    if (seenIds.has(capstone.id)) problems.push(`Duplicate capstone id "${capstone.id}"`);
    seenIds.add(capstone.id);

    if (!trackIds.has(capstone.trackId)) {
      problems.push(`${capstone.id} belongs to unknown track "${capstone.trackId}"`);
    }
    for (const conceptId of capstone.conceptIds) {
      if (!cardIds.has(conceptId)) {
        problems.push(`${capstone.id} links to unknown concept card "${conceptId}"`);
      }
    }
    if (capstone.conceptIds.length === 0) {
      problems.push(`${capstone.id} links to no concept cards`);
    }
    if (capstone.stages.length < 2 || capstone.stages.length > 3) {
      problems.push(`${capstone.id} has ${capstone.stages.length} stages, expected 2–3`);
    }

    const offered = new Set<PartKind>();
    const checkIds = new Set<string>();

    capstone.stages.forEach((stage, index) => {
      const where = `${capstone.id} stage ${index + 1}`;
      for (const kind of stage.prePlaced ?? []) offered.add(kind);
      for (const part of stage.tray) offered.add(part.kind);

      if (!stage.requirement.trim()) problems.push(`${where} has no requirement line`);
      if (!stage.clearLine.trim()) problems.push(`${where} has no clear line`);

      const ordinary = stage.checks.filter((c) => c.bonus !== true);
      const bonus = stage.checks.filter((c) => c.bonus === true);
      if (ordinary.length < 2 || ordinary.length > 4) {
        problems.push(`${where} has ${ordinary.length} ordinary checks, expected 2–4`);
      }
      if (bonus.length > 1) {
        problems.push(`${where} has ${bonus.length} bonus checks, expected at most 1`);
      }

      for (const check of stage.checks) {
        const at = `${where} check "${check.id}"`;
        if (checkIds.has(check.id))
          problems.push(`Duplicate check id "${check.id}" in ${capstone.id}`);
        checkIds.add(check.id);

        const words = check.label.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) problems.push(`${at} has no label`);
        if (words.length > 8)
          problems.push(`${at} has a ${words.length}-word label, expected 8 or fewer`);

        // A nudge that states the answer is not a nudge. Asking is the rule.
        if (!check.hintNudge.trim().endsWith('?')) {
          problems.push(`${at} has a level-1 hint that is not a question`);
        }
        if (!check.hintPoint.text.trim()) problems.push(`${at} has no level-2 hint text`);
        if (check.hintPoint.highlight.length === 0 && check.when.op !== 'maxParts') {
          problems.push(`${at} points at nothing on the board`);
        }
        for (const kind of check.hintPoint.highlight) {
          if (!offered.has(kind)) {
            problems.push(`${at} highlights ${kind}, which is in no tray by this stage`);
          }
        }
        if (check.sayIt !== undefined && !check.sayIt.trim()) {
          problems.push(`${at} has an empty sayIt, drop the field instead`);
        }
      }
    });

    for (const kind of offered) {
      // Not a graph rule, a board rule: a lane the renderer cannot draw.
      if (PART_LANES[kind] === undefined)
        problems.push(`${capstone.id} offers unknown part "${kind}"`);
    }

    problems.push(...validateCapstone(capstone));
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
