import { describe, expect, it } from 'vitest';
import {
  canonicalBuild,
  canPlace,
  emptyBuild,
  evaluate,
  firstFailing,
  kindGraph,
  LANE_CAPACITY,
  PART_LANES,
  place,
  removePart,
  runMoves,
  startingBuild,
  testPredicate,
  toggleEdge,
  trace,
  unwiredInstances,
  validateCapstone,
  type Build,
  type CapstoneSpec,
  type CheckSpec,
  type PartKind,
  type Predicate,
} from './archgraph';

/**
 * The whole idea stands or falls here: if a predicate means something other
 * than what an author read into it, a capstone grades the wrong build as
 * right. These tests are the definition of the eight ops.
 */

/** Parts are numbered 1, 2, 3… in placement order; links use those numbers. */
function buildOf(kinds: PartKind[], links: [number, number][] = []): Build {
  let build = emptyBuild();
  for (const kind of kinds) build = place(build, kind) as Build;
  for (const [a, b] of links) build = toggleEdge(build, a, b);
  return build;
}

describe('placement', () => {
  it('puts every kind in its own lane', () => {
    expect(PART_LANES.client).toBe('edge');
    expect(PART_LANES.lb).toBe('entry');
    expect(PART_LANES.server).toBe('compute');
    expect(PART_LANES.worker).toBe('async');
    expect(PART_LANES.blob).toBe('data');
  });

  it('fills a lane to capacity and then refuses', () => {
    let build = emptyBuild();
    for (let i = 0; i < LANE_CAPACITY; i++) {
      expect(canPlace(build, 'server')).toBe(true);
      build = place(build, 'server') as Build;
    }
    expect(canPlace(build, 'server')).toBe(false);
    expect(place(build, 'server')).toBeNull();
  });

  it('counts the whole lane, not the kind: a full data lane blocks a cache', () => {
    const build = buildOf(['db', 'replica', 'blob']);
    expect(canPlace(build, 'cache')).toBe(false);
    expect(canPlace(build, 'server')).toBe(true);
  });

  it('keeps ids unique, and a reused one inherits nothing from the part that left', () => {
    const build = buildOf(['server', 'db'], [[1, 2]]);
    const next = place(removePart(build, 2), 'cache') as Build;
    expect(new Set(next.parts.map((p) => p.id)).size).toBe(next.parts.length);
    expect(next.parts.map((p) => p.kind)).toEqual(['server', 'cache']);
    expect(next.edges).toEqual([]);
  });

  it('drops the edges of a part it removes', () => {
    const build = buildOf(['server', 'db'], [[1, 2]]);
    expect(removePart(build, 2).edges).toEqual([]);
  });
});

describe('toggleEdge', () => {
  it('adds an edge', () => {
    expect(toggleEdge(buildOf(['server', 'db']), 1, 2).edges).toEqual([[1, 2]]);
  });

  it('removes the same edge on the same two taps, whichever way round', () => {
    const wired = buildOf(['server', 'db'], [[1, 2]]);
    expect(toggleEdge(wired, 2, 1).edges).toEqual([]);
  });

  it('refuses to connect a part to itself', () => {
    expect(toggleEdge(buildOf(['server']), 1, 1).edges).toEqual([]);
  });

  it('never stores a duplicate: the second tap toggles rather than stacking', () => {
    let build = buildOf(['server', 'db']);
    build = toggleEdge(build, 1, 2);
    build = toggleEdge(build, 1, 2);
    build = toggleEdge(build, 1, 2);
    expect(build.edges).toEqual([[1, 2]]);
  });

  it('ignores a part that is not on the board', () => {
    expect(toggleEdge(buildOf(['server']), 1, 9).edges).toEqual([]);
  });
});

describe('the kind graph', () => {
  it('collapses instances of a kind to one node', () => {
    const graph = kindGraph(
      buildOf(
        ['lb', 'server', 'server'],
        [
          [1, 2],
          [1, 3],
        ],
      ),
    );
    expect(graph.counts.get('server')).toBe(2);
    expect([...(graph.neighbours.get('lb') ?? [])]).toEqual(['server']);
  });

  it('ignores an edge between two parts of the same kind', () => {
    const graph = kindGraph(buildOf(['server', 'server'], [[1, 2]]));
    expect(graph.neighbours.get('server')?.size).toBe(0);
  });
});

describe('placed', () => {
  const p = (atLeast?: number): Predicate => ({ op: 'placed', kind: 'server', atLeast });

  it('passes on one instance by default', () => {
    expect(testPredicate(buildOf(['server']), p())).toBe(true);
    expect(testPredicate(emptyBuild(), p())).toBe(false);
  });

  it('counts instances for atLeast', () => {
    expect(testPredicate(buildOf(['server']), p(2))).toBe(false);
    expect(testPredicate(buildOf(['server', 'server']), p(2))).toBe(true);
    expect(testPredicate(buildOf(['server', 'server', 'server']), p(2))).toBe(true);
  });
});

describe('notPlaced', () => {
  const p: Predicate = { op: 'notPlaced', kind: 'replica' };

  it('passes on an empty board and fails on one instance', () => {
    expect(testPredicate(buildOf(['db']), p)).toBe(true);
    expect(testPredicate(buildOf(['db', 'replica']), p)).toBe(false);
  });
});

describe('edge and noEdge', () => {
  const wired: Predicate = { op: 'edge', a: 'server', b: 'cache' };
  const unwired: Predicate = { op: 'noEdge', a: 'server', b: 'cache' };

  it('reads direct connections only', () => {
    const direct = buildOf(['server', 'cache'], [[1, 2]]);
    expect(testPredicate(direct, wired)).toBe(true);
    expect(testPredicate(direct, unwired)).toBe(false);
  });

  it('fails on a route that goes the long way round', () => {
    const indirect = buildOf(
      ['server', 'cache', 'lb'],
      [
        [1, 3],
        [3, 2],
      ],
    );
    expect(testPredicate(indirect, wired)).toBe(false);
    expect(testPredicate(indirect, unwired)).toBe(true);
  });

  it('treats a missing part as not connected', () => {
    expect(testPredicate(buildOf(['server']), wired)).toBe(false);
    expect(testPredicate(buildOf(['server']), unwired)).toBe(true);
  });
});

describe('eachConnected', () => {
  const p: Predicate = { op: 'eachConnected', each: 'server', to: 'cache' };

  it('passes when the one server there is wired to the cache', () => {
    expect(testPredicate(buildOf(['server', 'cache'], [[1, 2]]), p)).toBe(true);
  });

  it('fails when the server and the cache are both there and unconnected', () => {
    expect(testPredicate(buildOf(['server', 'cache']), p)).toBe(false);
  });

  it('fails when either kind is missing', () => {
    expect(testPredicate(buildOf(['server']), p)).toBe(false);
    expect(testPredicate(buildOf(['cache']), p)).toBe(false);
    expect(testPredicate(emptyBuild(), p)).toBe(false);
  });

  it('fails on a fleet where one server has the cache and the other does not', () => {
    // The whole reason the op exists: edge sees a server touching the cache
    // and is satisfied, and half the requests still miss it.
    const half = buildOf(['server', 'server', 'cache'], [[1, 3]]);
    expect(testPredicate(half, { op: 'edge', a: 'server', b: 'cache' })).toBe(true);
    expect(testPredicate(half, p)).toBe(false);
    expect(unwiredInstances(half, 'server', 'cache')).toEqual([2]);
  });

  it('passes once every server has its own line to the cache', () => {
    const whole = buildOf(
      ['server', 'server', 'cache'],
      [
        [1, 3],
        [2, 3],
      ],
    );
    expect(testPredicate(whole, p)).toBe(true);
    expect(unwiredInstances(whole, 'server', 'cache')).toEqual([]);
  });

  it('is happy with a server wired to either of two caches', () => {
    const spread = buildOf(
      ['server', 'server', 'cache', 'cache'],
      [
        [1, 3],
        [2, 4],
      ],
    );
    expect(testPredicate(spread, p)).toBe(true);
  });

  it('reads direct connections only, never a route round the houses', () => {
    const roundabout = buildOf(
      ['server', 'server', 'cache'],
      [
        [1, 3],
        [1, 2],
      ],
    );
    expect(testPredicate(roundabout, p)).toBe(false);
  });

  it('walks the connection on a pass and stops on the clone that lacks one', () => {
    const whole = buildOf(
      ['server', 'server', 'cache'],
      [
        [1, 3],
        [2, 3],
      ],
    );
    expect(trace(whole, p)).toEqual({ route: ['server', 'cache'], stopsAt: null });
    const half = buildOf(['server', 'server', 'cache'], [[1, 3]]);
    expect(trace(half, p)).toEqual({ route: ['server'], stopsAt: 'server' });
  });

  it('falls back to the far kind when nothing of the near one is placed', () => {
    expect(trace(buildOf(['cache']), p)).toEqual({ route: ['cache'], stopsAt: 'cache' });
    expect(trace(emptyBuild(), p)).toEqual({ route: [], stopsAt: null });
  });
});

describe('path', () => {
  const p: Predicate = { op: 'path', from: 'client', to: 'server' };

  it('survives a load balancer being inserted in the middle', () => {
    // The reason authors reach for path over edge: stage 2 breaks the direct
    // client-server edge, and a stage 1 guarantee has to stay green.
    const direct = buildOf(['client', 'server'], [[1, 2]]);
    const viaLb = buildOf(
      ['client', 'server', 'lb'],
      [
        [1, 3],
        [3, 2],
      ],
    );
    expect(testPredicate(direct, p)).toBe(true);
    expect(testPredicate(viaLb, p)).toBe(true);
    expect(testPredicate(viaLb, { op: 'edge', a: 'client', b: 'server' })).toBe(false);
  });

  it('fails when nothing joins the two', () => {
    expect(testPredicate(buildOf(['client', 'server']), p)).toBe(false);
  });

  it('fails when either end is missing', () => {
    expect(testPredicate(buildOf(['client']), p)).toBe(false);
    expect(testPredicate(buildOf(['server']), p)).toBe(false);
  });
});

describe('pathVia', () => {
  const p: Predicate = { op: 'pathVia', from: 'client', to: 'db', via: 'server' };

  it('passes when every route goes through the via part', () => {
    const build = buildOf(
      ['client', 'server', 'db'],
      [
        [1, 2],
        [2, 3],
      ],
    );
    expect(testPredicate(build, p)).toBe(true);
  });

  it('fails when a direct edge bypasses it', () => {
    const build = buildOf(
      ['client', 'server', 'db'],
      [
        [1, 2],
        [2, 3],
        [1, 3],
      ],
    );
    expect(testPredicate(build, p)).toBe(false);
  });

  it('fails when a longer route bypasses it', () => {
    const build = buildOf(
      ['client', 'server', 'db', 'cache'],
      [
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 3],
      ],
    );
    expect(testPredicate(build, p)).toBe(false);
  });

  it('fails when the via kind is not on the board', () => {
    const build = buildOf(['client', 'db'], [[1, 2]]);
    expect(testPredicate(build, p)).toBe(false);
  });

  it('fails when either end is missing', () => {
    expect(testPredicate(buildOf(['client', 'server'], [[1, 2]]), p)).toBe(false);
  });

  it('sees two servers as one node, so either of them carrying the route counts', () => {
    const build = buildOf(
      ['client', 'server', 'server', 'db', 'lb'],
      [
        [1, 5],
        [5, 2],
        [5, 3],
        [3, 4],
      ],
    );
    expect(testPredicate(build, p)).toBe(true);
  });

  it('refuses a via that is one of its own endpoints', () => {
    const build = buildOf(['client', 'db'], [[1, 2]]);
    expect(testPredicate(build, { op: 'pathVia', from: 'client', to: 'db', via: 'db' })).toBe(
      false,
    );
  });
});

describe('maxParts', () => {
  it('allows the budget and refuses one over', () => {
    const p: Predicate = { op: 'maxParts', n: 3 };
    expect(testPredicate(buildOf(['client', 'server', 'db']), p)).toBe(true);
    expect(testPredicate(buildOf(['client', 'server', 'db', 'cache']), p)).toBe(false);
  });

  it('counts pre-placed parts too. Everything on the board is in the budget', () => {
    const capstone: CapstoneSpec = {
      id: 'x-01',
      stages: [
        {
          prePlaced: ['client', 'lb'],
          tray: [{ kind: 'server', count: 1 }],
          checks: [
            { id: 'a', when: { op: 'placed', kind: 'server' }, hintMoves: [{ place: 'server' }] },
            { id: 'b', when: { op: 'maxParts', n: 3 }, hintMoves: [] },
          ],
        },
      ],
    };
    const [afterStage] = runMoves(capstone).stageBuilds;
    expect(afterStage.parts).toHaveLength(3);
    expect(testPredicate(afterStage, { op: 'maxParts', n: 3 })).toBe(true);
    expect(testPredicate(afterStage, { op: 'maxParts', n: 2 })).toBe(false);
    expect(validateCapstone(capstone)).toEqual([]);
  });
});

describe('evaluate', () => {
  const checks: CheckSpec[] = [
    { id: 'one', when: { op: 'placed', kind: 'server' }, hintMoves: [] },
    { id: 'two', when: { op: 'edge', a: 'server', b: 'db' }, hintMoves: [] },
    { id: 'extra', when: { op: 'placed', kind: 'cache' }, hintMoves: [], bonus: true },
  ];

  it('reports results in authored order', () => {
    const results = evaluate(buildOf(['server']), checks);
    expect(results.map((r) => r.id)).toEqual(['one', 'two', 'extra']);
    expect(results.map((r) => r.pass)).toEqual([true, false, false]);
  });

  it('holds a bonus back until every ordinary check is green', () => {
    const cacheOnly = buildOf(['server', 'cache']);
    expect(evaluate(cacheOnly, checks).find((r) => r.id === 'extra')?.pass).toBe(false);

    const complete = buildOf(
      ['server', 'db', 'cache'],
      [
        [1, 2],
        [1, 3],
      ],
    );
    expect(evaluate(complete, checks).map((r) => r.pass)).toEqual([true, true, true]);
  });

  it('points the hint at the first ordinary failure, never at a bonus', () => {
    expect(firstFailing(checks, evaluate(buildOf(['server']), checks))).toBe('two');
    expect(firstFailing(checks, evaluate(emptyBuild(), checks))).toBe('one');
    const complete = buildOf(['server', 'db'], [[1, 2]]);
    // Only the bonus is red here, and a bonus never blocks a stage.
    expect(firstFailing(checks, evaluate(complete, checks))).toBeNull();
  });
});

describe('runMoves', () => {
  it('fans a connect out across every instance of both kinds', () => {
    const { stageBuilds, problems } = runMoves({
      id: 'x-02',
      stages: [
        {
          tray: [
            { kind: 'lb', count: 1 },
            { kind: 'server', count: 2 },
          ],
          checks: [
            {
              id: 'fan',
              when: { op: 'placed', kind: 'server', atLeast: 2 },
              hintMoves: [
                { place: 'lb' },
                { place: 'server' },
                { place: 'server' },
                { connect: ['lb', 'server'] },
              ],
            },
          ],
        },
      ],
    });
    expect(problems).toEqual([]);
    expect(stageBuilds[0].edges).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  it('disconnects every edge between the two kinds at once', () => {
    const { stageBuilds } = runMoves({
      id: 'x-03',
      stages: [
        {
          tray: [
            { kind: 'lb', count: 1 },
            { kind: 'server', count: 2 },
          ],
          checks: [
            {
              id: 'undo',
              when: { op: 'noEdge', a: 'lb', b: 'server' },
              hintMoves: [
                { place: 'lb' },
                { place: 'server' },
                { place: 'server' },
                { connect: ['lb', 'server'] },
                { disconnect: ['lb', 'server'] },
              ],
            },
          ],
        },
      ],
    });
    expect(stageBuilds[0].edges).toEqual([]);
    expect(stageBuilds[0].parts).toHaveLength(3);
  });

  it('opens on the pre-placed board, which is what a run starts from', () => {
    const capstone: CapstoneSpec = {
      id: 'x-07',
      stages: [
        {
          prePlaced: ['client', 'lb'],
          preWired: [['client', 'lb']],
          tray: [{ kind: 'server', count: 1 }],
          checks: [
            {
              id: 'a',
              when: { op: 'edge', a: 'lb', b: 'server' },
              hintMoves: [{ place: 'server' }, { connect: ['lb', 'server'] }],
            },
          ],
        },
      ],
    };
    const opening = startingBuild(capstone);
    expect(opening.parts.map((p) => p.kind)).toEqual(['client', 'lb']);
    expect(opening.edges).toEqual([[1, 2]]);
    // The canonical run starts from exactly this board, then adds to it.
    expect(runMoves(capstone).stageBuilds[0].parts).toHaveLength(3);
  });

  it('opens on an empty board when nothing is pre-placed', () => {
    expect(startingBuild({ id: 'x-08', stages: [{ tray: [], checks: [] }] })).toEqual(emptyBuild());
  });

  it('starts from the pre-placed board and its pre-wiring', () => {
    const { stageBuilds } = runMoves({
      id: 'x-04',
      stages: [
        {
          prePlaced: ['client', 'lb'],
          preWired: [['client', 'lb']],
          tray: [],
          checks: [],
        },
      ],
    });
    expect(stageBuilds[0].parts.map((p) => p.kind)).toEqual(['client', 'lb']);
    expect(stageBuilds[0].edges).toEqual([[1, 2]]);
  });

  it('treats a remove of an unplaced kind as the no-op it is', () => {
    const { problems, stageBuilds } = runMoves({
      id: 'x-05',
      stages: [
        {
          tray: [{ kind: 'replica', count: 1, decoy: true }],
          checks: [
            {
              id: 'no',
              when: { op: 'notPlaced', kind: 'replica' },
              hintMoves: [{ remove: 'replica' }],
            },
          ],
        },
      ],
    });
    expect(problems).toEqual([]);
    expect(stageBuilds[0].parts).toEqual([]);
  });

  it('flags a connect that changes nothing, which is a hint gone stale', () => {
    const { problems } = runMoves({
      id: 'x-06',
      stages: [
        {
          tray: [{ kind: 'server', count: 1 }],
          checks: [
            {
              id: 'early',
              when: { op: 'edge', a: 'server', b: 'db' },
              hintMoves: [{ place: 'server' }, { connect: ['server', 'db'] }],
            },
          ],
        },
      ],
    });
    expect(problems).toEqual([
      'x-06 stage 1 check "early" connects server to db, which changes nothing',
    ]);
  });

  it('wires only the pairs that are missing when a scale-out repeats a connect', () => {
    // docs/12 part H rule 3: a second-copy check re-runs the connects its
    // clones already have, so the reference build never draws a half-wired
    // one. Repeating a connect must add the new pair and leave the old edge
    // alone rather than drawing a second line on top of it.
    const { stageBuilds, problems } = runMoves({
      id: 'x-10',
      stages: [
        {
          tray: [
            { kind: 'server', count: 1 },
            { kind: 'db', count: 1 },
          ],
          checks: [
            {
              id: 'first',
              when: { op: 'edge', a: 'server', b: 'db' },
              hintMoves: [{ place: 'server' }, { place: 'db' }, { connect: ['server', 'db'] }],
            },
          ],
        },
        {
          tray: [{ kind: 'server', count: 1 }],
          checks: [
            {
              id: 'second',
              when: { op: 'eachConnected', each: 'server', to: 'db' },
              hintMoves: [{ place: 'server' }, { connect: ['server', 'db'] }],
            },
          ],
        },
      ],
    });
    expect(problems).toEqual([]);
    expect(stageBuilds[1].edges).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });
});

describe('canonicalBuild', () => {
  /** Two stages, the second of which moves a connection the first drew. */
  const capstone: CapstoneSpec = {
    id: 'x-09',
    stages: [
      {
        prePlaced: ['client'],
        tray: [{ kind: 'server', count: 1 }],
        checks: [
          {
            id: 's1-api',
            when: { op: 'path', from: 'client', to: 'server' },
            hintMoves: [{ place: 'server' }, { connect: ['client', 'server'] }],
          },
        ],
      },
      {
        tray: [{ kind: 'lb', count: 1 }],
        checks: [
          {
            id: 's2-lb',
            when: { op: 'pathVia', from: 'client', to: 'server', via: 'lb' },
            hintMoves: [
              { place: 'lb' },
              { connect: ['client', 'lb'] },
              { connect: ['lb', 'server'] },
              { disconnect: ['client', 'server'] },
            ],
          },
        ],
      },
    ],
  };

  it('returns the board the hints arrive at by the end of a stage', () => {
    const stage1 = canonicalBuild(capstone, 0);
    expect(stage1.parts.map((p) => p.kind)).toEqual(['client', 'server']);
    expect(stage1.edges).toEqual([[1, 2]]);

    const stage2 = canonicalBuild(capstone, 1);
    expect(stage2.parts.map((p) => p.kind)).toEqual(['client', 'server', 'lb']);
    // The direct line is gone: the reference build is the one the later
    // stage's checks accept, not the sum of everything ever drawn.
    expect(stage2.edges).toEqual([
      [1, 3],
      [2, 3],
    ]);
  });

  it('passes every check authored up to that stage', () => {
    capstone.stages.forEach((_, index) => {
      const build = canonicalBuild(capstone, index);
      const soFar = capstone.stages.slice(0, index + 1).flatMap((s) => s.checks);
      expect(evaluate(build, soFar).every((r) => r.pass)).toBe(true);
    });
  });

  it('stops at the last stage rather than running off the end', () => {
    expect(canonicalBuild(capstone, 9)).toEqual(canonicalBuild(capstone, 1));
  });

  it('has nothing to draw before the first stage is played', () => {
    expect(canonicalBuild(capstone, -1)).toEqual(emptyBuild());
  });
});

describe('validateCapstone', () => {
  /** The shape of a healthy two-stage capstone, for tests to bend one way. */
  const sound = (): CapstoneSpec => ({
    id: 'c0-01',
    stages: [
      {
        prePlaced: ['client'],
        tray: [
          { kind: 'server', count: 1 },
          { kind: 'db', count: 1 },
        ],
        checks: [
          {
            id: 's1-api',
            when: { op: 'path', from: 'client', to: 'server' },
            hintMoves: [{ place: 'server' }, { connect: ['client', 'server'] }],
          },
          {
            id: 's1-data',
            when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
            hintMoves: [{ place: 'db' }, { connect: ['server', 'db'] }],
          },
        ],
      },
      {
        tray: [{ kind: 'lb', count: 1 }],
        checks: [
          {
            id: 's2-lb',
            when: { op: 'pathVia', from: 'client', to: 'server', via: 'lb' },
            hintMoves: [
              { place: 'lb' },
              { connect: ['client', 'lb'] },
              { connect: ['lb', 'server'] },
              { disconnect: ['client', 'server'] },
            ],
          },
        ],
      },
    ],
  });

  it('passes a capstone its own hints solve', () => {
    expect(validateCapstone(sound())).toEqual([]);
  });

  it('catches a stage whose hints do not solve it', () => {
    const capstone = sound();
    capstone.stages[0].checks[1].hintMoves = [{ place: 'db' }];
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('"s1-data" is red after stage 1');
  });

  it('catches a move that overflows a lane', () => {
    const capstone = sound();
    capstone.stages[1].tray = [{ kind: 'db', count: 2 }];
    capstone.stages[1].checks = [
      {
        id: 's2-full',
        when: { op: 'placed', kind: 'db', atLeast: 3 },
        hintMoves: [{ place: 'db' }, { place: 'db' }, { place: 'db' }],
      },
    ];
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('places db into a full data lane');
  });

  it('catches a later stage quietly breaking an earlier guarantee', () => {
    const capstone = sound();
    // Wiring the client straight to the database is exactly the mistake a
    // stage 1 pathVia is there to forbid, and stage 2 must not undo it.
    capstone.stages[1].checks[0].hintMoves.push({ connect: ['client', 'db'] });
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('"s1-data" is red after stage 2');
  });

  it('catches a decoy no check argues against', () => {
    const capstone = sound();
    capstone.stages[1].tray.push({ kind: 'blob', count: 1, decoy: true });
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('offers blob as a decoy with no check against it');
  });

  it('accepts a decoy a budget rules out, without a notPlaced check', () => {
    const capstone = sound();
    capstone.stages[1].tray.push({ kind: 'blob', count: 1, decoy: true });
    capstone.stages[1].checks.push({
      id: 's2-budget',
      when: { op: 'maxParts', n: 4 },
      hintMoves: [],
    });
    expect(validateCapstone(capstone)).toEqual([]);
  });

  it('catches a part the tray never offered', () => {
    const capstone = sound();
    capstone.stages[1].checks[0].hintMoves.unshift({ place: 'cache' });
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('places a cache the tray does not hold');
  });

  it('catches a notPlaced check on a part nobody could have placed', () => {
    const capstone = sound();
    capstone.stages[1].checks.push({
      id: 's2-nothing',
      when: { op: 'notPlaced', kind: 'cdn' },
      hintMoves: [],
    });
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('forbids cdn, which no tray offers');
  });

  it('accepts an eachConnected check both of whose kinds a tray offers', () => {
    const capstone = sound();
    capstone.stages[1].tray.push({ kind: 'cache', count: 1 });
    capstone.stages[1].checks.push({
      id: 's2-cache',
      when: { op: 'eachConnected', each: 'server', to: 'cache' },
      hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }],
    });
    expect(validateCapstone(capstone)).toEqual([]);
  });

  it('catches an eachConnected check naming a part no tray offers', () => {
    const capstone = sound();
    capstone.stages[1].checks.push({
      id: 's2-cache',
      when: { op: 'eachConnected', each: 'server', to: 'cache' },
      hintMoves: [],
    });
    expect(validateCapstone(capstone).join('\n')).toContain('wires cache, which no tray offers');
  });

  it('catches a second server the hints leave unwired', () => {
    // The failure the op was added for, at author time rather than at play
    // time: a fleet the worked solution itself only half connects.
    const capstone = sound();
    capstone.stages[1].tray.push({ kind: 'server', count: 1 }, { kind: 'cache', count: 1 });
    capstone.stages[1].checks.push({
      id: 's2-cache',
      when: { op: 'eachConnected', each: 'server', to: 'cache' },
      // A connect fans out across every instance, so placing the second
      // server after it is what leaves that one on its own.
      hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }, { place: 'server' }],
    });
    expect(validateCapstone(capstone).join('\n')).toContain('"s2-cache" is red after stage 2');
  });

  it('catches pre-placing more parts than a lane holds', () => {
    const capstone = sound();
    capstone.stages[0].prePlaced = ['db', 'cache', 'replica', 'blob'];
    expect(validateCapstone(capstone).join('\n')).toContain(
      'pre-places more parts than a lane holds',
    );
  });

  it('catches pre-wiring two parts that are not both pre-placed', () => {
    const capstone = sound();
    capstone.stages[0].preWired = [['client', 'lb']];
    expect(validateCapstone(capstone).join('\n')).toContain(
      'pre-wires client to lb without pre-placing both',
    );
  });

  it('catches pre-placing outside stage 1', () => {
    const capstone = sound();
    capstone.stages[1].prePlaced = ['cdn'];
    const problems = validateCapstone(capstone);
    expect(problems.join('\n')).toContain('which stage 1 alone may do');
  });

  it('holds a bonus check to the same bar: the worked solution earns it', () => {
    const capstone = sound();
    capstone.stages[1].checks.push({
      id: 's2-bonus',
      when: { op: 'edge', a: 'client', b: 'cdn' },
      hintMoves: [],
      bonus: true,
    });
    expect(validateCapstone(capstone).join('\n')).toContain('"s2-bonus" is red after stage 2');
  });
});

describe('trace, the route the flow packets walk', () => {
  it('walks the two ends of an edge it is happy with', () => {
    const build = buildOf(['server', 'cache'], [[1, 2]]);
    expect(trace(build, { op: 'edge', a: 'server', b: 'cache' })).toEqual({
      route: ['server', 'cache'],
      stopsAt: null,
    });
  });

  it('stops on the part that is there when the edge is not', () => {
    const build = buildOf(['server', 'cache']);
    expect(trace(build, { op: 'edge', a: 'server', b: 'cache' })).toEqual({
      route: ['server'],
      stopsAt: 'server',
    });
  });

  it('has nowhere to stand when neither end is placed', () => {
    expect(trace(emptyBuild(), { op: 'edge', a: 'server', b: 'cache' })).toEqual({
      route: [],
      stopsAt: null,
    });
  });

  it('falls back to the far end when the near one is missing', () => {
    const build = buildOf(['cache']);
    expect(trace(build, { op: 'edge', a: 'server', b: 'cache' })).toEqual({
      route: ['cache'],
      stopsAt: 'cache',
    });
  });

  it('walks the shortest route a path check is satisfied by', () => {
    const build = buildOf(
      ['client', 'server', 'lb'],
      [
        [1, 3],
        [3, 2],
      ],
    );
    expect(trace(build, { op: 'path', from: 'client', to: 'server' })).toEqual({
      route: ['client', 'lb', 'server'],
      stopsAt: null,
    });
  });

  it('walks the bypass when a bypass is what beat the check', () => {
    // The whole explanation of a failed pathVia: this is the route that
    // should not exist, so the dot walks it rather than the intended one.
    const build = buildOf(
      ['client', 'server', 'db'],
      [
        [1, 2],
        [2, 3],
        [1, 3],
      ],
    );
    expect(trace(build, { op: 'pathVia', from: 'client', to: 'db', via: 'server' })).toEqual({
      route: ['client', 'db'],
      stopsAt: 'db',
    });
  });

  it('walks the honest route when a pathVia passes', () => {
    const build = buildOf(
      ['client', 'server', 'db'],
      [
        [1, 2],
        [2, 3],
      ],
    );
    expect(trace(build, { op: 'pathVia', from: 'client', to: 'db', via: 'server' })).toEqual({
      route: ['client', 'server', 'db'],
      stopsAt: null,
    });
  });

  it('stops at the source when the via part was never placed', () => {
    const build = buildOf(['client', 'db']);
    expect(trace(build, { op: 'pathVia', from: 'client', to: 'db', via: 'server' })).toEqual({
      route: ['client'],
      stopsAt: 'client',
    });
  });

  it('walks the offending edge for a noEdge check that failed', () => {
    const build = buildOf(['client', 'db'], [[1, 2]]);
    expect(trace(build, { op: 'noEdge', a: 'client', b: 'db' })).toEqual({
      route: ['client', 'db'],
      stopsAt: 'db',
    });
  });

  it('gives the counting checks no route to walk', () => {
    const build = buildOf(['server', 'replica']);
    expect(trace(build, { op: 'placed', kind: 'server' })).toEqual({ route: [], stopsAt: null });
    expect(trace(build, { op: 'maxParts', n: 1 })).toEqual({ route: [], stopsAt: null });
  });

  it('points a failed decoy check at the part that should not be there', () => {
    const build = buildOf(['server', 'replica']);
    expect(trace(build, { op: 'notPlaced', kind: 'replica' })).toEqual({
      route: [],
      stopsAt: 'replica',
    });
    expect(trace(buildOf(['server']), { op: 'notPlaced', kind: 'replica' })).toEqual({
      route: [],
      stopsAt: null,
    });
  });

  it('never walks a route through a part that is not on the board', () => {
    // Two servers collapse to one node, so the route names the kind once.
    const build = buildOf(
      ['client', 'lb', 'server', 'server'],
      [
        [1, 2],
        [2, 3],
        [2, 4],
      ],
    );
    const { route } = trace(build, { op: 'path', from: 'client', to: 'server' });
    expect(route).toEqual(['client', 'lb', 'server']);
  });
});
