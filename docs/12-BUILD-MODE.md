# 12, Build mode: architecture capstones (v1.4)

A new mechanic: the user builds a small system architecture from a tray of parts on a snap-lane board, and the build is graded by running requirement checks against it, like unit tests against code. It exists because every current mechanic shows the user a diagram (or prose about one) and asks them to judge it; the interview asks them to produce one. This is the production-side twin of track 5.

It is deliberately not a drawing tool. The solution space is bounded by three fences: a finite parts tray per stage, a lane board that fixes where each kind of part may sit, and check-based grading that accepts any build satisfying the checks. Two different-looking builds that both pass are both correct, which is also true in the real interview.

Scope: one engine module, one schema addition, one full-screen renderer, two capstones of content. No new dependencies (the `vendor` budget in docs/05 is untouched; everything here is CSS, SVG and requestAnimationFrame). The `index` chunk is expected to grow; this is a feature, which is what the budget note in docs/05 allows.

## Decisions already made with the user (do not reopen)

1. **Checks, not answer keys.** Grading evaluates predicates over the graph the user built. There is no canonical diagram to diff against. The check list is the exercise.
2. **Capstones are not session material.** A capstone is a 2-4 minute boss level at the end of a track's path (docs/11), launched from the track detail screen. The daily session composer never deals one, and the reps-over-depth principle stays intact.
3. **Tap only in v1.** Tap a tray part, tap a lane to place it; tap two placed parts to connect them. No dragging, no freeform canvas, no arrow drawing. Edges are undirected.
4. **Hints are per failing check**, three escalating levels (nudge, point, move), free to take, and taking one marks the stage "assisted" for XP only. No penalties beyond that.
5. **Motion is premium restraint, not spectacle.** The existing motion language in docs/06 governs ("nothing falls, nothing is thrown"). This mode adds exactly one new kind of moving element, the flow packet, defined in part D. No particles, no bounces, no screen shake, no celebration layer beyond what the app already has. (Revised with the user after the first build: a run is the mode's best moment and a single dot underplayed it, so a route now carries a short convoy rather than one packet. The restraint rules around it are unchanged.)

## Part A: engine (`src/engine/archgraph.ts`, new)

Pure module, no React, no DOM (docs/05 engine purity). This is where the whole idea stands or falls, so it lands first, fully tested, before any UI exists.

### The build graph

```ts
type PartKind =
  | 'client'
  | 'cdn' // edge lane
  | 'lb' // entry lane
  | 'server' // compute lane
  | 'queue'
  | 'worker' // async lane
  | 'cache'
  | 'db'
  | 'replica'
  | 'blob'
  | 'ext-api'; // data lane

type LaneId = 'edge' | 'entry' | 'compute' | 'async' | 'data';

const PART_LANES: Record<PartKind, LaneId>; // the mapping in the comments above

interface Build {
  parts: { id: number; kind: PartKind }[]; // id unique within the build
  edges: [number, number][]; // undirected, by part id
}
```

Placement legality (a part may only enter its lane, at most 3 parts per lane, no duplicate edge, no self edge) is enforced by `canPlace(build, kind)` and `toggleEdge(build, a, b)` helpers here, not in the component, so it is testable and ports untouched.

### Predicates

Checks are data, never functions: content stays serializable literals and the engine interprets them. Predicates evaluate on the **kind graph**: collapse all instances of a kind to one node, with an edge between two kinds when any instance pair is connected. This makes "two servers behind one load balancer" behave as authors expect without quantifier semantics.

```ts
type Predicate =
  | { op: 'placed'; kind: PartKind; atLeast?: number } // instance count >= atLeast (default 1)
  | { op: 'notPlaced'; kind: PartKind } // zero instances (decoy checks)
  | { op: 'edge'; a: PartKind; b: PartKind } // some direct connection exists
  | { op: 'noEdge'; a: PartKind; b: PartKind } // no direct connection exists
  | { op: 'path'; from: PartKind; to: PartKind } // connected by any route
  | { op: 'pathVia'; from: PartKind; to: PartKind; via: PartKind }
  | { op: 'maxParts'; n: number }; // total placed instances <= n
```

Exact semantics, so the tests are mechanical:

- `edge` / `noEdge` look only at direct edges, never routes.
- `path` requires both kinds placed and connected through any chain of edges in the kind graph.
- `pathVia` requires all three kinds placed, `from` and `to` connected by some route, and disconnected once the `via` node is removed from the kind graph. A direct `from`-`to` edge therefore fails it. Any missing kind fails it.
- `maxParts` counts pre-placed parts too. Everything on the board counts.
- `notPlaced` on a kind that was never in any tray passes vacuously (harmless; validation forbids authoring it anyway).

Authoring guidance the semantics imply: use `path` for guarantees that must survive later stages (stage 1 wires the client straight to the server; stage 2 inserts a load balancer and breaks the direct edge, and a stage 1 `edge` check would go red where a `path` check stays green). Use `edge` only when directness is the lesson.

`evaluate(build, checks)` returns `{ id, pass }[]` in authored order. Bonus checks (part B) are evaluated only when every non-bonus check passes. The **first failing non-bonus check** is the hint target; the UI never has to choose.

### Canonical run (solvability)

Each check carries level-3 hint moves (part B). The moves across a capstone's stages, applied in order to an empty board plus stage 1's pre-placed parts and pre-wired edges, are the author's worked solution. `runMoves(capstone)` executes them:

- `{ place: kind }` adds one instance in its lane.
- `{ connect: [a, b] }` connects every instance of kind `a` to every instance of kind `b`.
- `{ disconnect: [a, b] }` removes every edge between instances of the two kinds.
- `{ remove: kind }` removes all instances of the kind. A no-op in the canonical run, where decoys are never placed; it exists so a decoy check can still tell a stuck user what to do.

`validateCapstone(capstone)` asserts: after each stage's moves, every check authored so far (this stage's and all earlier stages') passes, non-bonus and bonus alike; lane capacity and placement legality were never violated; no move placed a part the cumulative tray (minus decoys) does not contain; every decoy kind in the capstone has a `notPlaced` or `maxParts` check covering it. A capstone that ships is therefore provably solvable by following its own hints, and hints can never drift out of sync with checks.

### Tests (`archgraph.test.ts`)

Every predicate op, pass and fail, including: `path` surviving an indirect route where `edge` fails; `pathVia` with a direct bypass edge present (fails), with the via kind missing (fails), and with two servers collapsing into one kind node; `maxParts` counting pre-placed parts; `evaluate` ordering and the bonus gate; `canPlace` lane capacity; `toggleEdge` add, remove, self and duplicate; `runMoves` fan-out connect and disconnect; `validateCapstone` catching an unsolvable stage, an over-capacity move, a move breaking an earlier stage's check, and an uncovered decoy.

## Part B: schema (`src/content/types.ts`, `src/content/capstones.ts`)

A capstone is not an `Exercise`: different frame, different progress, different entry point. It gets its own collection, assembled and validated in `content/index.ts` alongside the rest (the emoji, em-dash and markdown-subset content tests must pick the new file up automatically; verify they scan it).

```ts
interface Capstone {
  id: string; // "c5-01", stable, progress keys off it
  trackId: TrackId;
  title: string; // "The photo-sharing app"
  scenario: string; // 2-3 sentences of setup, interviewer voice
  icon: IconName;
  conceptIds: string[]; // cards linked from the summary
  stages: CapstoneStage[]; // 2-3
}

interface CapstoneStage {
  requirement: string; // the interviewer's ask for this stage, 1-2 sentences
  tray: { kind: PartKind; count: 1 | 2; decoy?: true }[]; // parts ADDED this stage
  prePlaced?: PartKind[]; // stage 1 only: the board's starting parts
  preWired?: [PartKind, PartKind][]; // stage 1 only: starting edges between pre-placed parts
  checks: CapstoneCheck[]; // 2-4 non-bonus + at most 1 bonus
  clearLine: string; // shown on stage clear, interviewer voice
}

interface CapstoneCheck {
  id: string; // unique within the capstone
  label: string; // plain words, <= 8 words, shown in the check row
  when: Predicate;
  hintNudge: string; // level 1: Socratic question, interviewer voice
  hintPoint: { highlight: PartKind[]; text: string }; // level 2: where to look
  hintMoves: Move[]; // level 3: the exact actions (1-4), also the canonical solution
  sayIt?: string; // interviewer-approved sentence, shown when the check passes
  bonus?: true; // hidden until it passes; never blocks a stage
}

type Move =
  | { place: PartKind }
  | { connect: [PartKind, PartKind] }
  | { disconnect: [PartKind, PartKind] }
  | { remove: PartKind };
```

`hintMoves` may be empty only on a check the canonical run satisfies as a side effect of other checks' moves (a `maxParts` budget, typically); its level-3 hint then renders from the check's `hintPoint.text`. Authoring rules (same bar as docs/03): labels and requirements in plain words, jargon defined by the linked cards; `sayIt` on every check that teaches vocabulary; nudges are questions, never answers; decoys encode real interview mistakes (the shiny part nobody asked for), never silly ones.

### Progress and XP

`Persisted` gains one additive field, no `schemaVersion` bump (same reasoning as docs/08 delta 6):

```ts
capstones?: Record<string, {
  stagesCleared: number;   // stages persist across abandons; the current stage restarts
  assisted: boolean;       // any hint taken anywhere in the capstone
  completedDay: string | null;
}>;
```

XP mirrors the existing scale (docs/01): +10 per stage cleared with no hint taken in that stage, +5 with hints, +10 on completing the final stage. A completed capstone is replayable from the track path (progress record stays; replays award no XP). Capstones do not enter Leitner and do not touch exercise boxes in v1; the summary links the capstone's `conceptIds` cards instead.

## Part C: the board (renderer)

New folder `src/capstone/` (Board, Tray, CheckRow, flow-runner), screen `screens/Capstone.tsx`, route `/capstone/:id`, presented like the session player: full-screen, no tab bar, X-with-confirm to abandon. Entry point: the track path (docs/11) appends a capstone station after the last lesson of a track that has one; the Home track strip does not change.

Layout, top to bottom, at 390x844: requirement card (interviewer line, `--surface`, standard card), the board, the check strip, the tray, the primary button ("Run it", full primary style including the 19px/800 label rule).

- **Board**: a `--paper` card with a faint dot grid and 14px of padding, containing five horizontal lanes, 80px tall, separated by hairline `--paper-line` dividers. Each lane's name sits **above** its row as a 12px uppercase `--paper-dim` caption (Edge, Entry, Compute, Async, Data), not in a rail beside it: a rail costs 64px of every row and pushes every part right of the card's centre line, which is what made the first board read as unbalanced. Placed parts space themselves across the full width; the lane never scrolls (capacity 3 guarantees fit).
- **Part chip**: 62x62, radius 14, `--surface` fill on a 1px `--paper-edge` and a 1px soft shadow, the part glyph at 26px stroke in `--ink-strong`, kind label 6px under it at 12px `--paper-text`. Armed (selected): 2px `--accent` ring, no scale change. New glyphs live in `src/components/PartGlyph.tsx`, drawn in the ConceptIcon stroke style, one per `PartKind` (compile error until drawn, by design). The fixed glyph vocabulary is the point: the same cache shape every time is how whiteboard shapes become reflexes.
- **Edges**: two SVG layers, the connections under the chips and their end dots above. 1.6px `--ink` at 55%, drawn as a cubic with tangents perpendicular to the edge it leaves, so a connection grows out of a chip rather than grazing it and a crossing reads as one line passing over another. Two chips in the same row are joined by a straight line: there is nothing to curve around, and bending it looks like a machine drew it. Anchors sit on the chip **edge**, not its centre, and are **fanned** along that edge in the order of where they are going, so four connections leaving one server do not stack into a single stroke. Each connection ends in a 2.5px `--ink` dot nudged 2px onto the chip, which is what tells a connection apart from a line passing behind a chip on its way somewhere else. The renderer owns all of this geometry (`capstone/wires.ts`, pure and tested); the engine never sees pixels.
- **Interaction**, all taps: tap a tray chip to arm it (its legal lane gets a soft `--accent` ring at ~25% opacity; illegal lanes do not react); tap the lane to place. Tap a placed chip to arm it; tap a second placed chip to toggle the edge between them (this is also how an edge is removed: same two taps); tap the armed chip again to disarm. While a placed chip is armed, a ghost button "Return to tray" appears under the board. Every tap target >= 44px (chips are 56, lanes are 60).
- **Check strip**: one row per non-bonus check, 44px tall, radius-full pill: a 20px state ring (like the mcq option ring) plus the check's `label`. Before the first run all rings are empty `--border`. The strip is visible from the start: the checks are the acceptance criteria the user builds against, never a surprise.
- **Stage flow**: clearing a stage swaps the requirement card's text, appends the new stage's checks to the strip, and adds the new tray parts. Cleared checks stay in the strip and stay evaluated on every run: a later stage can break an earlier guarantee and the strip must show it (this is the whole "now scale it" lesson; part E stage 2 relies on it).
- **Hints**: after a failing run, the first failing check row grows a ghost "Hint" button. Taps escalate: level 1 replaces the row's subtext with `hintNudge`; level 2 adds `hintPoint.text` and pulses a one-time soft ring on the `highlight` kinds' chips (or their lane when not yet placed); level 3 states the `hintMoves` in words ("Place the queue, wire the API to it and it to the worker"). Levels never auto-advance and reset per run.

## Part D: Run it, motion and sound

This section is binding the way docs/06 is. The bar: **snappy, solid, quietly premium**. Every animation here answers a user question (where did it go, what is being tested, what failed); if a proposed flourish answers none, it does not ship. Durations and easing are the existing tokens: micro 150ms, standard 250ms, celebratory 400ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`. Transforms and opacity only, no layout or filter animation, one requestAnimationFrame driver for the dot. Target 60fps on a mid-range phone; if a frame budget must be bought, cut an effect rather than its quality.

- **Place**: the chip translates from its tray position to its lane slot along a straight line, 250ms, settling with no overshoot. It is a chess move, not a toss. The tray gap closes in the same 250ms.
- **Connect**: the edge draws from the armed chip to the tapped chip in 150ms (stroke-dashoffset). Removal reverses it. No glow.
- **Run it**: checks execute visibly but fast; a full green run over 5 checks completes in about 2 seconds and a failure stops earlier. Per check: a convoy of three 8px `--accent` packets leaves the check's relevant source 90ms apart and travels its route **along the drawn connection** (the renderer samples the path, so a packet never cuts across a curve it is meant to be tracing). The check row's ring fills `--success` (150ms) as the **lead** packet arrives, so the run's cadence is exactly what a single dot gave: 150ms per hop, and the followers are still in the air when the next check starts. That overlap is the point; it costs the run no time. Checks with no sensible route (`placed`, `notPlaced`, `maxParts`) send nothing and resolve their ring 150ms after the previous check, and a check that stops on a part rather than reaching one sends a single packet there rather than three on the same pixel.
- **How a packet moves**: at a constant speed **in distance**, not a flat time per hop. The drawn connections differ in length by a third or more on a normal board, so a flat 150ms per hop makes a packet cross the short wires slowly and the long ones fast, with a visible step change at every part on the way. Speed ramps up over the first fifth of the route and down over the last, and holds steady in between: it pulls away, it cruises, it glides in. Constant cruise is what keeps a convoy's gaps even, so it reads as a stream rather than as three dots breathing together. Still a cursor rather than a character: constant size, no trail, no bounce.
- **Failure**: the run halts at the first failing check. The traffic reaches the part where the story breaks and **holds** there for 140ms before fading, rather than arriving and vanishing: a failure should read as something not flowing, not as something absent. Where the break is a wrong route rather than a missing part (a `pathVia` bypass, a `noEdge` that exists), the packets sail the wrong path and stop on it, which is the lesson. The implicated chip takes a `--danger` border and the standard 250ms ±4px shake, and the check row's ring fills `--danger`. Unreached checks keep empty rings. One shake, one color, silence after; the miss reads as a shrug, exactly like a wrong mcq option.
- **Stage clear**: the remaining rings cascade `--success` left to right at 45ms apart (the summary-dots pattern), the `clearLine` replaces the requirement text with a 250ms fade-slide, and the new tray chips fade-slide in staggered 45ms. Nothing blooms mid-capstone.
- **Capstone complete**: navigate to the standard summary screen; the existing count-up, single bloom and result-dot cascade are the celebration. Build mode adds nothing on top; the reward is the finished architecture itself, so the summary shows a small static render of the final build.
- **Reduced motion** (system or in-app toggle): no packets, no travel, no shake; rings and panels resolve with 150ms fades, sequencing preserved so the order of results still reads.
- **Sound**: reuse `engine/feedback.ts` cues untouched. One cue per run, not per check: the wrong cue on a halted run, the correct cue on a stage clear, the session-complete cue on the summary screen as usual. No new synthesis. Haptics on run halt and stage clear, behind the existing toggle.

Add one pointer line to docs/06 (Core components): "Build mode board, chips and flow packets: see docs/12 part D; the motion tokens and restraint rules above govern it."

## Part E: content, the first two capstones

Two capstones ship with the feature. The author writes all text (scenario, requirements, labels, hints, sayIt lines) to the docs/03 quality bar; this section fixes structure, parts and exact check sets. Both must pass `validateCapstone` from part A. Checks are listed as `id: predicate` with the teaching intent in brackets; `hintMoves` shown where they are not the obvious single action.

### c5-01, track 5: "The photo-sharing app"

Concepts: `design-script`, `caching`, `queues-jobs` (or the nearest existing t5 card ids; resolve against `concepts.ts`).

**Stage 1, make it work** (browse and upload photos). Pre-placed: `client`. Tray: `server`, `db`, `blob`.

- `s1-api`: path(client, server) [the browser talks to your API; `path` so stage 2's load balancer never breaks it]. Moves: place server, connect client-server.
- `s1-data`: pathVia(client, db, server) [photo records are reached only through the API; a direct client-db edge fails this by definition of `pathVia`]. Moves: place db, connect server-db.
- `s1-files`: edge(server, blob) [photo files live in file storage, not in the database]. Moves: place blob, connect server-blob.

**Stage 2, 100k users** (reads must stay fast, one server is not enough). Tray: `lb`, `server`, `cache`.

- `s2-two`: placed(server, atLeast 2) [horizontal scaling]. Moves: place server.
- `s2-lb`: pathVia(client, server, lb) [all traffic enters through the load balancer; the user must also delete the stage 1 direct edge, which is the lesson]. Moves: place lb, connect client-lb, connect lb-server, disconnect client-server.
- `s2-cache`: edge(server, cache) [hot reads come from memory]. Moves: place cache, connect server-cache.

**Stage 3, slow uploads** (thumbnail work blocks the user). Tray: `queue`, `worker`, decoy `replica`.

- `s3-queue`: pathVia(server, worker, queue) [the API hands work off and answers immediately; no direct server-worker edge]. Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `s3-thumbs`: edge(worker, blob) [the worker writes thumbnails back to storage]. Moves: connect worker-blob.
- `s3-decoy`: notPlaced(replica) [the database was never the bottleneck here; nudge asks what is actually slow]. Moves: remove replica.
- `s3-budget`: maxParts(9) [canonical build: client, lb, 2 servers, cache, db, blob, queue, worker = 9]. Moves: none (see part B).

### c9-01, track 9: "The flash-sale checkout"

Concepts: `queues-jobs`, `indexes`, `caching` (resolve against `concepts.ts`; add `replication` to the t9 card set if docs/08 did not already create it, as a normal docs/03-bar card).

**Stage 1, take orders without losing any.** Pre-placed: `client`, `lb`; pre-wired: client-lb. Tray: `server`, `db`, `queue`, `worker`.

- `f1-api`: pathVia(client, server, lb) [the entry path is given; the user extends it]. Moves: place server, connect lb-server.
- `f1-orders`: pathVia(server, worker, queue) [orders are accepted into a queue, not written inline; the spike cannot knock over what it never touches]. Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `f1-write`: edge(worker, db) [the worker drains the queue into the database at its own pace]. Moves: place db, connect worker-db.
- `f1-read`: edge(server, db) [the API still reads products directly]. Moves: connect server-db.

**Stage 2, the product page is melting the database.** Tray: `cache`, `replica`, decoy `blob`.

- `f2-cache`: edge(server, cache) [most reads never reach the database]. Moves: place cache, connect server-cache.
- `f2-replica`: edge(db, replica) [reads can come off a copy while the primary takes writes]. Moves: place replica, connect db-replica, connect server-replica.
- `f2-decoy`: notPlaced(blob) [nothing here is a file; plausible because "storage" sounds right]. Moves: remove blob.
- `f2-bonus` (bonus): pathVia(client, db, server) [nothing reaches the database except through the app; sayIt carries the sentence]. Moves: none.

## Milestones

- **M-BM1, engine and schema.** Part A and part B land with full tests; `validateCapstone` wired into content validation; both capstones authored as data and passing it. No UI. Acceptance: `npm test` covers every predicate op and the solvability runner; content tests (emoji, em-dash, markdown) scan `capstones.ts`.
- **M-BM2, playable board.** Part C without part D: placement, edges, check strip, instant grading on Run it, hints, stage flow, progress and XP persistence, entry from the track path, abandon and resume (cleared stages persist, current stage restarts). Acceptance: c5-01 completable end to end at 390x844 by taps alone; lint and build pass; no dependency added.
- **M-BM3, motion and sound.** Part D exactly as specified, including reduced-motion behavior and the summary's static build render. Acceptance: a full run animates in under 2.5s; every effect uses only transform and opacity; reduced motion verified with both the OS setting and the in-app toggle; c9-01 shipped.

## V2 ideas (do NOT build now)

Drag placement via the existing SortableZone; directed edges with arrowheads and direction-aware predicates; a failure drill (tap a part to kill it and re-run the checks); capstone entries in the review pile; `cdn` and `ext-api` earning their place in a third capstone; freeform check authoring beyond the seven ops.
