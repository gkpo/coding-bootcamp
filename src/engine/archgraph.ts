/**
 * Build mode: the architecture graph and its grading rules (docs/12 part A).
 *
 * Pure data and predicates: no React, no DOM, no pixels. The board renderer
 * owns geometry, this module owns what counts as correct.
 *
 * Grading runs checks against the graph the user built rather than diffing
 * against one blessed diagram, so two builds that look different and satisfy
 * the same checks are both right. That is also true in the interview.
 */

export type PartKind =
  | 'client'
  | 'cdn'
  | 'lb'
  | 'server'
  | 'queue'
  | 'worker'
  | 'cache'
  | 'db'
  | 'replica'
  | 'blob'
  | 'ext-api';

export type LaneId = 'edge' | 'entry' | 'compute' | 'async' | 'data';

/** Where each kind of part is allowed to sit. A part has exactly one lane. */
export const PART_LANES: Record<PartKind, LaneId> = {
  client: 'edge',
  cdn: 'edge',
  lb: 'entry',
  server: 'compute',
  queue: 'async',
  worker: 'async',
  cache: 'data',
  db: 'data',
  replica: 'data',
  blob: 'data',
  'ext-api': 'data',
};

export const PART_KINDS = Object.keys(PART_LANES) as PartKind[];

/** Top to bottom on the board. */
export const LANE_IDS: LaneId[] = ['edge', 'entry', 'compute', 'async', 'data'];

/** Parts per lane. Chosen so a lane never has to scroll on a 390px screen. */
export const LANE_CAPACITY = 3;

export interface Part {
  /**
   * Unique within the build. An id freed by a removal may be handed out
   * again, which is safe because removing a part takes its edges with it.
   */
  id: number;
  kind: PartKind;
}

export interface Build {
  parts: Part[];
  /** Undirected, by part id, stored low id first so a pair has one spelling. */
  edges: [number, number][];
}

export function emptyBuild(): Build {
  return { parts: [], edges: [] };
}

export function partsInLane(build: Build, lane: LaneId): Part[] {
  return build.parts.filter((p) => PART_LANES[p.kind] === lane);
}

export function countOfKind(build: Build, kind: PartKind): number {
  return build.parts.filter((p) => p.kind === kind).length;
}

export function canPlace(build: Build, kind: PartKind): boolean {
  return partsInLane(build, PART_LANES[kind]).length < LANE_CAPACITY;
}

/** The new build, or null when the part's lane is full. */
export function place(build: Build, kind: PartKind): Build | null {
  if (!canPlace(build, kind)) return null;
  const id = build.parts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  return { parts: [...build.parts, { id, kind }], edges: build.edges };
}

export function removePart(build: Build, id: number): Build {
  return {
    parts: build.parts.filter((p) => p.id !== id),
    edges: build.edges.filter(([a, b]) => a !== id && b !== id),
  };
}

function pair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export function hasEdge(build: Build, a: number, b: number): boolean {
  return build.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * Connect two placed parts, or disconnect them if they already are. One
 * gesture both ways: tapping the same two chips again is how an edge goes.
 */
export function toggleEdge(build: Build, a: number, b: number): Build {
  if (a === b) return build;
  const ids = new Set(build.parts.map((p) => p.id));
  if (!ids.has(a) || !ids.has(b)) return build;
  if (hasEdge(build, a, b)) {
    return {
      parts: build.parts,
      edges: build.edges.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a))),
    };
  }
  return { parts: build.parts, edges: [...build.edges, pair(a, b)] };
}

/**
 * The route the flow dot walks for one check (docs/12 part D).
 *
 * Kinds rather than parts: the dot is a cursor over the story the check
 * tells, and the renderer decides which instance of a kind it lands on. An
 * empty route is a check with nothing to walk, which is most of the counting
 * ones; those resolve their ring where they stand.
 */
export interface Trace {
  route: PartKind[];
  /** On a failure, the part where the story breaks. Null when nothing is there. */
  stopsAt: PartKind | null;
}

/** Breadth-first, so a route is the shortest one and reads as the obvious one. */
function shortestRoute(
  graph: KindGraph,
  from: PartKind,
  to: PartKind,
  without?: PartKind,
): PartKind[] | null {
  if (from === without || to === without) return null;
  if (!isPlaced(graph, from) || !isPlaced(graph, to)) return null;
  if (from === to) return [from];

  const cameFrom = new Map<PartKind, PartKind>();
  const seen = new Set<PartKind>([from]);
  const queue: PartKind[] = [from];
  while (queue.length > 0) {
    const current = queue.shift() as PartKind;
    for (const next of graph.neighbours.get(current) ?? []) {
      if (next === without || seen.has(next)) continue;
      seen.add(next);
      cameFrom.set(next, current);
      if (next === to) {
        const route = [to];
        let step = to;
        while (step !== from) {
          step = cameFrom.get(step) as PartKind;
          route.unshift(step);
        }
        return route;
      }
      queue.push(next);
    }
  }
  return null;
}

/**
 * What the dot does for this check, on this build.
 *
 * On a pass it walks the thing the check is asserting. On a failure it walks
 * as much of the story as exists and stops where it breaks, which for a
 * pathVia beaten by a bypass means walking the bypass: that route is the
 * mistake, so showing it is the whole explanation.
 */
export function trace(build: Build, predicate: Predicate): Trace {
  const graph = kindGraph(build);
  const here = (kind: PartKind): PartKind | null => (isPlaced(graph, kind) ? kind : null);
  const stall = (kind: PartKind): Trace => {
    const at = here(kind);
    return { route: at ? [at] : [], stopsAt: at };
  };

  switch (predicate.op) {
    case 'placed':
    case 'maxParts':
      return { route: [], stopsAt: null };
    case 'notPlaced':
      // Only interesting when it fails, and then the offending part is there.
      return { route: [], stopsAt: here(predicate.kind) };
    case 'edge':
      if (directlyJoined(graph, predicate.a, predicate.b)) {
        return { route: [predicate.a, predicate.b], stopsAt: null };
      }
      return stall(predicate.a).stopsAt === null ? stall(predicate.b) : stall(predicate.a);
    case 'noEdge':
      if (!directlyJoined(graph, predicate.a, predicate.b)) return { route: [], stopsAt: null };
      // The edge that should not be there is exactly what to walk.
      return { route: [predicate.a, predicate.b], stopsAt: predicate.b };
    case 'eachConnected': {
      const { each, to } = predicate;
      const wired =
        isPlaced(graph, each) &&
        isPlaced(graph, to) &&
        unwiredInstances(build, each, to).length === 0;
      if (wired) return { route: [each, to], stopsAt: null };
      // The failure sits on one of the clones, so the dot stops on that side
      // and the board picks the instance that is missing its connection.
      return stall(each).stopsAt === null ? stall(to) : stall(each);
    }
    case 'path': {
      const route = shortestRoute(graph, predicate.from, predicate.to);
      if (route) return { route, stopsAt: null };
      return stall(predicate.from).stopsAt === null ? stall(predicate.to) : stall(predicate.from);
    }
    case 'pathVia': {
      const { from, to, via } = predicate;
      if (via !== from && via !== to && isPlaced(graph, via)) {
        const bypass = shortestRoute(graph, from, to, via);
        // A bypass is the failure, so walk it and stop on the far end.
        if (bypass) return { route: bypass, stopsAt: bypass[bypass.length - 1] };
        const route = shortestRoute(graph, from, to);
        if (route) return { route, stopsAt: null };
      }
      return stall(from).stopsAt === null ? stall(to) : stall(from);
    }
  }
}

/** Whether any instance of one kind is wired to any instance of another. */
export function hasKindEdge(build: Build, a: PartKind, b: PartKind): boolean {
  return directlyJoined(kindGraph(build), a, b);
}

/**
 * The instances of one kind with no direct connection to any instance of
 * another, by part id and in placement order.
 *
 * The one place grading looks past the kind graph (docs/12 part F1). Clones
 * are meant to be interchangeable, so a fleet where one server can reach the
 * cache and the next one cannot is a real design flaw, and collapsing the two
 * into a single node is exactly what hides it.
 */
export function unwiredInstances(build: Build, each: PartKind, to: PartKind): number[] {
  const targets = build.parts.filter((p) => p.kind === to).map((p) => p.id);
  return build.parts
    .filter((p) => p.kind === each && !targets.some((id) => hasEdge(build, p.id, id)))
    .map((p) => p.id);
}

/**
 * The kind graph: every instance of a kind collapses to one node, and two
 * kinds are joined when any pair of their instances is.
 *
 * Predicates read this rather than the raw build, which is what makes "two
 * servers behind one load balancer" behave the way an author expects without
 * anyone having to write quantifiers into a check.
 */
export interface KindGraph {
  counts: Map<PartKind, number>;
  neighbours: Map<PartKind, Set<PartKind>>;
}

export function kindGraph(build: Build): KindGraph {
  const counts = new Map<PartKind, number>();
  const neighbours = new Map<PartKind, Set<PartKind>>();
  const kindOf = new Map<number, PartKind>();

  for (const part of build.parts) {
    counts.set(part.kind, (counts.get(part.kind) ?? 0) + 1);
    kindOf.set(part.id, part.kind);
    if (!neighbours.has(part.kind)) neighbours.set(part.kind, new Set());
  }
  for (const [a, b] of build.edges) {
    const ka = kindOf.get(a);
    const kb = kindOf.get(b);
    if (ka === undefined || kb === undefined || ka === kb) continue;
    neighbours.get(ka)?.add(kb);
    neighbours.get(kb)?.add(ka);
  }
  return { counts, neighbours };
}

function isPlaced(graph: KindGraph, kind: PartKind): boolean {
  return (graph.counts.get(kind) ?? 0) > 0;
}

/** Breadth-first reachability in the kind graph, optionally cutting one node. */
function reaches(graph: KindGraph, from: PartKind, to: PartKind, without?: PartKind): boolean {
  if (from === without || to === without) return false;
  if (!isPlaced(graph, from) || !isPlaced(graph, to)) return false;
  if (from === to) return true;

  const seen = new Set<PartKind>([from]);
  const queue: PartKind[] = [from];
  while (queue.length > 0) {
    const current = queue.shift() as PartKind;
    for (const next of graph.neighbours.get(current) ?? []) {
      if (next === without || seen.has(next)) continue;
      if (next === to) return true;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

/**
 * Checks are data, never functions, so content stays serializable literals and
 * the engine is the only thing that knows how to read them.
 */
export type Predicate =
  | { op: 'placed'; kind: PartKind; atLeast?: number }
  | { op: 'notPlaced'; kind: PartKind }
  | { op: 'edge'; a: PartKind; b: PartKind }
  | { op: 'noEdge'; a: PartKind; b: PartKind }
  | { op: 'eachConnected'; each: PartKind; to: PartKind }
  | { op: 'path'; from: PartKind; to: PartKind }
  | { op: 'pathVia'; from: PartKind; to: PartKind; via: PartKind }
  | { op: 'maxParts'; n: number };

function directlyJoined(graph: KindGraph, a: PartKind, b: PartKind): boolean {
  return graph.neighbours.get(a)?.has(b) === true;
}

function test(build: Build, graph: KindGraph, predicate: Predicate): boolean {
  switch (predicate.op) {
    case 'placed':
      return (graph.counts.get(predicate.kind) ?? 0) >= (predicate.atLeast ?? 1);
    case 'notPlaced':
      return !isPlaced(graph, predicate.kind);
    case 'edge':
      return directlyJoined(graph, predicate.a, predicate.b);
    case 'noEdge':
      return !directlyJoined(graph, predicate.a, predicate.b);
    case 'eachConnected': {
      const { each, to } = predicate;
      if (!isPlaced(graph, each) || !isPlaced(graph, to)) return false;
      return unwiredInstances(build, each, to).length === 0;
    }
    case 'path':
      return reaches(graph, predicate.from, predicate.to);
    case 'pathVia': {
      const { from, to, via } = predicate;
      // A via that is one of the endpoints is not a route through anything,
      // and cutting it would trivially disconnect the pair. Refuse it.
      if (via === from || via === to) return false;
      if (!isPlaced(graph, via)) return false;
      return reaches(graph, from, to) && !reaches(graph, from, to, via);
    }
    case 'maxParts':
      // Pre-placed parts count too. Everything on the board is part of the
      // budget, which is the point of having one.
      return build.parts.length <= predicate.n;
  }
}

export function testPredicate(build: Build, predicate: Predicate): boolean {
  return test(build, kindGraph(build), predicate);
}

/** What the engine needs of a check. Content adds the prose around it. */
export interface CheckSpec {
  id: string;
  when: Predicate;
  /** Level-3 hint, and with the other checks' moves, the worked solution. */
  hintMoves: Move[];
  bonus?: true;
}

export type Move =
  | { place: PartKind }
  | { connect: [PartKind, PartKind] }
  | { disconnect: [PartKind, PartKind] }
  | { remove: PartKind };

export interface TrayPart {
  kind: PartKind;
  count: 1 | 2;
  decoy?: true;
}

export interface StageSpec {
  tray: TrayPart[];
  prePlaced?: PartKind[];
  preWired?: [PartKind, PartKind][];
  checks: CheckSpec[];
}

export interface CapstoneSpec {
  id: string;
  stages: StageSpec[];
}

export interface CheckResult {
  id: string;
  pass: boolean;
}

/**
 * Results in authored order. Bonus checks are only evaluated once every
 * ordinary check passes, so a bonus can never be what a stage waits on.
 */
export function evaluate(build: Build, checks: CheckSpec[]): CheckResult[] {
  const graph = kindGraph(build);
  const passes = new Map(checks.map((c) => [c.id, test(build, graph, c.when)]));
  const ordinaryAllPass = checks.every((c) => c.bonus === true || passes.get(c.id) === true);
  return checks.map((c) => ({
    id: c.id,
    pass:
      c.bonus === true ? ordinaryAllPass && passes.get(c.id) === true : passes.get(c.id) === true,
  }));
}

/** The hint target: the first ordinary check that is red, if any. */
export function firstFailing(checks: CheckSpec[], results: CheckResult[]): string | null {
  const bonusIds = new Set(checks.filter((c) => c.bonus === true).map((c) => c.id));
  return results.find((r) => !r.pass && !bonusIds.has(r.id))?.id ?? null;
}

function connectKinds(build: Build, a: PartKind, b: PartKind): Build {
  let next = build;
  for (const from of build.parts.filter((p) => p.kind === a)) {
    for (const to of build.parts.filter((p) => p.kind === b)) {
      if (from.id === to.id || hasEdge(next, from.id, to.id)) continue;
      next = { parts: next.parts, edges: [...next.edges, pair(from.id, to.id)] };
    }
  }
  return next;
}

function disconnectKinds(build: Build, a: PartKind, b: PartKind): Build {
  const kindOf = new Map(build.parts.map((p) => [p.id, p.kind]));
  const joins = (x: number, y: number) => {
    const kx = kindOf.get(x);
    const ky = kindOf.get(y);
    return (kx === a && ky === b) || (kx === b && ky === a);
  };
  return { parts: build.parts, edges: build.edges.filter(([x, y]) => !joins(x, y)) };
}

function removeKind(build: Build, kind: PartKind): Build {
  return build.parts
    .filter((p) => p.kind === kind)
    .reduce((acc, p) => removePart(acc, p.id), build);
}

/**
 * The board a capstone opens on: stage 1's pre-placed parts and pre-wiring,
 * nothing else. The screen needs this to start a run, and runMoves needs it to
 * start the canonical one, so it lives here rather than in either.
 */
export function startingBuild(capstone: CapstoneSpec): Build {
  const stage = capstone.stages[0];
  if (stage === undefined) return emptyBuild();
  let build = emptyBuild();
  for (const kind of stage.prePlaced ?? []) build = place(build, kind) ?? build;
  for (const [a, b] of stage.preWired ?? []) build = connectKinds(build, a, b);
  return build;
}

export interface CanonicalRun {
  /** The board after each stage's moves, index-aligned with the stages. */
  stageBuilds: Build[];
  problems: string[];
}

/**
 * The author's worked solution, executed: stage 1's starting board plus every
 * check's hint moves, stage by stage, in authored order.
 *
 * Running it is how a capstone proves it is solvable by following its own
 * hints, which is also what stops the hints drifting away from the checks.
 */
export function runMoves(capstone: CapstoneSpec): CanonicalRun {
  const problems: string[] = [];
  const stageBuilds: Build[] = [];
  const budget = new Map<PartKind, number>();
  const taken = new Map<PartKind, number>();
  let build = emptyBuild();

  capstone.stages.forEach((stage, index) => {
    const where = `${capstone.id} stage ${index + 1}`;

    if (index > 0 && (stage.prePlaced !== undefined || stage.preWired !== undefined)) {
      problems.push(`${where} sets prePlaced or preWired, which stage 1 alone may do`);
    }
    for (const part of stage.tray) {
      if (part.decoy === true) continue;
      budget.set(part.kind, (budget.get(part.kind) ?? 0) + part.count);
    }

    if (index === 0) {
      build = startingBuild(capstone);
      const wanted = (stage.prePlaced ?? []).length;
      if (build.parts.length !== wanted) {
        problems.push(`${where} pre-places more parts than a lane holds`);
      }
      for (const [a, b] of stage.preWired ?? []) {
        if (!hasKindEdge(build, a, b)) {
          problems.push(`${where} pre-wires ${a} to ${b} without pre-placing both`);
        }
      }
    }

    for (const check of stage.checks) {
      for (const move of check.hintMoves) {
        const at = `${where} check "${check.id}"`;
        if ('place' in move) {
          const kind = move.place;
          if (!canPlace(build, kind)) {
            problems.push(`${at} places ${kind} into a full ${PART_LANES[kind]} lane`);
            continue;
          }
          const used = taken.get(kind) ?? 0;
          if (used + 1 > (budget.get(kind) ?? 0)) {
            problems.push(`${at} places a ${kind} the tray does not hold by this stage`);
            continue;
          }
          taken.set(kind, used + 1);
          build = place(build, kind) as Build;
        } else if ('connect' in move) {
          const [a, b] = move.connect;
          const next = connectKinds(build, a, b);
          if (next.edges.length === build.edges.length) {
            problems.push(`${at} connects ${a} to ${b}, which changes nothing`);
          }
          build = next;
        } else if ('disconnect' in move) {
          const [a, b] = move.disconnect;
          const next = disconnectKinds(build, a, b);
          if (next.edges.length === build.edges.length) {
            problems.push(`${at} disconnects ${a} from ${b}, which changes nothing`);
          }
          build = next;
        } else {
          // A no-op in the canonical run, where decoys are never placed. It is
          // authored so a decoy check can still tell a stuck user what to do.
          const kind = move.remove;
          const gone = countOfKind(build, kind);
          build = removeKind(build, kind);
          taken.set(kind, Math.max(0, (taken.get(kind) ?? 0) - gone));
        }
      }
    }
    stageBuilds.push(build);
  });

  return { stageBuilds, problems };
}

/**
 * The board the author's own hints arrive at, from the start through the
 * given stage (docs/12 part F2).
 *
 * The debrief sheet draws this after a stage is cleared, as the shape an
 * interviewer usually draws rather than as the answer: grading never consults
 * it, and nothing reaches it until the user's own build has already passed.
 */
export function canonicalBuild(capstone: CapstoneSpec, throughStage: number): Build {
  if (throughStage < 0) return emptyBuild();
  const { stageBuilds } = runMoves(capstone);
  const last = stageBuilds.length - 1;
  return stageBuilds[Math.min(throughStage, last)] ?? emptyBuild();
}

/**
 * Everything that has to hold for a capstone to be shippable. Problems are
 * returned rather than thrown: content/validate.ts collects them alongside
 * the rest so one broken build reports every fault at once.
 */
export function validateCapstone(capstone: CapstoneSpec): string[] {
  const run = runMoves(capstone);
  const problems = [...run.problems];
  const authoredSoFar: CheckSpec[] = [];

  capstone.stages.forEach((stage, index) => {
    authoredSoFar.push(...stage.checks);
    const build = run.stageBuilds[index] ?? emptyBuild();
    const graph = kindGraph(build);
    for (const check of authoredSoFar) {
      // Bonus checks are held to the same bar here: the canonical run is the
      // worked solution, and it is meant to earn the bonus too.
      if (!test(build, graph, check.when)) {
        problems.push(
          `${capstone.id} check "${check.id}" is red after stage ${index + 1}'s own hint moves`,
        );
      }
    }
  });

  const trayKinds = new Set<PartKind>();
  for (const stage of capstone.stages) {
    for (const kind of stage.prePlaced ?? []) trayKinds.add(kind);
    for (const part of stage.tray) trayKinds.add(part.kind);
  }
  const allChecks = capstone.stages.flatMap((s) => s.checks);
  for (const check of allChecks) {
    if (check.when.op === 'notPlaced' && !trayKinds.has(check.when.kind)) {
      problems.push(
        `${capstone.id} check "${check.id}" forbids ${check.when.kind}, which no tray offers`,
      );
    }
    // A check about wiring every clone is unsatisfiable unless the user can
    // get both kinds onto the board in the first place.
    if (check.when.op === 'eachConnected') {
      for (const kind of [check.when.each, check.when.to]) {
        if (!trayKinds.has(kind)) {
          problems.push(`${capstone.id} check "${check.id}" wires ${kind}, which no tray offers`);
        }
      }
    }
  }

  // A decoy the user can place with nothing going red is not a decoy, it is a
  // spare part. Either a notPlaced check names it or a budget rules it out.
  capstone.stages.forEach((stage, index) => {
    for (const part of stage.tray) {
      if (part.decoy !== true) continue;
      const named = allChecks.some((c) => c.when.op === 'notPlaced' && c.when.kind === part.kind);
      const budgeted = capstone.stages
        .slice(index)
        .some((later, offset) =>
          later.checks.some(
            (c) =>
              c.when.op === 'maxParts' &&
              (run.stageBuilds[index + offset]?.parts.length ?? 0) === c.when.n,
          ),
        );
      if (!named && !budgeted) {
        problems.push(
          `${capstone.id} stage ${index + 1} offers ${part.kind} as a decoy with no check against it`,
        );
      }
    }
  });

  return problems;
}
