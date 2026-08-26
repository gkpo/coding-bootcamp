# 07, Roadmap

Milestones are ordered so the app is usable end-to-end as early as possible, then widens. One milestone ≈ one working session for an implementing agent; commit at least once per milestone with the milestone tag in the message (e.g. `M2: session player with mcq + complexity`). Every milestone ends with: `npm run build` + `npm run lint` + `npm test` green, and a manual check at 390×844.

## M0, Scaffold & foundations

- Vite + React + TS scaffold, ESLint/Prettier, Vitest, folder layout from the architecture doc.
- `styles/tokens.css` + base styles implementing the design system tokens; Inter + JetBrains Mono self-hosted.
- App shell: hash router, tab bar with the 5 tabs (placeholder screens), light theme tokens applied.
- CI workflow: lint + test + build on every push; Pages deploy job on default branch (deploy can 404 until Pages is enabled. Document the one manual step in README).
- **Accept:** deployed placeholder app reachable on the Pages URL, looks on-brand (bg/surface/accent/tab bar), no console errors.

## M1. Content pipeline + engine core

- Data types from the schemas doc; content assembly + dev-time validation in `content/index.ts`.
- Author a **starter slice: Track 1 complete** (18 exercises) + its concept cards.
- `engine/`: leitner, grading (mcq/complexity first), shuffle, dates, xp, streak. With Vitest coverage (aim ~90% on engine).
- **Accept:** tests green incl. validation of the authored content; content bugs (bad conceptId etc.) fail loudly in dev.

## M2. Session player (mcq + complexity) end-to-end

- Session composer; Home screen (streak header, daily CTA, progress strip stubbed); session player frame (progress segments, X-to-abandon, "?" concept chip w/ bottom sheet, "I'm not sure", feedback panel, re-queue on miss); session summary; XP + streak + Leitner updates persisted.
- Concept card bottom sheet renders real cards.
- **Accept:** full daily loop playable on the phone with Track 1 content; close/reopen keeps progress; miss an item → it returns end of session → box drops → appears in Review count.

## M3. Remaining exercise renderers

- `parsons` (dnd-kit + tap-to-move fallback), `spot-bug`, `blank`, `match`, `steps`, `ladder` (mcq variant). Code block component with syntax highlighting per architecture doc.
- Grading for all types in `engine/grading.ts` with tests.
- **Accept:** one demo exercise of each type playable smoothly on a real phone browser (drag included); all graded correctly incl. edge interactions (retry limits, reveal flow).

## M4, Full content bank

- Author Tracks 2–6 per the manifest (82 more exercises) + all remaining concept cards; lesson groupings + names.
- Tracks tab (track cards w/ mastery %, lesson lists), Sheets tab (grouped cards + search), Review tab (due list + review-all session).
- **Accept:** every manifest ID exists and passes validation; search finds cards by "interviewer says" phrases; a full review session works.

## M5. Gamification polish + Profile

- Streak freezes, XP bonuses, session summary niceties ("toughest moment", concepts touched), Home "concept of the day", Profile screen (streak calendar, weekly XP bar, per-track mastery), settings (sound/haptics/reduce-motion/reset), onboarding 3-screener + first-session easy start.
- Motion pass per design system §Motion (transitions, correct/wrong feedback, confetti-lite, flame pulse).
- **Accept:** the app _feels_ like the design doc; reduced-motion honored; reset works with double-confirm.

## M6, PWA + ship

- vite-plugin-pwa: manifest, icons (generate 192/512 maskable from a simple flame glyph on `--accent`), offline precache, autoUpdate.
- Lighthouse pass: mobile perf ≥ 90, a11y ≥ 95, PWA installable. Bundle check < 200KB gz.
- README rewritten for the finished app (what it is, Pages URL, how to add content).
- **Accept:** installed to a phone home screen, launches offline in airplane mode, full session playable offline.

## V1 acceptance (the whole thing)

Deployed on GitHub Pages · installable/offline PWA · 8 exercise types · 100 manifest exercises + all concept cards · daily session loop with re-queue · Leitner review · streak/XP/freezes · Sheets searchable · design system faithfully applied · engine unit-tested · lint/test/build green in CI.

## V2 ideas (do NOT build in v1)

Speed rounds (timed reflex mode) · multi-step chained ladders · progress export/import · dark theme · text-to-speech for decoder drills (practice _hearing_ riddles) · mock-interview mode (random 15-exercise gauntlet across tracks) · React Native port · content difficulty adaptation.
