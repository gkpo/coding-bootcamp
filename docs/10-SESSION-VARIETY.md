# 10, Session variety (v1.2)

Two changes driven by real use: daily sessions repeat the same few exercises for days, and the fixed bank needs breadth exactly where novelty matters. Part A is an engine fix, part B is a small schema addition, part C is a content wave. Part A ships first and alone if needed; it is the highest-value change in this doc.

## Part A: composer fix (engine, no content changes)

Diagnosis, from the current `sessionComposer.ts`: the frontier is "unmastered items in authored order", and mastery is box >= 4. An item answered correctly yesterday is unmastered, not due, and therefore back in the frontier today; the same few items recur daily until they graduate. The decoder slot always picks the first unmastered decoder item, so it is identical every session. Composition is deterministic per (progress, today), so a second session the same day deals nearly the same hand.

New rules. Re-exposure belongs to spaced repetition alone; the frontier's job is only to introduce:

1. **Frontier = unseen only.** Tier one of `frontierOf` becomes items with no progress record (never presented). Seen-but-unmastered items are not frontier; they come back through the review stage when due. Keep authored order within a track.
2. **Review stage unchanged** (<= 3 due items, most overdue first). The existing backlog fallback (fill from due items when nothing unseen is left anywhere) stays: sessions must never come up short just because everything has been seen once.
3. **Decoder slot rotates.** Prefer unseen decoder items in authored order; when all are seen, pick a *due* one if any; otherwise rotate deterministically by day (index derived from the day key) so it changes daily instead of pinning to the first unmastered.
4. **Second session the same day is new material.** This follows from rule 1 (today's items now have progress records and drop out of the frontier), but add a test asserting that two consecutive sessions on the same day share no frontier items while unseen material remains.
5. **Determinism stays.** Same (progress, today, seed) still composes the same set; the variety comes from progress moving, not from randomness.

Update the composer's doc comment and `docs/01`/`docs/05` sentences that define the frontier ("first unmastered" becomes "first unseen"). Unit tests to add or adjust: unseen-only frontier, the same-day property above, decoder rotation across three simulated days, and the everything-seen fallback still filling a session.

Expected feel after the fix: a session is mostly material you have never seen, plus a few due reviews, and the review pile (not the frontier) is what brings misses back. With 142 exercises and ~5 new per day, the bank introduces fresh material for roughly a month before reviews dominate, and part C extends that.

## Part B: prompt variants (schema + renderer, small)

`docs/01` already promises variant-aware reviews; the schema never grew the field. Add the minimal version:

- `ExerciseBase.promptVariants?: string[]`: alternate phrasings of the prompt, same answer, same options, same code. The renderer picks among `[prompt, ...promptVariants]` using the per-presentation seed.
- Validator: variants must be non-empty strings, and the markdown-subset test covers them.
- Authoring rule: variants are for exercises whose prompt is a *problem statement or riddle* (statement-to-pattern mcqs, decoder-adjacent mcqs). Mechanics drills (parsons, blank, spot-bug) do not need them; their repetition is the point.

This is deliberately prompt-only. Variant option sets or variant code are not worth the authoring and grading complexity.

## Part C: content wave 3 (~48 exercises, no new cards)

Breadth where transfer matters, authored under the existing schemas and the docs/09 variety rule. No new tracks, no new mechanics; every exercise links to an existing concept card. Ids continue each track's numbering (t2-25 onward, etc.).

| Block | Track | Count | Type | What to author |
| ----- | ----- | ----- | ---- | -------------- |
| Pattern breadth | t2 | 20 | mcq | Fresh statement-to-pattern items: 2-3 *new problem statements* for each of hash map, Set membership, sliding window, two pointers, frequency map, greedy, binary search, BFS, memoization. Draw statements from varied domains (logs, payments, chat, files, calendars, games) and give each 1-2 `promptVariants`. At least four items must be near-miss pairs in the spirit of t2-24: statements that *look like* one pattern and are another. |
| Complexity reps | t1 | 8 | complexity | Fresh snippets over the existing answer set: nested loop with early break, `Object.keys` in a loop, two pointers meeting (still linear), building a Set then looping (linear, not quadratic), recursion with one branch (linear depth), slice inside a loop, and two plain-English descriptions with no code. Mandatory `sayIt` as always. |
| Decoder depth | t6 | 8 | match + mcq | 5 new match exercises pairing *unused* phrasings of already-covered concepts (per the docs/09 rule: never reuse a pairing text verbatim), and 3 mcqs decoding longer interviewer sentences ("if I gave you a sorted copy, would that help?"). |
| New-track reps | t7/t8/t9 | 12 | mcq + spot-bug | 4 per track: fresh predict-the-output and spot-the-bug items over the concepts the tracks already teach (a second stale-closure shape, a different CORS scenario, a different N+1 shape, a 409-vs-422 status pick, an effect cleanup with a subscription instead of an interval). |

Lesson grouping: append to each track as new lessons of 3-5. Update `docs/03` (t1, t2, t6) and `docs/08` (t7-t9) manifests with the new rows so the manifests stay authoritative.

## Acceptance

- Composer: all part A tests green; playing two sessions back to back in the browser on one day shows disjoint frontier material; the decoder item changes across three consecutive days (simulate by advancing the clock or the day key in tests).
- Variants: an exercise with variants shows different prompts across presentations with different seeds (test at engine level, spot-check in browser).
- Content: bank totals ~190 exercises; validator green; docs/03 and docs/08 manifests match the shipped content; docs/09 rules hold (no verbatim reused pairing texts, no single-skin concepts among the new items).
- Existing ids, boxes and streak untouched; build, lint, all tests green; bundle stays within budget.
