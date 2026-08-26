# 03, Content plan

Six tracks, 100 exercises, 35 concept cards. This manifest is the authoring contract: the implementing agent writes the full content (prompts, snippets, options, distractors, explanations, card text) but every row below must exist with the stated type, track, difficulty (1–3), and concept link. IDs are stable. Progress data keys off them.

Authoring quality bar (applies to everything):

- Wrong options are _plausible misconceptions_, each with a `whyWrong` where the schema allows.
- Explanations: 2–4 sentences, plain words first, formal term second.
- Code snippets: modern JS/TS (const, arrow functions, template literals), ≤ 18 lines, self-contained, no imports unless the import is the point.
- `complexity` exercises must fill the mandatory "say it like this" phrase.
- Difficulty 1 items must be answerable straight from the linked concept card.

---

## Track 1. Big-O & optimization talk 📈 (18 exercises)

Goal: see code → name its growth → _say it_ the way interviewers expect. Directly targets the "it grows linearly" failure.

| ID    | Type       | Diff | Exercise (what it tests)                                                                                                  | Concept card   |
| ----- | ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------- | -------------- |
| t1-01 | mcq        | 1    | "Double the input, what happens to the work?" intuition warm-up, no notation yet                                          | big-o          |
| t1-02 | complexity | 1    | Single `for` loop summing an array → O(n)                                                                                 | big-o          |
| t1-03 | complexity | 1    | Array index access / object key lookup → O(1)                                                                             | big-o          |
| t1-04 | complexity | 1    | Nested loop over same array (all pairs) → O(n²)                                                                           | big-o          |
| t1-05 | complexity | 2    | Two _sequential_ loops → still O(n) (not O(2n), not O(n²))                                                                | big-o          |
| t1-06 | complexity | 2    | Loop over A nested in loop over B → O(n·m)                                                                                | big-o          |
| t1-07 | complexity | 2    | Halving loop / binary search → O(log n)                                                                                   | log-n          |
| t1-08 | complexity | 2    | Sort then scan → O(n log n) dominates                                                                                     | sort-cost      |
| t1-09 | mcq        | 2    | `includes` inside a loop is a hidden O(n²). Spot the hidden loop                                                          | hidden-loops   |
| t1-10 | spot-bug   | 2    | Tap the line that makes it quadratic (`indexOf` in a loop)                                                                | hidden-loops   |
| t1-11 | mcq        | 2    | Fix t1-10: which change makes it O(n)? (Set lookup)                                                                       | hash-lookup    |
| t1-12 | complexity | 2    | Recursive fib without memo → exponential (option set extended)                                                            | memoization    |
| t1-13 | mcq        | 2    | Space vs time: the Set fix costs O(n) memory. What did we trade?                                                          | space-time     |
| t1-14 | match      | 1    | Pair notation ↔ plain phrase: O(1)↔"constant", O(n)↔"linear", O(log n)↔"halves each step", O(n²)↔"all pairs"              | big-o          |
| t1-15 | mcq        | 3    | Amortized push on dynamic array. Why "usually O(1)" is the accepted answer                                                | amortized      |
| t1-16 | complexity | 3    | String concat in a loop (immutable strings) → O(n²)                                                                       | hidden-loops   |
| t1-17 | mcq        | 3    | Which input size makes O(n²) fine? (n≈100 vs n≈10⁶. Pragmatism talk)                                                      | pragmatic-perf |
| t1-18 | steps      | 2    | Order the interviewer script: state current complexity → identify bottleneck → propose structure → restate new complexity | perf-script    |

## Track 2. Algorithm patterns 🧩 (24 exercises)

Goal: read a problem statement → name the pattern in under a minute. Includes two problems that show up in real interviews (coin change, text chunking) as flagship lessons.

| ID    | Type     | Diff | Exercise                                                                                                   | Concept card      |
| ----- | -------- | ---- | ---------------------------------------------------------------------------------------------------------- | ----------------- |
| t2-01 | mcq      | 1    | Problem statement → which pattern? (find pair summing to X → hash map)                                     | hash-lookup       |
| t2-02 | mcq      | 1    | "Fewest coins for an amount" → greedy (the vending machine problem, named and demystified)                 | greedy            |
| t2-03 | parsons  | 2    | Build greedy coin change (sorted denominations, `while amount >= coin`)                                    | greedy            |
| t2-04 | mcq      | 2    | When greedy coin change _fails_ (denominations 1,3,4 for amount 6) → why DP exists                         | greedy            |
| t2-05 | mcq      | 2    | Statement → pattern: "longest substring without repeats" → sliding window                                  | sliding-window    |
| t2-06 | parsons  | 2    | Build fixed-size chunking: split text every 200 chars (stage 1 of the classic staged ramp)                 | chunking          |
| t2-07 | parsons  | 3    | Chunking stage 2: don't cut words. Walk back to last space (distractor: off-by-one slice)                  | chunking          |
| t2-08 | mcq      | 2    | Chunking stage 3 concept: what if a single word exceeds the limit? (edge-case reflex)                      | edge-cases        |
| t2-09 | mcq      | 1    | Statement → pattern: "is X a subset/duplicate/seen before" → Set                                           | hash-lookup       |
| t2-10 | parsons  | 2    | Build two-pointer palindrome check                                                                         | two-pointers      |
| t2-11 | mcq      | 2    | Statement → pattern: "merge two sorted lists" → two pointers                                               | two-pointers      |
| t2-12 | blank    | 2    | Fill the sliding window skeleton (window start/end, when to shrink)                                        | sliding-window    |
| t2-13 | mcq      | 2    | Statement → pattern: "count occurrences of each word" → map/frequency counter                              | frequency-map     |
| t2-14 | parsons  | 2    | Build frequency counter with `reduce` (distractor: missing initial value)                                  | frequency-map     |
| t2-15 | spot-bug | 2    | Off-by-one in a `slice`-based pagination function                                                          | edge-cases        |
| t2-16 | mcq      | 2    | Statement → pattern: "first non-repeating character" → two passes with a map                               | frequency-map     |
| t2-17 | mcq      | 3    | Statement → pattern: "can you reach the end / min steps" → BFS on states vs greedy                         | bfs-mental-model  |
| t2-18 | steps    | 2    | Order the whiteboard opening: restate → tiny example → brute force out loud → name pattern → plan          | whiteboard-script |
| t2-19 | parsons  | 3    | Build binary search (distractors: `mid = (lo+hi)/2` without floor, `lo = mid` infinite loop)               | log-n             |
| t2-20 | mcq      | 2    | Recursion vs iteration for tree traversal. What the interviewer is probing (call stack)                    | recursion         |
| t2-21 | blank    | 3    | Fill memoized fib (cache check line, cache write line)                                                     | memoization       |
| t2-22 | mcq      | 2    | Statement → pattern: "rate of events per rolling minute" → sliding window over time (bridges to real life) | sliding-window    |
| t2-23 | match    | 2    | Pair 5 statements ↔ 5 patterns (mixed review of the track)                                                 | pattern-map       |
| t2-24 | mcq      | 3    | Trick round: a statement that _looks like_ sliding window but is a frequency map. Reading carefully        | pattern-map       |

## Track 3. JS/TS language concepts ⚙️ (20 exercises)

Goal: the language-internals questions full stack interviews love, closures first (the most-asked of them).

| ID    | Type     | Diff | Exercise                                                                                                                                                                        | Concept card      |
| ----- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| t3-01 | mcq      | 1    | "A function that remembers". Predict output of a counter factory                                                                                                                | closure           |
| t3-02 | parsons  | 2    | Build `makeCounter()` closure (distractor: `let count` inside the inner function)                                                                                               | closure           |
| t3-03 | mcq      | 2    | Classic: `var` in a loop with `setTimeout`, what prints?                                                                                                                        | closure           |
| t3-04 | spot-bug | 2    | Fix intent: tap the `var` that should be `let` in the loop                                                                                                                      | closure           |
| t3-05 | mcq      | 2    | `==` vs `===`. Predict output ( `'' == 0`, `null == undefined` )                                                                                                                | equality          |
| t3-06 | mcq      | 2    | Event loop order: sync log → promise.then → setTimeout. Predict print order                                                                                                     | event-loop        |
| t3-07 | mcq      | 3    | Event loop round 2: microtask chain vs two timers                                                                                                                               | event-loop        |
| t3-08 | mcq      | 2    | `this` in arrow function vs method shorthand. Predict output                                                                                                                    | this-binding      |
| t3-09 | spot-bug | 3    | `forEach` with `await` inside. Tap why nothing awaits                                                                                                                           | async-await       |
| t3-10 | mcq      | 2    | Fix t3-09: `for…of` vs `Promise.all`, which when? (sequential vs parallel)                                                                                                      | async-await       |
| t3-11 | blank    | 2    | Fill a debounce implementation (closure over timer id)                                                                                                                          | debounce-throttle |
| t3-12 | mcq      | 1    | Debounce vs throttle, which for a search input? which for scroll?                                                                                                               | debounce-throttle |
| t3-13 | mcq      | 2    | Reference vs value: mutate an object passed to a function. Predict                                                                                                              | reference-value   |
| t3-14 | spot-bug | 2    | Spread is shallow: tap the line where the nested object still gets mutated                                                                                                      | reference-value   |
| t3-15 | blank    | 2    | TS: fill parameter + return type annotations on a plain function (the typical "now add types" last stage)                                                                       | ts-annotations    |
| t3-16 | mcq      | 2    | TS: `interface` vs `type`. The accepted interview answer                                                                                                                        | ts-annotations    |
| t3-17 | mcq      | 3    | TS: generics in one question. Type a `first<T>(arr: T[])` correctly                                                                                                             | ts-generics       |
| t3-18 | mcq      | 2    | TS: `unknown` vs `any`. Why interviewers ask                                                                                                                                    | ts-annotations    |
| t3-19 | parsons  | 3    | Build memoize(fn) higher-order function (closure over cache Map)                                                                                                                | memoization       |
| t3-20 | match    | 2    | Pair phrase ↔ feature: "runs later, in order"↔microtask, "copies the top layer"↔shallow copy, "remembers its birthplace"↔closure, "decides `this` at call time"↔dynamic binding | event-loop        |

## Track 4. Refactoring & code quality 🪜 (12 exercises)

Goal: the staged-interview reflex: improve code out loud, in the right order.

| ID    | Type     | Diff | Exercise                                                                                                                                                   | Concept card          |
| ----- | -------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| t4-01 | steps    | 1    | Order the ladder: make it work → make it right → make it fast → add types                                                                                  | refactor-ladder       |
| t4-02 | ladder   | 1    | Working-but-messy function: best first move? (name magic numbers)                                                                                          | refactor-ladder       |
| t4-03 | ladder   | 2    | Duplicated logic in two branches: best move? (extract function)                                                                                            | dry                   |
| t4-04 | ladder   | 2    | Deep nesting: best move? (early return / guard clause)                                                                                                     | guard-clause          |
| t4-05 | parsons  | 2    | Rebuild a nested-if function as guard clauses                                                                                                              | guard-clause          |
| t4-06 | ladder   | 2    | Works but O(n²): interviewer asks "what next?". Correctness tests _before_ optimizing                                                                      | refactor-ladder       |
| t4-07 | mcq      | 2    | Which name is best? (`d` vs `data` vs `daysSinceLastLogin`), and why interviewers care                                                                     | naming                |
| t4-08 | spot-bug | 2    | Function does 3 jobs: tap the lines that belong in a different function                                                                                    | single-responsibility |
| t4-09 | ladder   | 3    | The already-written-bad-function interview: first _say_ what's wrong (it grows linearly / it re-reads the array), then fix, then types. Order the critique | refactor-ladder       |
| t4-10 | mcq      | 2    | Mutating a parameter array vs returning a new one, which and why (pure functions talk)                                                                     | pure-functions        |
| t4-11 | blank    | 2    | Fill the extracted-constant refactor (naming a magic number, TS `const` assertion)                                                                         | naming                |
| t4-12 | steps    | 3    | Order a live code review out loud: praise intent → correctness risk → readability → perf → style                                                           | review-script         |

## Track 5. System design foundations 🏗️ (14 exercises)

Goal: the full stack system design round: vocabulary + the walkthrough script, at the "senior generalist" depth, not distributed-systems-PhD depth.

| ID    | Type  | Diff | Exercise                                                                                                         | Concept card   |
| ----- | ----- | ---- | ---------------------------------------------------------------------------------------------------------------- | -------------- |
| t5-01 | steps | 1    | Order the design interview script: clarify → scale estimate → high-level boxes → deep dive → tradeoffs           | design-script  |
| t5-02 | match | 1    | Pair component ↔ job: load balancer, cache, queue, CDN, database                                                 | lb-cache-queue |
| t5-03 | mcq   | 2    | Read-heavy feed is slow. First lever? (cache) and which pattern (cache-aside, in plain words)                    | caching        |
| t5-04 | mcq   | 2    | Cache invalidation: TTL vs write-through. Tradeoff question                                                      | caching        |
| t5-05 | mcq   | 2    | Image upload endpoint times out. Queue + async worker (why not just raise the timeout)                           | queues         |
| t5-06 | mcq   | 2    | SQL vs NoSQL. The balanced senior answer (schema shape + query patterns, not hype)                               | sql-vs-nosql   |
| t5-07 | mcq   | 2    | Horizontal vs vertical scaling. Plain words + when each stops working                                            | scaling        |
| t5-08 | mcq   | 3    | Stateless services: why the load balancer needs it; where sessions go (the "sticky session" trap)                | scaling        |
| t5-09 | mcq   | 2    | Idempotency: user double-taps "Pay". What saves you (idempotency key, in plain words)                            | idempotency    |
| t5-10 | steps | 2    | Order a URL-shortener walkthrough (the classic) at senior-generalist depth                                       | design-script  |
| t5-11 | mcq   | 2    | Pagination: offset vs cursor. Why feeds use cursors                                                              | pagination     |
| t5-12 | mcq   | 3    | Rate limiting: where it lives and the token-bucket idea in plain words                                           | rate-limiting  |
| t5-13 | match | 2    | Pair failure ↔ mitigation: thundering herd↔jitter, hot key↔sharding, cascade↔circuit breaker, lost job↔retry+DLQ | resilience     |
| t5-14 | mcq   | 3    | "How would you scale this to 10× users?". Order of levers (measure first)                                        | scaling        |

## Track 6. Interview decoder & communication 🗣️ (12 exercises)

Goal: the meta-game itself. Interviewer riddles → canonical answers; what to say when stuck; how to not spiral (a lost interview is usually a spiral, not a knowledge gap).

| ID    | Type  | Diff | Exercise                                                                                                                                                                        | Concept card      |
| ----- | ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| t6-01 | match | 1    | Riddles: "a function that remembers"↔closure, "grows linearly"↔O(n), "instant lookup"↔hash map, "first in first out"↔queue                                                      | decoder           |
| t6-02 | match | 1    | Riddles 2: "only computed once"↔memoization, "fires at most once per second"↔throttle, "the browser's to-do list"↔event loop, "copy, don't touch the original"↔immutability     | decoder           |
| t6-03 | mcq   | 1    | Interviewer: "How does this scale?". What are they actually asking for? (complexity + bottleneck, in words)                                                                     | decoder           |
| t6-04 | mcq   | 2    | Interviewer: "Can you make this cleaner?". Decode (readability refactor, not perf)                                                                                              | decoder           |
| t6-05 | steps | 1    | You're stuck. Order the unstick script: say what you know → restate goal → propose brute force → ask one targeted question                                                      | stuck-script      |
| t6-06 | mcq   | 1    | The magic sentence when choosing brute force first ("I'll start simple so we have something working, then optimize"). Pick the best phrasing                                    | stuck-script      |
| t6-07 | mcq   | 2    | Interviewer hints ("what if the array was sorted?"). Hints are gifts: decode what pattern they're steering to                                                                   | hints             |
| t6-08 | mcq   | 2    | "Any edge cases?". The canonical checklist answer (empty, one, huge, duplicates, negative/unicode)                                                                              | edge-cases        |
| t6-09 | steps | 2    | Order the complexity answer: name it → plain words → the bottleneck line → the improvement                                                                                      | perf-script       |
| t6-10 | mcq   | 2    | When to abandon an approach: the 3-minute rule (the coin-change lesson, made explicit and kind)                                                                                 | stuck-script      |
| t6-11 | match | 2    | Riddles 3: "single source of truth"↔state management, "don't block the main thread"↔async/worker, "contract between front and back"↔API schema/types, "works offline"↔PWA/cache | decoder           |
| t6-12 | mcq   | 2    | "Walk me through your thinking". What good thinking-out-loud sounds like (pick the best transcript)                                                                             | whiteboard-script |

---

## Concept cards (35)

Format per card is defined in the product spec (plain words → analogy → "interviewer says…" → tiny example → "say this in the interview" → related). Cards to author, keyed by ID used above:

| ID                    | Title                                  | Track | Must-include "interviewer says…" phrases                           |
| --------------------- | -------------------------------------- | ----- | ------------------------------------------------------------------ |
| big-o                 | Big-O (how work grows)                 | 1     | "what's the complexity?", "how does this scale?", "grows linearly" |
| log-n                 | O(log n) & binary search               | 1     | "can you do better than linear?", "the input is sorted…"           |
| sort-cost             | The cost of sorting                    | 1     | "what does the sort cost you?"                                     |
| hidden-loops          | Hidden loops (includes/indexOf/concat) | 1     | "there's a hidden loop here"                                       |
| hash-lookup           | Hash maps & Sets (instant lookup)      | 1/2   | "instant lookup", "trade memory for speed"                         |
| space-time            | Space–time tradeoff                    | 1     | "what's the memory cost?"                                          |
| amortized             | Amortized cost (usually cheap)         | 1     | "why is push O(1)?"                                                |
| pragmatic-perf        | When performance matters               | 1     | "is this fast enough?", "premature optimization"                   |
| memoization           | Memoization (computed once)            | 1/3   | "only computed once", "cache the result"                           |
| perf-script           | Talking about performance              | 1/6   | : (it _is_ the script)                                             |
| greedy                | Greedy (take the best bite)            | 2     | "fewest coins", "locally best choice"                              |
| sliding-window        | Sliding window                         | 2     | "longest substring…", "rolling average"                            |
| chunking              | Chunking text & word boundaries        | 2     | "split into pieces of at most N"                                   |
| two-pointers          | Two pointers                           | 2     | "the array is sorted", "from both ends"                            |
| frequency-map         | Frequency counters                     | 2     | "count occurrences", "first non-repeating"                         |
| bfs-mental-model      | BFS/DFS in plain words                 | 2     | "shortest path", "explore all options"                             |
| recursion             | Recursion & the call stack             | 2     | "what happens on very deep input?"                                 |
| pattern-map           | The pattern cheat table                | 2     | : (meta-card: statement shapes → patterns)                         |
| edge-cases            | Edge cases checklist                   | 2/6   | "any edge cases?", "what if it's empty?"                           |
| whiteboard-script     | Opening a whiteboard problem           | 2/6   | "walk me through your thinking"                                    |
| closure               | Closure (the backpack)                 | 3     | "a function that remembers", "keep this private"                   |
| equality              | == vs === and coercion                 | 3     | "why triple equals?"                                               |
| event-loop            | Event loop (the browser's to-do list)  | 3     | "what prints first?", "don't block the main thread"                |
| this-binding          | `this` and arrow functions             | 3     | "what is `this` here?"                                             |
| async-await           | async/await pitfalls                   | 3     | "these should run in parallel"                                     |
| debounce-throttle     | Debounce vs throttle                   | 3     | "fires at most once per…", "wait until they stop typing"           |
| reference-value       | Reference vs value, shallow vs deep    | 3     | "why did the original change?"                                     |
| ts-annotations        | TypeScript essentials                  | 3     | "add types to this", "interface vs type"                           |
| ts-generics           | Generics in one idea                   | 3     | "make it work for any type"                                        |
| refactor-ladder       | Work → right → fast → typed            | 4     | "what would you improve?", "what's the next step?"                 |
| guard-clause          | Guard clauses (leave early)            | 4     | "can you flatten this?"                                            |
| dry                   | DRY without overdoing it               | 4     | "I see duplication"                                                |
| naming                | Naming things                          | 4     | "what would you call this?"                                        |
| single-responsibility | One job per function                   | 4     | "this function does a lot"                                         |
| pure-functions        | Pure functions & immutability          | 4     | "any side effects?"                                                |
| review-script         | Reviewing code out loud                | 4     | "review this code for me"                                          |
| design-script         | The system design script               | 5     | "design me a…"                                                     |
| lb-cache-queue        | The standard building blocks           | 5     | "what sits in front of the servers?"                               |
| caching               | Caching & invalidation                 | 5     | "it's read-heavy", "how do you keep it fresh?"                     |
| queues                | Queues & async work                    | 5     | "this endpoint is slow", "do it in the background"                 |
| sql-vs-nosql          | Choosing a database                    | 5     | "SQL or NoSQL?"                                                    |
| scaling               | Scaling & statelessness                | 5     | "10× the users tomorrow"                                           |
| idempotency           | Idempotency (safe to retry)            | 5     | "the user double-clicked pay"                                      |
| pagination            | Offset vs cursor                       | 5     | "the feed gets slow on page 100"                                   |
| rate-limiting         | Rate limiting                          | 5     | "someone is hammering the API"                                     |
| resilience            | Failure patterns & mitigations         | 5     | "what if this component dies?"                                     |
| decoder               | The interviewer phrasebook             | 6     | : (meta-card: the full riddle table)                               |
| stuck-script          | What to do when stuck                  | 6     | : (the unstick script + 3-minute rule)                             |
| hints                 | Hints are gifts                        | 6     | "what if it was sorted?", "is there a data structure that…"        |

_(Count note: a few cards serve two tracks; total distinct cards ≈ 45 in this table. Treat the table as authoritative rather than the "35" estimate. All must exist because exercises link to them.)_

## Lesson grouping

Within each track, group exercises into **lessons of 3–5** in manifest order (the order above is pedagogical). Lesson names are authored freely (e.g. Track 2: "The vending machine", "Chunking, three ways", "Windows & pointers"). Tracks unlock nothing. Everything is available from day one; the daily session just defaults to the frontier. No artificial gating: the user is a senior engineer, not a student.
