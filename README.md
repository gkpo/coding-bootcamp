# Interview Reps

A Duolingo-style, mobile-first training app for coding interviews. For experienced full stack engineers who are great at the job and rusty at the _interview game_. Five-minute daily sessions on your phone, no code typing, focused on the patterns, vocabulary and reflexes interviews actually test.

**→ [gkpo.github.io/coding-bootcamp](https://gkpo.github.io/coding-bootcamp/)**. Installable to a home screen, works offline.

## The problem this app solves

Experienced engineers lose coding interviews for reasons that have nothing to do with engineering ability:

- **Pattern blindness under pressure.** You attack "make change for an amount" with an ad-hoc loop instead of recognizing the known _greedy_ pattern, and burn the interview on the wrong approach.
- **Vocabulary gaps.** You can see a function is slow, but the interviewer is waiting for the phrase **"it grows linearly"**. That's a vocabulary failure, not a knowledge failure.
- **Prompt decoding.** "A function that remembers" means **closure**. Interviewers speak in riddles, and every riddle has a canonical answer.
- **Staged ramps.** Interviews escalate (chunk text every 200 chars → now don't cut words), rewarding rehearsed _incremental refactoring_, which nobody practices on the job.

So this is not "learn to code": it's **pattern recognition, interview vocabulary, and communication reflexes**, trained in five-minute daily reps on a phone.

## What's in it

- **100 exercises** across six tracks: Big-O talk, algorithm patterns, JS/TS internals, refactoring, system design, and the interview decoder.
- **Eight mechanics**, all tap or drag: multiple choice, name-the-growth, drag-the-lines-into-order, tap-the-buggy-line, fill-the-blank, pick-the-next-move, pair-the-riddle, order-the-plan.
- **49 concept cards** in plain words: an everyday analogy first, the formal term second, the phrases interviewers use, and a sentence to say back.
- **Spaced repetition** on Leitner boxes: miss something and it returns until it sticks.
- **Streaks, XP and freezes**, because a habit you can see is a habit you keep.

Everything is stored in `localStorage` on your device. There is no account, no backend, and nothing leaves the phone.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/coding-bootcamp/
npm run build    # tsc -b && vite build → dist/
npm test         # vitest. Engine, content validation, grading
npm run lint     # eslint
```

Develop at a **390×844** viewport: this is a phone app first; desktop is a centred 480px column.

## Adding content

Exercises live in `src/content/tracks/t1.ts` … `t6.ts` and concept cards in `src/content/concepts.ts`, as typed TypeScript literals matching [`docs/04-DATA-SCHEMAS.md`](./docs/04-DATA-SCHEMAS.md). UI code never hard-codes exercise text.

`src/content/validate.ts` runs at import and **throws on startup** if anything is wrong. An exercise pointing at a concept card that doesn't exist, an mcq without exactly one correct option, a `spot-bug` index past the end of its snippet, a lesson with the wrong number of exercises. Content bugs fail loudly rather than rendering a chip that opens nothing.

Prose may use a tiny markdown subset: `**bold**`, `*italic*`, `` `code` ``, and a test asserts no authored string contains markers the renderer cannot handle.

## Architecture in one paragraph

React 19 + TypeScript on Vite, hash-routed, with a single Zustand store persisted to `localStorage`. All the logic that matters lives in `src/engine/`. Leitner scheduling, session composition, grading, XP, streaks, search. With no React or DOM imports, so it is unit-testable and portable. Styling is plain CSS driven by the design tokens in `src/styles/tokens.css`. See [`docs/05-ARCHITECTURE.md`](./docs/05-ARCHITECTURE.md).

## Deployment

Every push runs lint, tests and build. Pushes to `main` also deploy `dist/` to GitHub Pages.

> **One-time repo setup:** _Settings → Pages → Source → **GitHub Actions**_. The repo must be public for Pages on the free plan.

Current state: **205 tests**, Lighthouse mobile **97 performance / 100 accessibility / 100 best practices**, bundle **158 kB gzipped**.

## Documentation index

The plan this was built from, in reading order:

| Doc                                                      | Contents                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| [docs/00-VISION.md](./docs/00-VISION.md)                 | Who this is for, goals, non-goals, product principles          |
| [docs/01-PRODUCT-SPEC.md](./docs/01-PRODUCT-SPEC.md)     | Screens, flows, gamification, spaced repetition, concept cards |
| [docs/02-EXERCISE-TYPES.md](./docs/02-EXERCISE-TYPES.md) | The 8 exercise mechanics, their UI and grading rules           |
| [docs/03-CONTENT-PLAN.md](./docs/03-CONTENT-PLAN.md)     | 6 tracks, the full manifest of 100 exercises, the card list    |
| [docs/04-DATA-SCHEMAS.md](./docs/04-DATA-SCHEMAS.md)     | TypeScript shapes for content, progress, spaced repetition     |
| [docs/05-ARCHITECTURE.md](./docs/05-ARCHITECTURE.md)     | Stack, folder layout, state, persistence, PWA, deploy          |
| [docs/06-DESIGN-SYSTEM.md](./docs/06-DESIGN-SYSTEM.md)   | Colors, type, spacing, components, motion                      |
| [docs/07-ROADMAP.md](./docs/07-ROADMAP.md)               | Milestones with acceptance criteria                            |
| [docs/08-CONTENT-EXPANSION.md](./docs/08-CONTENT-EXPANSION.md) | v1.1 manifest: React, web platform and database tracks   |
| [docs/09-CONTENT-RESKIN.md](./docs/09-CONTENT-RESKIN.md) | v1.1 re-skin: vary surface stories and riddle phrasings        |

## Decisions already made (do not re-litigate)

- **Language of exercises:** JavaScript/TypeScript only.
- **Stack:** React + TypeScript + Vite, no backend, all state in `localStorage`. Architected so a later React Native port is realistic.
- **Deploy:** GitHub Pages via GitHub Actions, installable as a PWA.
- **v1 content size:** 100 exercises + 49 concept cards.
- **Every exercise links to a plain-words concept card.** You must never meet an unexplained term.
- **Visual bar:** simple but genuinely attractive. Generic unstyled UI is a failed deliverable.
