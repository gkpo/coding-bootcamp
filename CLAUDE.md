# Agent instructions, Interview Reps

You are implementing a mobile-first interview-training web app that is fully specified in `docs/`. The planning was done deliberately and in detail; your job is execution, not re-design.

## Delegation and roles

Two models, two jobs. This split is deliberate and standing; do not collapse it because a task looks small.

- **The top-level session (Fable) is the architect and never writes application code, styles, tests, or exercise content.** Its job is everything that could be decided wrong: interpreting the specs, resolving ambiguity, choosing the approach, naming the files and modules involved, and defining acceptance criteria. It writes the brief, reviews the diff that comes back against the docs and the brief, and owns verification sign-off, git, and pull requests.
- **The `opus-implementer` agent (`.claude/agents/opus-implementer.md`, pinned to Opus) writes all the code and content.** It receives a brief with the decisions already made and implements exactly that. When it hits a question the brief does not answer, it reports back instead of making a product decision itself.

Every brief must carry what the implementer needs to succeed without guessing: the task, the binding docs and sections, the files it is expected to touch, the decisions already taken (with the reasoning where it helps), edge cases considered, and the acceptance criteria including the verification commands and the mobile-viewport check. A thin brief is the architect's failure, not the implementer's.

Exempt from delegation: read-only questions, git operations, and edits to coordination artifacts themselves (this file, agent definitions, briefs).

## How to work in this repo

1. **Read the docs in numeric order** (`docs/00-…` through `docs/07-…`) before writing any code. `docs/07-ROADMAP.md` tells you what to build in which order, with acceptance criteria per milestone.
2. **Do not change product decisions** (stack, exercise types, track structure, visual direction) without the user explicitly asking. If a spec is ambiguous, pick the simplest interpretation consistent with the vision doc and note the choice in your commit message.
3. **The design system doc is binding.** `docs/06-DESIGN-SYSTEM.md` defines exact color tokens, typography, spacing, and component appearance. Do not substitute a component library's default look. No Tailwind default-blue, no unstyled browser buttons, no `Arial`.
4. **Content lives in data files, not components.** Exercises and concept cards are authored as TypeScript data modules matching `docs/04-DATA-SCHEMAS.md`. UI code must not hard-code exercise content.
5. **Author content faithfully to the manifest** in `docs/03-CONTENT-PLAN.md`. Each manifest row describes one exercise: build exactly that exercise (same type, track, concept link, difficulty). You write the actual question text, code snippets, options, and explanations. Make wrong options _plausible_ (classic misconceptions), never obviously dumb.
6. **Nothing that reads as generated.** This is a standing rule, not a one-off cleanup. No emoji anywhere, in the UI, content, comments, docs or commit messages; draw an icon instead (`src/components/ConceptIcon.tsx`, or the tab-bar set in `icons.tsx`). No literal glyph characters standing in for icons either, no bare arrows, ticks, crosses or bullet characters used as UI. Tests enforce the emoji and em-dash rules; the rest is judgement, so apply it.
7. **No em-dashes.** Not in exercise text, concept cards, comments, docs or commit messages. Use a comma, a colon, a semicolon, brackets, or two sentences. A test enforces this for all user-visible content. (En-dashes in numeric ranges like `3-5` are fine.)
8. **Plain words everywhere.** Every explanation and concept card must be understandable by someone who has never heard the term before. Define jargon on first use. Prefer "how fast the work grows when the input grows" over "asymptotic complexity", then introduce the formal term.
9. **One concept, several skins:** do not let a single example or phrasing become the only way a concept appears; see docs/09-CONTENT-RESKIN.md.
10. **Mobile first, literally.** Develop and test at 390×844 (iPhone-ish) viewport. Desktop is a centered ~480px column. Touch targets ≥ 44px. No hover-dependent interactions.
11. **Verify before committing:** `npm run build` and `npm run lint` must pass; test the interaction you just built in the browser at mobile viewport.

## Repo conventions

- Branch: work on the designated feature branch; never push elsewhere without permission.
- Commits: one milestone step per commit, imperative mood ("Add Parsons exercise renderer"), no model names in commit messages.
- Merging: once the work is verified (build, lint, tests, browser check) and pushed, open the PR and squash-merge it yourself; do not wait to be asked. Hold off only when the user says not to merge, or when the change reverses a product decision that has not been discussed with them.
- Keep dependencies minimal: see the allowed list in `docs/05-ARCHITECTURE.md`.
- Commands (scaffold exists as of M0):
  - `npm run dev`. Vite dev server at `/coding-bootcamp/`
  - `npm run build`: `tsc -b && vite build`
  - `npm test`. Vitest, single run (engine logic only; `npm run test:watch` to iterate)
  - `npm run lint`. ESLint; `npm run format`, Prettier write
- `src/engine/**` must not import React or touch the DOM. ESLint enforces the React half, keep the DOM half yourself.
- Assets under `public/` are referenced with root-relative paths (`/fonts/…`); Vite prefixes the `/coding-bootcamp/` base at build time. Never hardcode the base.

## Definition of done for v1

See `docs/07-ROADMAP.md` § "V1 acceptance". Short version: deployed on GitHub Pages, installable as a PWA, all 8 exercise types working, ~100 exercises + ~35 concept cards loaded, streak/XP/spaced-repetition functioning, and the UI matches the design system doc.
