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

Layout, top to bottom, at 390x844: requirement card (interviewer line, `--surface`, standard card), the board, the tray, the check strip, the button bar ("Run it", full primary style including the 19px/800 label rule). The tray sits against the board rather than under the checks: a placement is a tap on a part and a tap on a lane, and the two ends of it belong in one glance (it is also where a drag would start, once dragging is built).

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
- **Run it**: checks execute visibly, at a pace you can follow. A stage 1 run over 3 checks takes about 1.5 seconds and the longest run the app plays, every check of a finished capstone, about 3.5; a failure stops earlier. Per check: a convoy of three 8px `--accent` packets travels the check's route **along the drawn connection** (the renderer samples the path, so a packet never cuts across a curve it is meant to be tracing). The check row's ring fills `--success` (150ms) as the **lead** packet arrives, and the ones behind it are still in the air when the next check starts. That overlap is the point; it costs the run no time. Checks with no sensible route (`placed`, `notPlaced`, `maxParts`) send nothing and resolve their ring one standard duration (250ms) after the previous check, and a check that stops on a part rather than reaching one sends a single packet there rather than three on the same pixel.
- **How a packet moves**: at one speed, **320 pixels per second**, from the first pixel of a route to the last. No ramp at either end and no easing anywhere: a packet that changes pace is a packet moving at a different speed from the one behind it, and that is exactly what opens and closes the gap between them. A speed rather than a duration per hop, too. Given a flat time per hop, the drawn connections differ in length by a third or more on a normal board, so a packet crosses the short wires slowly and the long ones fast with a step change at every part on the way, and a two hop check moves faster than a one hop check on the same board. Given a speed, a longer route simply takes longer, and the whole run reads as one system. Still a cursor rather than a character: constant size, no trail, no bounce.
- **Spacing**: packets sit a fixed **34 pixels** apart, and that distance never changes. The convoy moves as one body rather than as three independent packets released on a timer, so there is no moment at which one is travelling faster than another. Packets fade in over the first 12 pixels of a route and out over the last 12, which is what makes them look like they are coming out of one box and going into the next rather than appearing and vanishing in mid air. Every packet is lit the same: the convoy is a stream, not a leader with an escort.
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

- `s2-two`: placed(server, atLeast 2) [horizontal scaling]. Moves: place server, connect server-db, connect server-blob (the second server reaches everything the first does; part H rule 3).
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

## Part F: refinement wave (v1.5)

Driven by the first real plays of c5-01 and c9-01. Three changes: a predicate for "every clone gets the same wiring", a post-solve debrief that shows the reference build, and two new capstones. Decision 1 stands untouched: grading still never diffs against a reference; the debrief is shown only after the user's own build has already passed.

Two judged-and-settled non-changes, recorded so they are not relitigated per wave: no `maxEdges` op and no junk-edge penalty (harmless extra lines stay legal; anything harmful is already caught by `pathVia`, and policing the rest would punish defensible designs), and no free placement (lanes are curriculum, and grading never consulted them anyway).

### F1: the `eachConnected` predicate

- New op: `{ op: 'eachConnected'; each: PartKind; to: PartKind }`. Passes when both kinds have at least one instance and **every** instance of `each` has a direct edge to **some** instance of `to`. This is the one deliberate exception to the kind-graph collapse, because the interchangeability of clones is itself the lesson: a fleet where one server has the cache and another does not is a real design flaw the old `edge` op could not see.
- `trace`: route `[each, to]` on a pass; on a failure `stopsAt` is `each` and the renderer highlights an unwired instance, not the first one.
- `validateCapstone`: both kinds must exist in the cumulative tray or pre-placed parts.
- Content change: c5-01 `s2-cache` becomes eachConnected(server, cache); reword its label and hints for "every server" (author's words). `hintMoves` stay as they are: `connect` already fans out to every instance, so the canonical run passes unchanged.
- One tidiness bonus, the only one: c5-01 stage 3 gains `s3-tidy` (bonus): noEdge(db, blob), sayIt teaching that the app coordinates the database and file storage and they never talk to each other directly. Moves: none.

### F2: the debrief (the reference build, after solving only)

- Schema: `CapstoneStage` gains `debrief: string` (required; 1-3 sentences, plain words: why this shape is the standard answer, what each region buys). Author it for **all four** capstones' stages in this wave.
- Engine: `canonicalBuild(capstone, throughStage)`: replays `hintMoves` from the start through the given stage and returns the resulting `Build`. Exported and tested; it is the author's worked solution made visible.
- UI (revised with the user after first play; it shipped as a bottom sheet, which hides the user's own board exactly when the two should be compared): the reference is an **inline panel, not a sheet**. After a stage clears, the ghost link "See the reference build" sits under the clear line and toggles a panel directly below the user's board, so both diagrams are on screen together and eyeballed by scrolling, never by switching. The panel contains: a small caption in the app's voice framing both builds as valid (yours passed; this is the shape interviewers usually draw), the static mini render of the canonical build at that stage (the existing static board render), the stage's `debrief`, then the stage's checks as label + sayIt lines. While open the link reads "Hide the reference build". The capstone summary gets the same inline panel under the user's final build render. The link is never reachable before its stage is cleared, and grading never consults the canonical build.
- Motion: no height tween (part D bans layout animation): the panel appears at full size with its content fading in 150ms, and collapsing is immediate. The mini board is static, no dot, no new effects. The bottom-sheet variant is removed, not kept as a fallback.

### F3: capstones three and four

Same authoring contract as part E. Entry points need no new UI: a capstone station appears at the end of its track's path automatically; verify track 8 renders its first station.

#### c8-01, track 8: "The global storefront"

Concepts: `caching-headers`, `idempotency`, `http-verbs` (resolve against `concepts.ts`).

**Stage 1, make it work** (a shop: browse products, place orders). Pre-placed: `client`. Tray: `server`, `db`.

- `g1-api`: path(client, server) [the browser reaches your API]. Moves: place server, connect client-server.
- `g1-data`: pathVia(client, db, server) [products and orders live behind the API]. Moves: place db, connect server-db.

**Stage 2, customers in Australia wait three seconds** (static assets cross the planet on every view). Tray: `cdn`, `cache`.

- `g2-cdn`: edge(client, cdn) [static files come from an edge near the user]. Moves: place cdn, connect client-cdn.
- `g2-origin`: edge(cdn, server) [the CDN fills itself from your origin]. Moves: connect cdn-server.
- `g2-cache`: edge(server, cache) [dynamic reads come from memory]. Moves: place cache, connect server-cache.

**Stage 3, add card payments** (the provider is slow and sometimes times out; checkout must never hang or double-charge). Tray: `queue`, `worker`, `ext-api`, decoy `lb`.

- `g3-jobs`: pathVia(server, worker, queue) [charge attempts are queued jobs, not inline calls]. Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `g3-provider`: pathVia(server, ext-api, worker) [only the worker talks to the payment provider; the request thread never waits on it]. Moves: place ext-api, connect worker-ext-api.
- `g3-decoy`: notPlaced(lb) [nothing said traffic was the problem; the reflex to scale compute is the trap]. Moves: remove lb.
- `g3-budget`: maxParts(8) [canonical: client, cdn, server, cache, db, queue, worker, ext-api]. Moves: none.
- `g3-bonus` (bonus): pathVia(client, db, server) [nothing reaches the database except through the app. Duplicates `g1-data`'s predicate, accepted deliberately: as a bonus it resurfaces the sentence at the moment payments arrive, with its own sayIt]. Moves: none.

#### c9-02, track 9: "The analytics pipeline"

Concepts: `queues-jobs`, `replication`, `indexes` (resolve against `concepts.ts`).

**Stage 1, track events without slowing the app.** Pre-placed: `client`, `server`; pre-wired: client-server. Tray: `queue`, `worker`, `db`.

- `a1-queue`: edge(server, queue) [events are fired into a queue and forgotten. Specced as pathVia(server, worker, queue), but stage 2's replica wiring joins server to worker around the queue in the undirected kind graph, so pathVia would fail a correct build; the same downgrade the part E capstones carry]. Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `a1-write`: edge(worker, db) [the worker batches events into the database at its own pace]. Moves: place db, connect worker-db.
- `a1-inline`: noEdge(server, db) [the request thread never writes analytics inline; directness is the lesson, so `noEdge` and not a route op]. Moves: none (the canonical run never draws the edge, and a no-op disconnect fails move validation; the level-3 hint falls back to `hintPoint.text`, which names the action).

**Stage 2, the dashboard queries are strangling the primary.** Tray: `replica`, decoy `ext-api`.

- `a2-copy`: edge(db, replica) [a copy takes the reads while the primary takes the writes]. Moves: place replica, connect db-replica.
- `a2-read`: edge(server, replica) [dashboards read from the copy]. Moves: connect server-replica.
- `a2-decoy`: notPlaced(ext-api) [an "analytics service" sounds right; the ask was to fix the reads you already have]. Moves: remove ext-api.
- `a2-budget`: maxParts(6) [canonical: client, server, queue, worker, db, replica]. Moves: none.

## Part H: the library wave (v1.7)

Six new capstones and a difficulty marking, taking the library from 4 to 10: track 5 gets 3, track 8 gets 3, track 9 gets 4. Chosen so every lesson the current parts vocabulary can express is covered at least once, the queue family gets deliberate re-skins (users want more of a kind they like), and two capstones are traps that punish the reflex answer. Past 10, genuinely new asks need new part kinds (websocket, rate limiter, search); that stays in V2.

Two authoring rules this wave surfaced, binding for all capstones:

1. **Budget and decoy checks (`maxParts`, `notPlaced`) live only in a capstone's final stage.** Earlier checks stay evaluated forever (part C), so a budget authored early is broken by later stages' own parts, and a `notPlaced` authored early forbids a part a later stage needs. The validator already catches violations; this rule says why.
2. **The tray is itself a constraint.** A stage that offers only the right parts cannot be over-built, so an early stage teaches restraint by a small tray, not by checks. c8-03 stage 1 depends on this.
3. **Hint moves run in authored check order, and a scale-out keeps the reference honest.** A stage's second-copy check (place the extra server or worker) is authored before any connect whose fan-out should include the new instance, and its moves also wire the new instance to everything its clones already reach, so the drawn reference build never shows a half-wired clone.

### Difficulty

`Capstone` gains `difficulty: Difficulty` (required). The path station shows it the same way exercise difficulty is shown elsewhere in the app; if no such affordance exists yet, a small caption of 1-3 dots in the station's secondary text style, aria-labelled in words. Assign: the four existing capstones are all 2; new ones as listed below.

### c5-02, track 5: "The read storm" (difficulty 2, 3 stages)

The trap for the queue reflex. A small articles site goes viral; it is a pure read problem, and the tray eventually offers queue and worker as decoys. Concepts: `caching`, plus the replica card used by t9 (resolve names against `concepts.ts`).

**Stage 1, make it work** (publish and read articles). Pre-placed: `client`. Tray: `server`, `db`.

- `r1-api`: path(client, server). Moves: place server, connect client-server.
- `r1-data`: pathVia(client, db, server). Moves: place db, connect server-db.

**Stage 2, the spike begins** (front page of a big aggregator; one server buckles). Tray: `lb`, `server`, `cache`.

- `r2-lb`: pathVia(client, server, lb). Moves: place lb, connect client-lb, connect lb-server, disconnect client-server.
- `r2-two`: placed(server, atLeast 2), authored before `r2-lb` per rule 3. Moves: place server, connect server-db.
- `r2-cache`: eachConnected(server, cache). Moves: place cache, connect server-cache.

**Stage 3, the primary is still hot** (cache misses hammer one database; there is no work to defer). Tray: `replica`, decoys `queue` and `worker`.

- `r3-copy`: edge(db, replica). Moves: place replica, connect db-replica.
- `r3-read`: edge(server, replica). Moves: connect server-replica.
- `r3-trap`: maxParts(7) [canonical: client, lb, 2 servers, cache, db, replica; the hint asks what work a queue would even hold on a read path]. Moves: none.
- `r3-bonus` (bonus): pathVia(client, db, server). Moves: none.

### c8-02, track 8: "The login rush" (difficulty 2, 2 stages)

The stateless-servers lesson, with the bug appearing because you scaled. Concepts: nearest t8 cards for cookies/sessions plus `caching` (resolve against `concepts.ts`).

**Stage 1, make it work** (users sign in). Pre-placed: `client`. Tray: `server`, `db`.

- `l1-api`: path(client, server). Moves: place server, connect client-server.
- `l1-users`: pathVia(client, db, server) [accounts live behind the API]. Moves: place db, connect server-db.

**Stage 2, random logouts** (a second server was added for traffic and now users lose their session at random). Tray: `lb`, `server`, `cache`, decoy `ext-api`.

- `l2-lb`: pathVia(client, server, lb). Moves: place lb, connect client-lb, connect lb-server, disconnect client-server.
- `l2-two`: placed(server, atLeast 2), authored before `l2-lb` per rule 3. Moves: place server, connect server-db.
- `l2-session`: eachConnected(server, cache) [the session lives in a store every server can reach, never in one server's memory]. Moves: place cache, connect server-cache.
- `l2-decoy`: notPlaced(ext-api) [outsourcing auth does not fix where the session lives]. Moves: remove ext-api.

### c8-03, track 8: "The launch site" (difficulty 1, 2 stages)

The over-building trap, inverted YAGNI: the right answer is tiny, and interviewers ask small questions to see who reaches for big architecture. Concepts: `caching-headers` and the nearest pragmatism card (resolve against `concepts.ts`).

**Stage 1, a static launch page** (marketing page, no accounts, no data). Pre-placed: `client`. Tray: `cdn`, `blob` (nothing else on offer; the tray is the lesson).

- `y1-edge`: edge(client, cdn) [pages come from an edge near the visitor]. Moves: place cdn, connect client-cdn.
- `y1-origin`: edge(cdn, blob) [the files live in storage; the CDN serves copies]. Moves: place blob, connect cdn-blob.

**Stage 2, one signup form** (collect email addresses; it is one POST). Tray: `server`, `db`, decoys `lb`, `cache`, `queue`.

- `y2-api`: edge(client, server) [one small endpoint; nothing here needs balancing]. Moves: place server, connect client-server.
- `y2-store`: pathVia(client, db, server). Moves: place db, connect server-db.
- `y2-small`: maxParts(5) [canonical: client, cdn, blob, server, db; the hint asks what traffic all that machinery is for]. Moves: none.

### c5-03, track 5: "The notification fan-out" (difficulty 2, 2 stages)

A queue-family re-skin on the app side: same muscles as the checkout, different story, plus the provider-isolation lesson. Concepts: `queues` and `idempotency` (resolve against `concepts.ts`).

**Stage 1, ping the author** (when someone comments, the author gets a push; the app must never wait on the push provider). Pre-placed: `client`, `lb`, `server`; pre-wired: client-lb, lb-server. Tray: `db`, `queue`, `worker`, `ext-api`.

- `n1-data`: pathVia(client, db, server). Moves: place db, connect server-db.
- `n1-hand`: pathVia(server, worker, queue). Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `n1-push`: pathVia(server, ext-api, worker) [only the worker waits on the provider]. Moves: place ext-api, connect worker-ext-api.

**Stage 2, the 9am burst** (digest hour; one worker cannot keep up). Tray: `worker`, decoy `replica`.

- `n2-two`: placed(worker, atLeast 2). Moves: place worker.
- `n2-share`: eachConnected(worker, queue) [every worker pulls from the same queue]. Moves: connect worker-queue.
- `n2-push`: eachConnected(worker, ext-api). Moves: connect worker-ext-api.
- `n2-decoy`: notPlaced(replica). Moves: remove replica.

### c9-03, track 9: "The webhook flood" (difficulty 3, 2 stages)

The hard queue re-skin: terser requirements, two decoys, tight budget. The `client` chip is framed by the scenario as the partner's system delivering webhooks. Concepts: `queues` and `idempotency` (resolve against `concepts.ts`).

**Stage 1, ack fast, lose none** (a partner delivers bursts of webhooks; acknowledge immediately, process later, never inline). Pre-placed: `client`, `lb`; pre-wired: client-lb. Tray: `server`, `queue`, `worker`, `db`.

- `w1-in`: pathVia(client, server, lb). Moves: place server, connect lb-server.
- `w1-ack`: pathVia(server, worker, queue). Moves: place queue, place worker, connect server-queue, connect queue-worker.
- `w1-store`: edge(worker, db). Moves: place db, connect worker-db.
- `w1-noinline`: noEdge(server, db). Moves: none (canonical never draws it; the level-3 hint falls back to `hintPoint.text`, which names the action).

**Stage 2, Friday burst** (one worker drowns). Tray: `worker`, decoys `cache` and `replica`.

- `w2-two`: placed(worker, atLeast 2). Moves: place worker.
- `w2-pull`: eachConnected(worker, queue). Moves: connect worker-queue.
- `w2-write`: eachConnected(worker, db). Moves: connect worker-db.
- `w2-budget`: maxParts(7) [canonical: client, lb, server, queue, 2 workers, db; covers both decoys]. Moves: none.

### c9-04, track 9: "The standby" (difficulty 2, 2 stages)

The deliberate contrast with c9-02: same parts, opposite wiring. A replica can serve reads or serve as a standby, and knowing which you built is the lesson; the sayIt lines must name the contrast explicitly. Concepts: the replica card and the nearest backups/resilience card (resolve against `concepts.ts`).

**Stage 1, the orders app** (plain and correct). Pre-placed: `client`, `lb`; pre-wired: client-lb. Tray: `server`, `db`.

- `b1-api`: pathVia(client, server, lb). Moves: place server, connect lb-server.
- `b1-data`: pathVia(client, db, server). Moves: place db, connect server-db.

**Stage 2, Friday 6pm, the database died** (never lose the data again; reads are fine as they are, keep it simple). Tray: `replica`, decoys `cache` and `worker`.

- `b2-copy`: edge(db, replica) [a copy that keeps itself up to date]. Moves: place replica, connect db-replica.
- `b2-standby`: noEdge(server, replica) [the copy is for surviving, not for speed; c9-02 wires the opposite on purpose]. Moves: none (hint falls back to `hintPoint.text`).
- `b2-lean`: maxParts(5) [canonical: client, lb, server, db, replica; covers both decoys]. Moves: none.

## Milestones

- **M-BM1, engine and schema.** Part A and part B land with full tests; `validateCapstone` wired into content validation; both capstones authored as data and passing it. No UI. Acceptance: `npm test` covers every predicate op and the solvability runner; content tests (emoji, em-dash, markdown) scan `capstones.ts`.
- **M-BM2, playable board.** Part C without part D: placement, edges, check strip, instant grading on Run it, hints, stage flow, progress and XP persistence, entry from the track path, abandon and resume (cleared stages persist, current stage restarts). Acceptance: c5-01 completable end to end at 390x844 by taps alone; lint and build pass; no dependency added.
- **M-BM3, motion and sound.** Part D exactly as specified, including reduced-motion behavior and the summary's static build render. Acceptance: a full run animates in under 2.5s; every effect uses only transform and opacity; reduced motion verified with both the OS setting and the in-app toggle; c9-01 shipped.
- **M-BM4, refinements (F1 + F2).** The `eachConnected` op with tests and trace behavior; the c5-01 check changes and tidiness bonus; the `debrief` field authored for c5-01 and c9-01; `canonicalBuild` in the engine; the reference-build panel on stage clear and on the summary. Acceptance: replaying c5-01 stage 2 with one cache-less server now fails with the unwired server highlighted; the debrief panel is unreachable before a stage clears; lint, tests and build pass.
- **M-BM5, capstones three and four (F3).** c8-01 and c9-02 authored with debriefs, passing `validateCapstone`; track 8's path shows its first capstone station. Acceptance: both completable end to end at 390x844; content tests scan them; no code changes beyond content unless the station rendering genuinely needs one.

## Part G: watch it run (v1.6)

The green run is the mode's best moment, and today it plays exactly once per stage. Users want to replay it for pure satisfaction, and satisfaction is a legitimate feature (docs/00: an app that does not get opened teaches nothing).

- In a stage's **cleared** state (the clear line is showing, "Next stage" or the finish is available), a secondary button "Re-run" takes the left half of the button bar and the way on takes the right. The bar holds one button while the stage is being built and two once it is won, so the replay costs the board no vertical room of its own. Tapping it replays the full visual run on the current build over every check authored so far: rings empty, the packet convoy walks each route, rings refill, the final cascade plays. It is theater on demand, so: **no sound, no haptics, no XP, no persisted change of any kind**, and grading is not re-consulted for state (re-planning the run from the build is fine, it is pure).
- Repeatable without limit; the button disables while a run is animating (replay or original).
- Reduced motion: the button does not render. There is nothing to watch; rings already resolve by fade.
- Scope stays the capstone screen's cleared state. If reopening a completed capstone lands on a playable final-stage cleared state, the button is simply there too; do not build a separate summary replay in this wave.

Milestone **M-BM6**: Part G alone. Acceptance: replay changes nothing in localStorage; a replay is silent; the packet driver and ring animations are reused, not duplicated; lint, tests and build pass.

- **M-BM7, library wave one.** The `difficulty` field with its station display, and c5-02, c8-02, c8-03 authored with debriefs, passing `validateCapstone`. Acceptance: content tests scan the new entries; the station shows difficulty; lint, tests, build pass.
- **M-BM8, library wave two.** c5-03, c9-03, c9-04 authored with debriefs, passing `validateCapstone`. Acceptance: same bar; the c9-02/c9-04 sayIt contrast is present in both directions.

## V2 ideas (do NOT build now)

Drag placement from tray to lane (tap stays the co-equal path; edge drawing stays tap-tap); directed edges with arrowheads and direction-aware predicates; a failure drill (tap a part to kill it and re-run the checks); capstone entries in the review pile; freeform check authoring beyond the eight ops.
