# 02, Exercise types

Eight mechanics, all touch-only. Each is a distinct renderer component keyed by `type` (see data schemas). Shared frame for all types: prompt area (may include a syntax-highlighted code block), the concept chip, answer area, "I'm not sure" button, feedback panel.

Code blocks: mobile-legible mono font ≥ 13px, horizontal scroll _within the block_ if needed, max ~18 visible lines (taller blocks scroll vertically inside the block). Syntax highlighting via a lightweight highlighter (see architecture doc).

---

## 1. `mcq`, Multiple choice

The workhorse. Prompt (text and/or code) + 2–4 options, single correct. Tap to select → option locks in and grades immediately (no separate confirm button, fewer taps).

Grading nuance: options can carry per-option feedback (`whyWrong`) shown when that specific wrong option is picked. Misconception-targeted, e.g. picking O(n²) for nested-loop-over-different-arrays gets "Careful. The loops run over _different_ inputs, so it's O(n·m), not O(n²)."

Used for: output prediction, Big-O identification, concept checks, "what does the interviewer mean by…", system design tradeoffs.

## 2. `parsons`. Build the solution (drag lines into order)

The closest thing to writing code on a phone. Given a goal ("Make change with the fewest coins. Greedy"), shuffled code lines appear as draggable pills; user drags them into a solution area in order. Indentation is **pre-rendered on each pill** (pills carry their own indent level). V1 does not make the user choose indentation.

- 5–9 lines per puzzle. Up to 2 **distractor lines** allowed (marked in data; correct solution never includes them); distractors encode classic mistakes (e.g. `amount =- coin` vs `amount -= coin`, or a loop condition that's off by one).
- Grading: order must match exactly (single canonical order in v1. Author puzzles so only one order is valid). "Check" button appears once all non-distractor slots are used… simpler rule: user taps **Check** whenever ready; wrong lines/positions shake and highlight, user can retry twice before reveal.
- Feedback on reveal shows the correct solution _as real formatted code_ with a 2–3 sentence walkthrough.

Interaction: implement with pointer events or `@dnd-kit` (architecture doc). Must also support tap-to-move (tap a pill → tap a slot) as a fallback for accessibility and finicky mobile browsers.

## 3. `spot-bug`, Tap the buggy line

A code block where each line is tappable. Prompt: "This should X but does Y. Tap the line with the bug." One correct line. Wrong tap: that line highlights amber with a hint sentence ("this line is fine. It does Z"); 2 wrong taps → reveal.

Used for: off-by-one, `==` vs `===`, mutation bugs, async mistakes (`forEach` + `await`), closure-in-loop with `var`.

## 4. `blank`, Fill in the blank

Code with 1–3 `____` gaps; below, a word-bank of tap-able tokens (correct tokens + distractors). Tap token → fills next empty gap (or tap a gap first to target it; tap a filled gap to clear). "Check" grades all gaps at once, per-gap right/wrong coloring.

Used for: API recall (`reduce((acc, x) => …, 0)`), TS type annotations, regex pieces, SQL-ish system design snippets.

## 5. `complexity`, Name the growth

Specialized MCQ with a fixed, always-identical option set so the answers become reflex: **O(1) · O(log n) · O(n) · O(n log n) · O(n²)** (plus O(n·m) only when relevant). Prompt is a code snippet or a plain-English description ("we check every pair of items…").

Twist that regular MCQ doesn't have: after a correct answer, the feedback panel always shows the **"say it like this"** line. E.g. _"It grows linearly. Double the input, double the work."_, because the user's real gap is saying it out loud. This phrase field is mandatory in the content schema for this type.

## 6. `ladder`. Refactor ladder (pick the next move)

Trains the staged interview ("make it work → right → fast → typed"). Shows current code + situation ("It works. The interviewer asks: what would you improve first?"). Options are _moves_, not code: "Name the magic number", "Replace the nested loop with a Set lookup", "Add types to the parameters", "Extract the validation into a function". One best next move (per-option `whyWrong` explains why the others are premature or wrong order. E.g. "Good idea, but optimize _after_ it's correct").

A ladder exercise is standalone in v1 (one snapshot, one best move). Multi-step chained ladders are a v2 idea; the content schema leaves room via `ladderStep`/`ladderId`.

## 7. `match`, Decoder pairs

Two columns (or a shuffled grid of pairs on small screens): interviewer phrase ↔ concept term. Tap one from each side to pair; correct pairs lock green, wrong pairs shake apart. 3–5 pairs per exercise.

Used mainly by Track 6: _"a function that remembers" ↔ closure_, _"grows linearly" ↔ O(n)_, _"only one instance ever" ↔ singleton_, _"don't repeat that network call" ↔ memoize/cache_. Also used for system design (component ↔ responsibility).

## 8. `steps`, Order the plan

Parsons for _prose_: drag 4–6 plan steps into the right order. No code.

Used for: the system design interview script ("clarify requirements → estimate scale → sketch high-level boxes → deep-dive one component → discuss tradeoffs"), incident debugging order, the make-it-work-make-it-right ladder as an ordering exercise, "how to start a whiteboard problem" (restate → example → brute force out loud → pattern → code plan).

---

## Shared grading + copy rules

- Exactly one attempt semantic per type as specified above; when attempts are exhausted → reveal + explanation + re-queue in session + Leitner box drop.
- Feedback copy tone: warm, brief, never sarcastic, never "Incorrect!". Correct-answer affirmations rotate from a small pool ("That's the one", "Second nature yet?", "Interviewer nods").
- Every exercise's `explanation` field is shown in the feedback panel every time, on a miss and after a correct answer alike. Getting it right is when the reasoning is cheapest to take in, so it is not something the user has to ask for.
- All randomization (option shuffle, parsons shuffle) must be re-derived per presentation, not baked into content.
