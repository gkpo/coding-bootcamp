import {
  PART_KINDS,
  type Build,
  type CapstoneSpec,
  type PartKind,
  type StageSpec,
} from '../engine/archgraph';

/**
 * What is left in the tray (docs/12 part C).
 *
 * The tray is bounded on purpose: a finite parts list is one of the three
 * fences that keep the solution space small enough to grade. So the counts are
 * state, not a view of the stage data, and placing, returning and clearing a
 * stage all move them.
 */
export type TrayCounts = Partial<Record<PartKind, number>>;

export function addStage(counts: TrayCounts, stage: StageSpec): TrayCounts {
  const next = { ...counts };
  for (const part of stage.tray) next[part.kind] = (next[part.kind] ?? 0) + part.count;
  return next;
}

export function take(counts: TrayCounts, kind: PartKind): TrayCounts {
  return withCount(counts, kind, (counts[kind] ?? 0) - 1);
}

/** A part coming back off the board, pre-placed ones included. */
export function give(counts: TrayCounts, kind: PartKind): TrayCounts {
  return { ...counts, [kind]: (counts[kind] ?? 0) + 1 };
}

export function isEmpty(counts: TrayCounts): boolean {
  return Object.values(counts).every((n) => (n ?? 0) === 0);
}

/**
 * The tray a resumed run opens with: every stage's parts up to here, minus the
 * ones already standing on the board.
 *
 * Cleared stages persist but the board they were built on does not (docs/12
 * part B stores only the stage count), so a resumed run is handed the worked
 * solution's board and has to be handed a tray that agrees with it.
 */
export function trayFor(capstone: CapstoneSpec, stageIndex: number, build: Build): TrayCounts {
  let counts: TrayCounts = {};
  for (const stage of capstone.stages.slice(0, stageIndex + 1)) counts = addStage(counts, stage);

  const onBoard = new Map<PartKind, number>();
  for (const part of build.parts) onBoard.set(part.kind, (onBoard.get(part.kind) ?? 0) + 1);
  // Pre-placed parts were never in the tray, so they do not come out of it.
  for (const kind of capstone.stages[0]?.prePlaced ?? []) {
    onBoard.set(kind, Math.max(0, (onBoard.get(kind) ?? 0) - 1));
  }
  for (const [kind, placed] of onBoard) {
    counts = withCount(counts, kind, (counts[kind] ?? 0) - placed);
  }
  return counts;
}

/** A count of zero is not a tray entry: the chip is gone, not empty. */
function withCount(counts: TrayCounts, kind: PartKind, n: number): TrayCounts {
  const next = { ...counts };
  if (n > 0) next[kind] = n;
  else delete next[kind];
  return next;
}

/** Tray kinds still available, in the order the board's lanes run. */
export function availableKinds(counts: TrayCounts): PartKind[] {
  return PART_KINDS.filter((kind) => (counts[kind] ?? 0) > 0);
}
