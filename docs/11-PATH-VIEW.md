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

The look to hit, here and in part C: calm, light, warm, confident (docs/06). One big friendly numeral, plenty of air, no icon soup, no dashboard. When something feels crowded, remove rather than shrink.

1. **Journey header**: the first element on the screen, above the track list. Standard card recipe (`--surface`, `--r-card`, 1px `--border`, `--shadow-card`, `--sp-4`/`--sp-5` padding). Anatomy, top to bottom:
   - Title "The whole path" at `--fs-heading` 600.
   - The hero figure, the one big friendly numeral this screen gets: exercises seen at `--fs-display` 700, tabular numerals, followed on the same baseline by "of N exercises seen" at `--fs-secondary` in `--text-dim`. No icon next to it, no illustration.
   - A whole-bank progress bar directly under the numeral: reuse the existing `ProgressBar` component with `--accent` as its colour (the app-wide accent; track colours belong to tracks). Same 6px two-layer anatomy, `aria-hidden` with the counts printed as text, exactly like the track cards.
   - Figures line at `--fs-secondary`, `--text-dim`, tabular numerals, mid-dot separators like the existing bar labels: "Y mastered · Z of M concepts known". "Known" reuses the Sheets rule verbatim: a card is known when every exercise linking to it is mastered. Derive it the same way SheetsScreen does; if that means extracting a small shared helper, extract it rather than copying the loop.
   - Forecast sentence at `--fs-body` in `--text`, three states, durations from `formatDuration`:
     - In progress: "At your recent pace the last new exercise is about 3 weeks away. Mastery follows about 11 days behind, one review at a time." When `assumedDailyPace`, open with "At a session a day" instead.
     - Everything seen: "You have seen everything once. About 11 days of reviews stand between here and the last mastery."
     - Everything mastered: "Everything mastered. Reviews keep it warm from here."
   - Voice per docs/06: short, warm, adult. No exclamation marks, no em-dashes, no emoji.
2. **Next-up line** on each track card, under the progress bar row: "Next up:" in `--text-dim` followed by the lesson title in `--text` at 600, both `--fs-secondary`. One line, ellipsis on overflow. When the whole track is seen: "All seen. Reviews take it from here." in `--text-dim` throughout.

No other layout rework: the existing cards, icon chips and two-layer bars stay exactly as they are.

## Part C: track detail becomes a path (`TrackDetailScreen`)

Lessons become stations on a vertical spine. Per station, top to bottom: node and title row, concept chips, then the existing per-exercise rows (state dot, type label, difficulty pips), which stay unchanged.

Layout: each station is a flex row, a fixed 28px rail column plus the station card (`flex: 1`, `min-width: 0`), with the existing `--sp-3` stack gap between stations. The card keeps the standard card recipe.

- **Nodes**: a 28px circle in the rail, its vertical center aligned with the center of the lesson title's first line. Get that alignment by eye at 390px, not by arithmetic alone; a node floating above or sagging below its title is the single fastest way to make this screen look broken. Number at 13px, 600, tabular. States:
  - untouched: `--surface` fill, 2px `--border` stroke, number in `--text-dim`.
  - any exercise seen: fill with exactly the progress bar's seen-layer recipe, `color-mix(in srgb, <track colour> 28%, var(--surface-2))` (lift it from `ProgressBar.tsx`, do not invent a new mix), no visible stroke, number in `--text`.
  - all exercises mastered: full track colour fill, the drawn `CheckIcon` at ~14px in `--surface` instead of the number. Never a glyph character.
- **Spine**: a 2px `--border` line centered in the rail, connecting node to node. It must run unbroken through the gaps between cards, never poke above the first node or below the last, and butt cleanly against the circles. If the line visibly stutters at card boundaries, fix the geometry, do not fake it with dashes.
- **"You are here"**: the first lesson with an unseen exercise gets a pill in the title row: 12px 600 `--text` on a `color-mix(in srgb, <track colour> 10%, var(--surface))` tint, `--r-pill`, roughly 3px 10px padding. Deliberately not track-coloured text: docs/06 reserves full-strength track colour for icons, fills and 15px+ bold text, and 12px text in it would flirt with AA failure. The node beside it already carries the colour. At most one pill per track; none once the whole track is seen. If the title plus pill overflows 390px, the pill wraps below the title whole; it never squashes or truncates.
- **Concept chips**: the lesson's distinct concepts (dedupe within the lesson, keep first-appearance order), each a chip linking to `/sheets/{id}`: the concept's drawn icon at 16px inheriting text colour, then the card title, `--fs-secondary` 600, on `--surface-2` with a 1px `--border`, `--r-pill`, min-height 44px, ~12px horizontal padding, 6px icon-to-text gap. This is the sheets related-chip recipe moved onto a card surface; keep them visually identical apart from the background. The row wraps with `--sp-2` gaps and sits between the title row and the exercise list with `--sp-3` above and below. Concepts repeating across lessons is correct and wanted: a later lesson that revisits hash lookups shows that chip again.
- Everything on the path remains tappable; nothing is locked, dimmed into illegibility, or blurred.
- Track colour rules from docs/06 hold: colour lives in the nodes and the bars, never on a card edge. No new motion: nodes and the pill do not animate; the only transitions on this screen are the ones the progress bar already owns, which respect reduced motion.

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

### The visual pass (do this in the browser, at 390x844, before committing)

These are the specific ways this design goes ugly. Walk every track detail and the overview once, looking for each:

- The spine stutters or breaks at card boundaries, or a stub of line sticks out above station one or below the last station.
- A node sits visibly off the center of its title line, on any station, including one whose title row wrapped.
- The longest lesson title plus the pill: the pill must wrap below whole, never compress, truncate or push the title into the rail.
- A one-chip lesson and a four-chip lesson both look intentional; wrapped chip rows keep even gaps; no chip ever breaks across lines.
- A track with seven or more lessons scrolls smoothly with the rail staying aligned the whole way down.
- The journey header with zero progress: the display numeral reads "0" and still looks composed, not broken; with every exercise mastered, the done copy fits without the card growing awkward.
- Squint test on the overview: the header's numeral, then the accent bar, then the track cards should be the reading order. If the forecast sentence competes with the numeral, the type is too big.
- Reduce motion on: nothing on either screen still animates.
