import type { Move, PartKind } from '../engine/archgraph';
import { PART_NAME } from './parts';

/**
 * A check's level-3 hint: its moves, said in words (docs/12 part C).
 *
 * The board never plays the moves for the user. Telling them what to do and
 * leaving them to do it is the last hint level, not a solve button, so this
 * turns the authored move list into a sentence and stops there.
 *
 * Returns an empty string for a check with no moves; the caller falls back to
 * the level-2 text, which is what a budget check has to say anyway.
 */
export function hintWords(moves: Move[]): string {
  const places: PartKind[] = [];
  const connects: [PartKind, PartKind][] = [];
  const disconnects: [PartKind, PartKind][] = [];
  const removes: PartKind[] = [];

  for (const move of moves) {
    if ('place' in move) places.push(move.place);
    else if ('connect' in move) connects.push(move.connect);
    else if ('disconnect' in move) disconnects.push(move.disconnect);
    else removes.push(move.remove);
  }

  const clauses: string[] = [];
  if (places.length > 0) {
    clauses.push(`place ${list(places.map(named))}`);
  }
  if (connects.length > 0) {
    const pairs = connects.map(([a, b]) => `the ${PART_NAME[a]} to the ${PART_NAME[b]}`);
    clauses.push(`connect ${list(pairs)}`);
  }
  for (const [a, b] of disconnects) {
    clauses.push(`take away the line between the ${PART_NAME[a]} and the ${PART_NAME[b]}`);
  }
  if (removes.length > 0) {
    clauses.push(`take ${list(removes.map(named))} off the board`);
  }
  if (clauses.length === 0) return '';

  const sentence = clauses.join(', then ');
  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`;
}

function named(kind: PartKind): string {
  return `the ${PART_NAME[kind]}`;
}

/** "a", "a and b", "a, b and c". */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
