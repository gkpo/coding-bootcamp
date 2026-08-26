# 09, Content re-skin (v1.1)

The v1 content leans too visibly on a handful of origin anecdotes: coin change as the one greedy lesson, a text-chunking ramp, and decoder riddles that always use one fixed sentence per concept. That has a pedagogical cost, not just a cosmetic one: drilling one surface story per concept teaches the story, not the mapping. This doc re-skins the affected items and adds a standing variety rule.

Ground rules for this change:

- **Exercise ids never change.** Re-skin prompt, code, options, pairs and explanations in place so Leitner progress carries over. Where an item's skill changes materially (noted below), it is acceptable that the user relearns it.
- Same schemas, same mechanics, same difficulty and concept links unless a row says otherwise.
- All existing content tests must stay green (no emoji, no em-dashes, markdown subset, validation).
- Update the corresponding rows in `docs/03-CONTENT-PLAN.md` so the manifest matches what ships.

## The standing variety rule (add to authoring rules)

One concept, several skins. No concept card's exercises may all share a single surface story, and no riddle phrase may be the only phrasing an exercise ever shows for its concept. Concept cards keep at least three `interviewerSays` phrasings where the concept is commonly asked. When authoring future content, prefer a new surface story over repeating one already used by that concept.

Also append this line to `CLAUDE.md` under "How to work in this repo": "One concept, several skins: do not let a single example or phrasing become the only way a concept appears; see docs/09-CONTENT-RESKIN.md."

## Track 2: greedy lesson (t2-02, t2-03, t2-04)

Coin change stays in exactly one exercise, because it is the canonical greedy problem and interviewers genuinely ask it. The other two move to different classic greedy skins so the lesson teaches the _pattern_ across stories.

- **t2-02 (mcq, keep skill):** keep the statement-to-pattern question and keep the money skin, but reword to a cash withdrawal: "An ATM must pay out an amount using the fewest banknotes." Same options and `whyWrong` intent (the trap option about inventing a one-off loop stays; it is the most valuable wrong answer in the app).
- **t2-03 (parsons, new skin):** replace the coin-change build with **interval scheduling**: given meetings sorted by end time, attend as many as possible (`if (start >= lastEnd)` take it, update `lastEnd`). Distractors: sorting by start time instead of end time (as a comment line or a wrong condition), and `>` vs `>=` on the boundary. Explanation states the greedy insight in plain words: always take the meeting that frees you earliest.
- **t2-04 (mcq, keep skill):** keep the "when greedy fails" counterexample but re-skin from coins to **postage stamps**: stamp values 1, 3 and 4 for postage 6 (greedy gives 4+1+1, best is 3+3). Same teaching: greedy needs a proof or a counterexample, and when it fails you reach for dynamic programming.
- **`greedy` concept card:** keep the till/change analogy (it is the clearest in plain words) but add interval scheduling to the example rotation in prose, and extend `interviewerSays` with "the most meetings you can attend" and "pay out with the fewest notes".

## Track 2: chunking lesson (t2-06, t2-07, t2-08)

Keep the staged ramp (ramps are a general interview format worth rehearsing) but give it a concrete real-world skin that is not "chunk arbitrary text at an arbitrary limit":

- **t2-06:** splitting a long alert message into SMS segments of at most 160 characters, cuts anywhere.
- **t2-07:** same, but never split a word across two messages; walk back to the last space.
- **t2-08:** same question as now (a single token longer than the limit, e.g. a long URL in the message), re-skinned to match.
- **`chunking` concept card:** re-title to "Splitting text at a limit"; keep the ribbon analogy; set the example to the SMS skin; `interviewerSays` keeps "split into pieces of at most N" and "without breaking words" and adds "fit it into fixed-size messages".

## Track 6: decoder variety (t6-01, t6-02, t6-11 and the decoder card)

The riddle mappings are correct and stay. The fix is that each concept must be recognizable from more than one phrasing, and the exercises should not lead with one canonical sentence per concept.

- **t6-01 (match):** replace the pair texts with alternate phrasings of the same four concepts: closure becomes "It keeps access to its variables after the outer function is gone", O(n) becomes "Double the input, double the time", hash map becomes "You pay memory to make lookups instant", queue keeps FIFO but phrased "Handled in the order they arrived".
- **t6-02 and t6-11 (match):** audit each pair; where a phrase duplicates the exact wording on the concept card's first `interviewerSays` entry, swap in a synonym phrasing. The card keeps the canonical phrase; the exercise trains a second one.
- **`decoder` concept card:** its phrase table lists at least two phrasings per concept (e.g. closure: "a function that remembers" and "survives its parent function"). The `sayThis` guidance is unchanged.
- **`closure` card:** `interviewerSays` grows to at least four phrasings, e.g. adding "it survives the function that created it" and "where does that variable live now?".
- **Big-O phrasing variety (t1 and the `big-o` card):** the `sayIt` fields stay canonical ("It grows linearly..."), that is deliberate: `sayIt` is the sentence to _produce_. But recognition items (t1-14 pairs, decoder pairs) should use varied phrasings like "scales with the input" so recognition does not hinge on one sentence.

## Explicitly not changed

- Coin change existing at all (canon), binary search, closures as a topic, the staged-ramp format: these are interview canon, not personal references.
- `sayIt` canonical sentences: one _production_ target per concept is the point.
- The README and vision doc: their examples read as generic engineer stories and they explain the product. If the repo ever goes properly public and this matters, rewording them is a five-minute follow-up, not part of this change.

## Acceptance

- No exercise or card text names a vending machine, a 200-character limit, or presents coin change in more than one exercise.
- t6-01 contains none of the four v1 phrase strings verbatim.
- Each of `closure`, `big-o`, `hash-lookup`, `greedy`, `chunking` has ≥ 3 `interviewerSays` phrasings and its exercises span ≥ 2 surface stories.
- `docs/03-CONTENT-PLAN.md` rows for t2-02, t2-03, t2-04, t2-06, t2-07, t2-08, t6-01 updated to match; CLAUDE.md carries the variety rule.
- Build, lint and all content tests green; ids and progress untouched.
