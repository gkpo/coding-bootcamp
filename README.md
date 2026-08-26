# Interview Reps

A Duolingo-style, mobile-first training app for coding interviews — for experienced full stack engineers who are great at the job and rusty at the _interview game_. Small daily sessions on your phone, no code typing required, focused on the patterns, vocabulary, and reflexes interviewers actually test.

**Status: M0 complete — scaffold and foundations.** The app shell, design tokens and CI/Pages pipeline are in place; the session loop and content land in M1–M2. Any agent (or human) working on this project must start with [`CLAUDE.md`](./CLAUDE.md) and then read the docs below in order. [`docs/07-ROADMAP.md`](./docs/07-ROADMAP.md) says what is next.

## The problem this app solves

Experienced engineers lose coding interviews for reasons that have nothing to do with engineering ability:

- **Pattern blindness under pressure.** You attack "make change for an amount" with an ad-hoc loop instead of recognizing the known _greedy_ pattern — and burn the interview on the wrong approach.
- **Vocabulary gaps.** You can see a function is slow, but the interviewer is waiting for the phrase **"it grows linearly"**. That's a vocabulary failure, not a knowledge failure.
- **Prompt decoding.** "A function that remembers" means **closure**. Interviewers speak in riddles, and every riddle has a canonical answer.
- **Staged ramps.** Interviews escalate (chunk text every 200 chars → now don't cut words), rewarding rehearsed _incremental refactoring_ — which nobody practices on the job.

So this is not "learn to code" — it's **pattern recognition, interview vocabulary, and communication reflexes**, trained in 5-minute daily reps on a phone.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/coding-bootcamp/
npm run build    # tsc -b && vite build → dist/
npm run test     # vitest (engine logic)
npm run lint     # eslint
```

Develop at a **390×844** viewport — this is a phone app first; desktop is a centred 480px column.

## Deployment

Every push runs lint + test + build. Pushes to the default branch also deploy `dist/` to GitHub Pages at **https://gkpo.github.io/coding-bootcamp/**.

> **One manual step, once:** in the repo's _Settings → Pages_, set **Source** to **GitHub Actions**. Until that is done the deploy job fails and the URL 404s — the build and test jobs still pass.

## Documentation index (read in order)

| Doc                                                      | Contents                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [docs/00-VISION.md](./docs/00-VISION.md)                 | Who this is for, goals, non-goals, product principles                        |
| [docs/01-PRODUCT-SPEC.md](./docs/01-PRODUCT-SPEC.md)     | Screens, flows, gamification, spaced repetition, concept cards               |
| [docs/02-EXERCISE-TYPES.md](./docs/02-EXERCISE-TYPES.md) | The 8 exercise mechanics, their UI and grading rules                         |
| [docs/03-CONTENT-PLAN.md](./docs/03-CONTENT-PLAN.md)     | 6 learning tracks, full manifest of ~100 v1 exercises, ~35 cheat-sheet cards |
| [docs/04-DATA-SCHEMAS.md](./docs/04-DATA-SCHEMAS.md)     | TypeScript shapes for content, progress, and spaced repetition               |
| [docs/05-ARCHITECTURE.md](./docs/05-ARCHITECTURE.md)     | Stack, folder layout, state, persistence, PWA, GitHub Pages deploy           |
| [docs/06-DESIGN-SYSTEM.md](./docs/06-DESIGN-SYSTEM.md)   | Colors, type, spacing, components, motion — the app must look like this      |
| [docs/07-ROADMAP.md](./docs/07-ROADMAP.md)               | Milestones with acceptance criteria and suggested commit points              |

## Decisions already made (do not re-litigate)

- **Language of exercises:** JavaScript/TypeScript only.
- **Stack:** React + TypeScript + Vite, no backend, all state in `localStorage`. Architected so a later React Native port is realistic.
- **Deploy:** GitHub Pages via GitHub Actions, installable as a PWA.
- **v1 content size:** ~100 exercises + ~35 concept cards.
- **Parsons (drag-lines-into-order) exercises are in v1.**
- **Every exercise links to a plain-words concept card.** The user must never meet an unexplained term.
- **Visual bar:** simple but genuinely attractive (see design system doc). Generic unstyled UI is a failed deliverable.
