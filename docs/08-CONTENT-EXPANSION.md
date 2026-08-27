# 08, Content expansion (v1.1)

Three new tracks that close the gaps between v1 and a full "full stack loop": React and frontend rendering, the web platform (HTTP, auth, security), and hands-on database literacy. 42 exercises and 22 concept cards, all using the existing 8 mechanics and the existing schemas. **This is pure content authoring plus small type extensions; no new app features.**

This doc is the authoring contract, same rules as `docs/03-CONTENT-PLAN.md`: every row below must exist with the stated type, track, difficulty (1-3) and concept link; the author writes the actual prompts, snippets, options, distractors and explanations. The v1 quality bar applies unchanged (plausible misconceptions with `whyWrong`, plain words first, snippets ≤ 18 lines, difficulty 1 answerable from the linked card). So do the standing repo rules: no emoji, no em-dashes, nothing that reads as generated.

## Implementation deltas (small, do these first)

1. **`TrackId`** in `src/content/types.ts` becomes `'t1' | … | 't9'`. New track files `src/content/tracks/t7.ts`, `t8.ts`, `t9.ts`, registered in `content/index.ts`. The validator and its tests must cover the new tracks with no rule changes.
2. **Track identity colors** (add to `docs/06-DESIGN-SYSTEM.md` and `tokens.css`): t7 cyan `#0891B2`, t8 indigo `#4F46E5`, t9 slate `#475569`. Deep-on-light like the existing six; adjust only if a real screen shows two tracks reading as the same color.
3. **Icons**: add names to `ICON_NAMES` and draw them in `ConceptIcon.tsx` (compile error until drawn, by design). Suggested new names: `component`, `globe`, `database`, `shield`, `cookie`, `handshake`, `rows`. Reuse existing icons where they fit; per-card assignments are the author's call.
4. **Session composer**: no logic change. New tracks join the round-robin automatically; the "always 1 decoder item" rule stays. Verify nothing hardcodes six tracks (Home strip, Tracks tab, mastery math, tests).
5. **Existing cards gain links, not rewrites**: `decoder` extends its riddle table with the new phrases below and adds t7/t8/t9 to its `trackIds`; `idempotency` relates to `http-verbs`; `closure` relates to `stale-closure`; `hash-lookup` relates to `indexes`; `caching` relates to `caching-headers`.
6. **Progress compatibility**: existing exercise ids and boxes are untouched; new ids simply appear as box 0. The `schemaVersion` does not need to bump.

---

## Track 7. React and the frontend (20 exercises)

Goal: answer the React round the way a React shop expects: explain re-renders, keys, effects, stale closures and memoization in plain words, and spot the classic bugs on sight.

| ID    | Type     | Diff | Exercise (what it tests)                                                                                                                                                                                                        | Concept card          |
| ----- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| t7-01 | mcq      | 1    | What actually triggers a re-render (state change, parent re-render), and what does not (mutating a variable)                                                                                                                    | re-render             |
| t7-02 | mcq      | 2    | Predict: `setItems(items)` after `items.push(x)` re-renders nothing. Why (same reference)                                                                                                                                       | re-render             |
| t7-03 | spot-bug | 2    | Tap the line that mutates state in place instead of producing a new array                                                                                                                                                       | re-render             |
| t7-04 | mcq      | 1    | Why lists need keys, in plain words (identity across renders), and what React does without them                                                                                                                                 | keys                  |
| t7-05 | spot-bug | 2    | Reorderable list using the array index as key: tap the line that breaks input state when items move                                                                                                                             | keys                  |
| t7-06 | mcq      | 2    | `useEffect` deps quiz: `[]` vs no array vs `[dep]`. How many times does the effect run in a given scenario                                                                                                                      | use-effect            |
| t7-07 | spot-bug | 2    | `setInterval` in an effect with no cleanup: tap the missing-cleanup effect (interval leak on unmount)                                                                                                                           | use-effect            |
| t7-08 | blank    | 2    | Fill the deps array and the cleanup `return` in a subscription effect                                                                                                                                                           | use-effect            |
| t7-09 | mcq      | 3    | The stale closure: interval reads `count` from the first render. Predict what it logs forever                                                                                                                                   | stale-closure         |
| t7-10 | mcq      | 3    | Fix t7-09: functional update `setCount(c => c + 1)` vs adding `count` to deps vs a ref. Which and why                                                                                                                           | stale-closure         |
| t7-11 | mcq      | 2    | Controlled vs uncontrolled input; decode "the component owns the field's value"                                                                                                                                                 | controlled            |
| t7-12 | mcq      | 2    | When `useMemo` actually helps (expensive computation, stable reference) and the "sprinkle useMemo everywhere" trap                                                                                                              | memo-hooks            |
| t7-13 | mcq      | 2    | `React.memo` child still re-renders because the parent passes an inline arrow. Why, and what `useCallback` changes                                                                                                              | memo-hooks            |
| t7-14 | mcq      | 2    | Sibling components need the same state: lift it, reach for context, or keep prop drilling. Which when                                                                                                                           | lifting-context       |
| t7-15 | ladder   | 2    | A component that fetches, formats and renders: interviewer asks what you'd improve first (extract the fetch into a hook)                                                                                                        | single-responsibility |
| t7-16 | match    | 2    | Pair riddle ↔ tool: "remembers without re-rendering" ↔ useRef, "runs after the render is on screen" ↔ useEffect, "skips the child if props are unchanged" ↔ React.memo, "keeps the same function between renders" ↔ useCallback | memo-hooks            |

Wave 3 (docs/10 part C):

| ID    | Type     | Diff | Exercise                                                                               | Concept card  |
| ----- | -------- | ---- | -------------------------------------------------------------------------------------- | ------------- |
| t7-17 | mcq      | 3    | A second stale closure: `useCallback` with an empty dependency array freezes `query`   | stale-closure |
| t7-18 | spot-bug | 2    | Effect cleanup that unsubscribes but never closes the socket                           | use-effect    |
| t7-19 | mcq      | 2    | `memo` defeated by an object literal prop, because a new object is never `===` the old | re-render     |
| t7-20 | mcq      | 2    | A controlled input with no `onChange`: typing does nothing                             | controlled    |

## Track 8. The web platform (20 exercises)

Goal: the HTTP, auth and security questions every full stack loop contains, including the single most classic one (the URL journey) and the security trio (XSS, CSRF, SQL injection).

| ID    | Type     | Diff | Exercise (what it tests)                                                                                                                                                                                  | Concept card    |
| ----- | -------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| t8-01 | mcq      | 1    | Pick the verb: update one field of a resource (PATCH vs PUT vs POST), with `whyWrong` on each                                                                                                             | http-verbs      |
| t8-02 | mcq      | 2    | Why PUT and DELETE are safe to retry and POST is not (idempotency on the wire; relate to the existing idempotency card)                                                                                   | http-verbs      |
| t8-03 | mcq      | 1    | 401 vs 403 in one scenario ("logged in but not allowed"), the canonical answer                                                                                                                            | status-codes    |
| t8-04 | match    | 1    | Pair code ↔ meaning: 201 ↔ created, 301 ↔ moved for good, 400 ↔ your request is malformed, 404 ↔ no such thing, 503 ↔ back soon                                                                           | status-codes    |
| t8-05 | steps    | 2    | Order "you type a URL and press enter": DNS lookup → TCP + TLS handshake → HTTP request → server responds → browser parses and renders                                                                    | url-journey     |
| t8-06 | mcq      | 2    | CORS: which of these requests gets blocked, and who does the blocking (the browser, not the server)                                                                                                       | cors            |
| t8-07 | mcq      | 2    | The preflight: what makes the browser send OPTIONS first (non-simple headers, content types), and what the server must answer                                                                             | cors            |
| t8-08 | mcq      | 2    | Where does the JWT live: localStorage vs httpOnly cookie, and which attack each choice exposes you to (XSS vs CSRF)                                                                                       | cookies-tokens  |
| t8-09 | mcq      | 2    | Session auth vs token auth: what the server remembers in each, and what that means for scaling out                                                                                                        | auth-flows      |
| t8-10 | steps    | 3    | Order "log in with Google" in plain words: redirect → user consents → code comes back → server swaps code for tokens → session starts                                                                     | auth-flows      |
| t8-11 | mcq      | 2    | XSS in plain words: what rendering user HTML lets an attacker do, and the fix (escape by default, sanitize when you must render)                                                                          | xss             |
| t8-12 | spot-bug | 2    | Tap the line that opens the XSS hole (`innerHTML` fed with user input) in an otherwise safe component                                                                                                     | xss             |
| t8-13 | mcq      | 2    | CSRF in plain words: the forged request from another tab, and why SameSite cookies and CSRF tokens stop it                                                                                                | csrf            |
| t8-14 | spot-bug | 2    | Tap the line that invites SQL injection (string-concatenated query); feedback shows the parameterized fix                                                                                                 | sql-injection   |
| t8-15 | mcq      | 2    | "How do you stop the browser re-downloading this?": Cache-Control max-age vs ETag revalidation, which does what                                                                                           | caching-headers |
| t8-16 | match    | 2    | Pair riddle ↔ term: "the browser refuses the cross-site read" ↔ CORS, "a script smuggled into the page" ↔ XSS, "a forged click from another site" ↔ CSRF, "a quote that breaks the query" ↔ SQL injection | decoder         |

Wave 3 (docs/10 part C):

| ID    | Type     | Diff | Exercise                                                                              | Concept card    |
| ----- | -------- | ---- | ------------------------------------------------------------------------------------- | --------------- |
| t8-17 | mcq      | 2    | A different CORS scenario: the same URL works in the address bar and fails from fetch | cors            |
| t8-18 | mcq      | 2    | 409 versus 422 versus 400: a valid sign-up for an email already taken                 | status-codes    |
| t8-19 | spot-bug | 2    | Session cookie with `httpOnly: false`, readable by injected script                    | cookies-tokens  |
| t8-20 | mcq      | 2    | Stale bundle after a deploy: hashed filenames plus an uncached HTML shell             | caching-headers |

## Track 9. Databases in practice (14 exercises)

Goal: read SQL out loud, explain why a query is slow, and nail the N+1 question. Complements Track 5's architecture-level database talk with query-level literacy.

| ID    | Type     | Diff | Exercise (what it tests)                                                                                                                                            | Concept card |
| ----- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| t9-01 | mcq      | 1    | Read an INNER JOIN: which rows come back when a user has no orders                                                                                                  | joins        |
| t9-02 | mcq      | 2    | LEFT JOIN + `WHERE orders.id IS NULL`: the "users who never ordered" idiom, read it out loud                                                                        | joins        |
| t9-03 | mcq      | 2    | Read a GROUP BY + HAVING query: what one result row _means_                                                                                                         | sql-reading  |
| t9-04 | blank    | 2    | Fill the query: WHERE vs HAVING slots and the JOIN ... ON clause, with distractor tokens                                                                            | sql-reading  |
| t9-05 | mcq      | 2    | "This query got slow at a million rows": first lever is an index on the filtered column; what an index is (the book-index analogy)                                  | indexes      |
| t9-06 | mcq      | 3    | Why not index every column (every write pays, space, the optimizer can ignore them)                                                                                 | indexes      |
| t9-07 | spot-bug | 2    | N+1: tap the awaited per-row query inside the loop that turns 1 query into 101                                                                                      | n-plus-one   |
| t9-08 | mcq      | 2    | Fix t9-07: one query with `IN` / a JOIN (or the ORM's include), and how to _say_ the diagnosis in an interview                                                      | n-plus-one   |
| t9-09 | mcq      | 2    | Money transfer crashes between the debit and the credit: what a transaction guarantees, ACID in plain words                                                         | transactions |
| t9-10 | match    | 2    | Pair riddle ↔ term: "the book's index at the back" ↔ index, "all or nothing" ↔ transaction, "one query per row" ↔ N+1, "rows that match on both sides" ↔ INNER JOIN | decoder      |

Wave 3 (docs/10 part C):

| ID    | Type     | Diff | Exercise                                                                   | Concept card |
| ----- | -------- | ---- | -------------------------------------------------------------------------- | ------------ |
| t9-11 | spot-bug | 2    | A different N+1 shape: a customer lookup inside an invoice export loop     | n-plus-one   |
| t9-12 | mcq      | 2    | Composite index on `(country, city)`: which query cannot use it            | indexes      |
| t9-13 | mcq      | 2    | Debit committed, credit threw, error swallowed. No transaction, money gone | transactions |
| t9-14 | mcq      | 2    | Rows vanish after a join: inner versus left, and `COALESCE` on the total   | joins        |

---

## New concept cards (22)

Same anatomy as v1 (plain words → analogy → "interviewer says…" → tiny example → "say this in the interview" → related). The "interviewer says" column is the minimum; add more phrases freely.

| ID              | Title                      | Track | Must-include "interviewer says…" phrases                                |
| --------------- | -------------------------- | ----- | ----------------------------------------------------------------------- |
| re-render       | What makes React re-render | 7     | "why does this render twice?", "why doesn't the UI update?"             |
| keys            | Keys and list identity     | 7     | "why not use the index as key?"                                         |
| use-effect      | useEffect and cleanup      | 7     | "when does this effect run?", "what about unmount?"                     |
| stale-closure   | The stale closure          | 7     | "it always logs the old value", "the interval never sees the new state" |
| controlled      | Controlled inputs          | 7     | "who owns the form's value?", "single source of truth for this field"   |
| memo-hooks      | memo, useMemo, useCallback | 7     | "it re-renders even though the props didn't change"                     |
| lifting-context | Lifting state and context  | 7     | "these two components need the same data"                               |
| http-verbs      | HTTP methods               | 8     | "which verb would you use?", "is it safe to retry?"                     |
| status-codes    | Status codes that matter   | 8     | "401 or 403?", "what do you return here?"                               |
| url-journey     | You press enter on a URL   | 8     | "what happens when you type a URL and hit enter?"                       |
| cors            | CORS                       | 8     | "the request works in Postman but not the browser"                      |
| cookies-tokens  | Cookies, storage and JWTs  | 8     | "where would you store the token?"                                      |
| auth-flows      | Sessions, tokens and OAuth | 8     | "how does log in with Google work?", "session or JWT?"                  |
| xss             | XSS (script smuggling)     | 8     | "what's dangerous about rendering user input?"                          |
| csrf            | CSRF (the forged request)  | 8     | "why does the cookie make this dangerous?"                              |
| sql-injection   | SQL injection              | 8     | "what's wrong with building the query from strings?"                    |
| caching-headers | HTTP caching               | 8     | "how do you stop re-downloading it?", "when is the cache stale?"        |
| joins           | Reading JOINs              | 9     | "users who never ordered", "inner or left?"                             |
| sql-reading     | Reading aggregate queries  | 9     | "what does this query return?"                                          |
| indexes         | Indexes (the book index)   | 9     | "this query got slow, what do you do?", "why not index everything?"     |
| n-plus-one      | The N+1 problem            | 9     | "it makes a hundred queries", "one query per row"                       |
| transactions    | Transactions and ACID      | 9     | "what if it crashes halfway?", "all or nothing"                         |

New riddles for the `decoder` card's phrase table (and its searchability): the four pairs in t8-16 and the four in t9-10, plus "remembers without re-rendering" ↔ useRef from t7-16.

## Lessons

Group in manifest order, 3-5 exercises per lesson, author-named. Suggested cut points: t7 into 4 lessons (re-renders and keys / effects / stale closures and memo / structure), t8 into 4 (verbs and codes / the URL journey and CORS / auth / security and caching), t9 into 3 (reading SQL / making it fast / N+1 and transactions).

## Acceptance (v1.1)

- All 42 exercise ids and 22 card ids above exist, pass the validator, and are wired into lessons.
- The three new tracks appear on Home and in Tracks with their own colors and icons; the daily session mixes them in with no composer change.
- The decoder card finds the new riddles by search.
- Existing progress is untouched after upgrade (manual check: a device with v1 progress keeps its boxes and streak).
- `npm run build`, `npm run lint`, `npm test` green; content tests (no emoji, no em-dash, markdown subset) pass for all new content.
- Lighthouse and bundle stay within v1 budgets (content is data; nothing here justifies a new dependency).
