# 11, The path view (v1.3)

One piece of user feedback drove this doc: progress is visible but the territory is not. The app shows bars and counts, yet nowhere can the user see the whole journey: which concepts exist, in what order they will arrive, where they stand on the arc, and roughly how far mastery is. This doc turns the Tracks tab into that view.

It is a presentation feature. Every fact it shows already exists in content and progress data; there are no persistence changes, no schema changes, and no composer changes in this wave.

## Decisions already made with the user (do not reopen)

1. **The roadmap lives in the Tracks tab.** No new tab (the bar stays at 5 items), no separate screen. The Tracks overview gets a journey header and next-up lines; each track detail becomes a vertical path.
2. **It includes a pace forecast**, computed honestly from what the app actually knows (part A). The forecast states its assumption in the copy and never promises a date, only a rough distance.
3. **Upcoming content is fully named.** Lessons and concepts ahead are readable and tappable from day one. Nothing is gated, consistent with the rest of the app: the path describes the recommended order, it never locks it.

## Part A: forecast engine (`src/engine/forecast.ts`, new)

Grounding facts, verified against the current code: `ExerciseProgress` carries no timestamps, so the only activity history is `xp.byDay` (a `DayKey` to XP record on the persisted store). The composer introduces at most `TARGET_FRONTIER + MAX_DECODER` (currently 5) new exercises per completed daily session. The fastest ladder from first seen to mastered climbs boxes 1, 2 and 3 in a row, so `BOX_INTERVALS[1] + BOX_INTERVALS[2] + BOX_INTERVALS[3]` (currently 11) days pass between first sight and the earliest possible mastery. The forecast derives everything from these. Do not persist new fields for it.

Pure module: no React, no DOM (docs/05 engine purity), deterministic given its inputs.

- `NEW_PER_ACTIVE_DAY`: import and sum the composer constants, do not restate the number.
- `MASTERY_TRAIL_DAYS`: sum of `BOX_INTERVALS` 1 through 3, imported, not hardcoded.
- `practiceRatio(xpByDay, today)`: fraction of recent calendar days with any XP, in (0, 1]. Window: the last 14 days, or the shorter span from the earliest recorded day through today. Guards, both returning 1 (assume daily practice rather than extrapolate from noise): no recorded days at all, or an observed span under 3 days. Days with zero or missing XP count as inactive.
- `forecast({ exerciseIds, progress, xpByDay, today })` returns `{ unseen, unmastered, daysToSeeAll, daysToMasterAll, assumedDailyPace }`:
  - `unseen`: exercises with no progress record or `seen === 0`.
  - `unmastered`: exercises not mastered (`box < MASTERED_BOX`), unseen ones included.
  - pace = `NEW_PER_ACTIVE_DAY * practiceRatio(...)`.
  - `daysToSeeAll`: 0 when nothing is unseen, else `ceil(unseen / pace)`.
  - `daysToMasterAll`: 0 when nothing is unmastered, else `daysToSeeAll + MASTERY_TRAIL_DAYS`.
  - `assumedDailyPace`: true when a ratio guard fired, so the copy can say "at a session a day" instead of pretending to know the user's pace.
- `formatDuration(days)`: plain-words duration for the copy, with exact boundaries so the tests are mechanical:
  - `days < 14`: `"N days"`, with `"a day"` for 1.
  - `days < 70`: `round(days / 7)` weeks, `"a week"` for 1, else `"N weeks"`.
  - otherwise: `round(days / 30)` months, `"a month"` for 1, else `"N months"`.
  - Never called with 0: callers handle the done states before formatting. The string carries no "about"; the sentence adds it.

Tests (`forecast.test.ts`): ratio is 1 on a fresh profile; ratio is about 0.5 for 7 active days out of 14; the short-span guard; `daysToSeeAll` arithmetic including the ceiling; both done states return 0; `assumedDailyPace` in both directions; `formatDuration` at the boundaries (1, 13, 14, 69, 70 days).

Honesty rule: the model is a straight line and the copy says so ("at your recent pace"). If it reads too optimistic or too pessimistic in use, tune the copy, never reach for a fancier model.

## Part B: Tracks overview (`TracksScreen`)

1. **Journey header**: one card above the track list.
   - Title: "The whole path".
   - Figures line (secondary text, tabular numerals, mid-dot separators like the existing bar labels): "X of N exercises seen · Y mastered · Z of M concepts known". "Known" reuses the Sheets rule verbatim: a card is known when every exercise linking to it is mastered. Derive it the same way SheetsScreen does; if that means extracting a small shared helper, extract it rather than copying the loop.
   - Forecast sentence, three states, durations from `formatDuration`:
     - In progress: "At your recent pace the last new exercise is about 3 weeks away. Mastery follows about 11 days behind, one review at a time." When `assumedDailyPace`, open with "At a session a day" instead.
     - Everything seen: "You have seen everything once. About 11 days of reviews stand between here and the last mastery."
     - Everything mastered: "Everything mastered. Reviews keep it warm from here."
   - Voice per docs/06: short, warm, adult. No exclamation marks, no em-dashes, no emoji.
2. **Next-up line** on each track card: the first lesson in authored order containing an unseen exercise gives "Next up: {lesson title}". When the whole track is seen: "All seen. Reviews take it from here." Placed under the progress bar row, secondary size and colour.

No other layout rework: the existing cards, icon chips and two-layer bars stay as they are.

## Part C: track detail becomes a path (`TrackDetailScreen`)

Lessons become stations on a vertical spine. Per station, top to bottom: node and title, concept chips, then the existing per-exercise rows (state dot, type label, difficulty pips), which stay.

- **Spine and nodes**: a 2px `--border` line down a fixed left rail connects one node per lesson. Node: 28px circle carrying the lesson's number. States:
  - untouched: `--surface` fill, `--border` stroke, number in `--text-dim`.
  - any exercise seen: fill with the same ~28% track-colour mix the progress bar's seen layer uses; number in `--text`.
  - all exercises mastered: full track colour fill, the drawn check icon (`CheckIcon`) instead of the number. Never a glyph character.
- **"You are here"**: the first lesson with an unseen exercise gets a pill beside its title: track-colour text on a ~10% track-colour tint, full radius. At most one per track; none once the whole track is seen.
- **Concept chips**: the lesson's distinct concepts (dedupe within the lesson, keep first-appearance order), each a chip with the concept's drawn icon and title, linking to `/sheets/{id}`. Reuse the sheets related-chip recipe (min-height 44px, pill radius, 1px border) adapted to sit on the card surface. Concepts repeating across lessons is correct and wanted: a later lesson that revisits hash lookups shows that chip again.
- Everything on the path remains tappable; nothing is locked, dimmed into illegibility, or blurred.
- Track colour rules from docs/06 hold: colour lives in the nodes, the pill and the bar, never on a card edge.

## Docs to update alongside

`docs/01` screen map, the Tracks line: "Tracks (browse 6 tracks → lessons → exercises)" becomes "Tracks (the path: browse tracks → lesson stations → exercises)". Nothing else in docs/01 mentions the Tracks tab.

## Non-goals

- No gating, anywhere, in any form.
- No concept graph or map view (a possible Sheets idea for much later).
- No new persisted fields, no schema changes, no composer changes, no Home changes.

## Acceptance

- Engine: forecast tests green; the module imports nothing from React or the DOM.
- Fresh profile at 390x844: the header shows the full bank with the "at a session a day" opening; every track card names its first lesson as next up; each track detail shows the pill on its first lesson, hollow numbered nodes, and named concept chips that navigate to the right sheet.
- After playing a session or two: node states advance, the pill sits on the first lesson with unseen material, next-up lines and header figures move, and the forecast shrinks.
- The everything-seen and everything-mastered copy states verified once in a dev check (temporary progress injection is fine; do not ship it).
- Touch targets at least 44px for chips and every other tappable; text contrast passes AA; `npm run build`, `npm run lint`, `npm test` green; no emoji and no em-dashes in code, copy or docs.
