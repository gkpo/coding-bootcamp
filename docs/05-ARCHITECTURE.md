# 05, Architecture

## Stack

| Concern             | Choice                                                                                           | Notes                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Framework           | React 19 + TypeScript, Vite                                                                      | SPA, no SSR. Strict TS.                                                                              |
| Routing             | `react-router` (hash or browser router. See Pages note)                                          | 6 routes, nothing fancy                                                                              |
| State               | Zustand (single store) + `localStorage` persistence                                              | Chosen over Context for the RN-port story and less boilerplate                                       |
| Styling             | Plain CSS (CSS Modules or a single global sheet) with **design tokens as CSS custom properties** | No Tailwind, no component library. The design system doc defines everything; token names in that doc |
| Drag & drop         | `@dnd-kit/core` (+ sortable)                                                                     | Touch-friendly; also implement tap-to-move fallback                                                  |
| Syntax highlighting | Shiki at **build time** if simple, else `highlight.js` (core + js/ts only) at runtime            | Keep bundle small; no full Prism/hljs bundles                                                        |
| PWA                 | `vite-plugin-pwa`                                                                                | Precache app shell + all content (it's just JS); offline-first                                       |
| Icons               | Inline SVG (hand-picked, e.g. from Lucide, copied in)                                            | No icon-font, no full icon package                                                                   |
| Tests               | Vitest for pure logic (Leitner, session composer, content validation, grading)                   | No E2E suite in v1; manual mobile testing per milestone                                              |
| Lint/format         | ESLint + Prettier, default sensible configs                                                      | `npm run lint` must pass in CI                                                                       |

**Budgets.** A build splits into three chunks (`vendor`, `index`, `content`) so these are readable straight off `npm run build`. Two of them are budgets; the third is the product.

| Chunk     | What it holds                                  | Budget            | At 190 exercises and 2 capstones |
| --------- | ---------------------------------------------- | ----------------- | -------------------------------- |
| `vendor`  | Everything in `dependencies`                   | **< 60KB gzip**   | 35KB                             |
| `index`   | Our UI, engine, store and styles               | **< 100KB gzip**  | 87KB                             |
| `content` | The exercise bank, concept cards and capstones | No cap; see below | 100KB                            |

**Dependency budget:** the stack table above is the whitelist. Adding anything else needs a one-line justification in the commit message, and `vendor` must stay under its cap. This is the budget that matters: it exists to stop a date library, an icon package or a component library arriving one convenient import at a time.

**App budget:** our own code should grow with features, not with content. If `index` moves without a feature behind it, something content-shaped has leaked into a component (see the content-lives-in-data-files rule).

**Content is not budgeted.** It is the product, it grows every wave, and it costs the user one precache at install rather than a download per visit. It runs about 0.5KB gzipped per exercise, so a wave of 50 is roughly 25KB. Record the figure in the commit when it moves so a jump is visible; do not treat it as a ceiling.

_(These replaced a single "< 200KB gzipped JS total" line. That target was written when the bank was ~100 exercises, and it read as a dependency guard because every note in the table above is one. Content growth was tripping a limit that was never aimed at it, while dependencies sat at a third of the number.)_

## Folder layout

```
src/
  app/            # router, App shell, tab bar, theme bootstrap
  screens/        # Home, Tracks, TrackDetail, Review, Sheets, SheetDetail, Profile, Session, SessionSummary, Onboarding
  exercises/      # one renderer per exercise type + shared ExerciseFrame (prompt, ? chip, feedback panel, unsure button)
  components/     # Button, Card, ProgressBar, ProgressRing, Chip, BottomSheet, CodeBlock, StreakFlame…
  content/        # tracks/t1.ts … t6.ts, concepts.ts, index.ts (assembly + dev-time validation)
  engine/         # pure logic, NO React imports: leitner.ts, sessionComposer.ts, grading.ts, xp.ts, streak.ts, dates.ts, shuffle.ts
  store/          # zustand store, persistence (load/save/migrate)
  styles/         # tokens.css, base.css
  assets/         # icons, manifest icons
```

`engine/` purity is a hard rule: it's the part that ports to React Native untouched, and it's where all Vitest coverage goes. React components stay thin.

## Key logic modules (all in `engine/`, all unit-tested)

- **`leitner.ts`**: `applyResult(progress, result, today)` → new box + dueDay per the product spec table; `dueExercises(all, today)`.
- **`sessionComposer.ts`**. Builds the daily session (≤3 due reviews + ~4 frontier + 1 decoder item; frontier = first unseen per track, round-robin; the decoder slot prefers unseen, then due, then rotates by day). Deterministic given (progress, today, seed).
- **`grading.ts`**. Per-type answer checking (parsons order compare ignoring distractors, blank gap compare, match pair compare…). Returns structured result incl. which parts were wrong, for UI highlighting.
- **`streak.ts` / `xp.ts`**. Day-boundary logic (local time), freeze consumption, XP rules from the product spec.
- **`shuffle.ts`**. Seeded Fisher-Yates; seed per presentation.

## GitHub Pages deployment

- Workflow `.github/workflows/deploy.yml`: on push to the default branch → `npm ci`, `npm run lint`, `npm test`, `npm run build`, upload `dist/`, deploy via `actions/deploy-pages` (official Pages actions; needs `pages: write`/`id-token: write` permissions and Pages enabled with "GitHub Actions" source in repo settings. Note this in the PR/readme for the user).
- Vite `base` must be `/coding-bootcamp/` (project page). Set via config, not hardcoded in code.
- Routing on Pages: use **hash routing** (`createHashRouter`). Avoids the 404-on-refresh problem with zero hacks. Acceptable tradeoff for a personal PWA.
- PWA manifest: `name: "Interview Reps"`, standalone display, theme/background colors from design tokens, 192/512 maskable icons. Service worker via vite-plugin-pwa `autoUpdate`.

## Mobile quality bar

- Test viewport 390×844 throughout; desktop = centered 480px column on a dimmed backdrop.
- Touch targets ≥ 44×44. No hover-only affordances. `touch-action` tuned so drag surfaces don't scroll-fight (dnd-kit handles most of this).
- `100dvh` (not `100vh`) for full-height layouts; respect safe-area insets (`env(safe-area-inset-*)`) for the tab bar.
- Haptics via `navigator.vibrate` where available (answer feedback), behind the settings toggle.
- Lighthouse mobile ≥ 90 performance / ≥ 95 accessibility on the deployed site (roadmap acceptance).

## React Native future-proofing (do now, cheap)

- All logic in `engine/` + `store/` with zero DOM/React-DOM imports.
- No CSS-in-JS runtime; components take content via props, no `dangerouslySetInnerHTML` except the sanitized code highlighter output.
- The tiny markdown subset in prompts (bold + inline code) gets its own renderer function. Do not pull a markdown library.
