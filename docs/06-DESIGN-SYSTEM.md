# 06, Design system

The bar: **simple but not ugly**: appealing enough that opening it daily feels good. This doc is binding. The failure mode to avoid is "developer default UI": browser buttons, pure black-on-white, cramped text, default blue links. The direction below is **calm, light, warm, confident**. A premium learning app for an adult, not a candy-colored kids app and not a corporate dashboard.

## Direction

- **Light theme only in v1**: a warm paper-like off-white, never pure `#FFFFFF` walls or clinical gray. Design tokens make a future dark theme cheap; do not build one now.
- Personality comes from: one warm accent used sparingly, generous whitespace, big friendly numerals for streak/XP, soft cards with gentle shadows, springy micro-motion. Not from illustrations or gradients everywhere.

## Color tokens (CSS custom properties in `styles/tokens.css`)

| Token                                        | Value                                    | Use                                                                                                                              |
| -------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--bg`                                       | `#F7F5F1`                                | App background (warm paper off-white)                                                                                            |
| `--surface`                                  | `#FFFFFF`                                | Cards, tab bar, sheets                                                                                                           |
| `--surface-2`                                | `#F1EEE8`                                | Nested surfaces (code blocks, pressed states, bar tracks)                                                                        |
| `--border`                                   | `#E5E1D8`                                | Hairline borders, dividers                                                                                                       |
| `--text`                                     | `#1F2430`                                | Primary text (soft near-black, slightly blue)                                                                                    |
| `--text-dim`                                 | `#6B7180`                                | Secondary text, captions (AA on `--bg` and `--surface`)                                                                          |
| `--accent`                                   | `#F59E0B`                                | THE accent (warm amber): primary button fills, streak flame, progress fills, active tab icon                                     |
| `--accent-pressed`                           | `#D97706`                                | Pressed state of accent                                                                                                          |
| `--accent-text`                              | `#B45309`                                | Accent used _as text or small icons_ on light bg (the fill amber fails AA as text. Always use this darker step for text/strokes) |
| `--on-accent`                                | `#33230A`                                | Text on accent-filled surfaces                                                                                                   |
| `--success`                                  | `#059669`                                | Correct answers, mastered checks                                                                                                 |
| `--danger`                                   | `#DC2626`                                | Wrong answers (used gently. Border/tint, never full red panels)                                                                  |
| `--info`                                     | `#2563EB`                                | Links, the "?" concept chip                                                                                                      |
| `--success-bg` / `--danger-bg` / `--info-bg` | the above at ~10% opacity on `--surface` | Feedback panel tints                                                                                                             |

Track identity colors (track cards, progress bars, lesson headers). Deep enough to read on light backgrounds: t1 amber `#D97706`, t2 violet `#7C3AED`, t3 pink `#DB2777`, t4 teal `#0D9488`, t5 blue `#2563EB`, t6 green `#059669`, t7 cyan `#0891B2`, t8 indigo `#4F46E5`, t9 slate `#475569`. Use at full strength only for small elements (icons, bar fills, 15px+ bold text); tint at ~8–10% for card backgrounds.

Contrast: all text/background pairs must pass WCAG AA (the values above do; keep it true if tweaked).

## Typography

- **UI face:** `Inter` (variable, self-hosted woff2, no CDN dependency for offline PWA) with system-ui fallback stack.
- **Mono face:** `JetBrains Mono` (self-hosted, regular only) for all code.
- Scale (px @ mobile): display 32/700 (streak number, session score), title 22/700 (screen titles), heading 17/600 (card titles), body 15.5/400, secondary 13.5/400 (`--text-dim`), mono 13.5.
- Line-height 1.5 body, 1.6 for concept-card prose. Concept cards may use body 17, they're reading surfaces.
- No font-size below 12px anywhere.

## Spacing, shape, elevation

- 4px base grid; common paddings 12/16/20; screen gutter 20px.
- Radii: cards & sheets 16px, buttons 14px, chips/pills 999px, code blocks 12px.
- Elevation: cards are `--surface` on `--bg` with a 1px `--border` **or** a soft shadow (`0 1px 3px rgba(31,36,48,.06), 0 4px 12px rgba(31,36,48,.05)`). Pick one per component and stay consistent; bottom sheet and modal get a stronger soft shadow. Never harsh black shadows.

## Core components

- **Primary button:** full-width, 52px tall, `--accent` bg, `--on-accent` bold text, radius 14, subtle scale-down (0.98) on press. Secondary: `--surface-2` bg + `--border`. Ghost: text-only `--info`.
- **Card:** `--surface`, radius 16, 16–20px padding, optional 1px border.
- **Progress bar:** 6px tall, radius full, track `--surface-2`, fill = track color or accent; animate width 300ms ease-out.
- **Progress ring:** (Home CTA, session summary) 3–4px stroke, accent on `--surface-2` track.
- **Streak flame:** the one playful mascot-ish element. Inline SVG flame, accent-colored, subtle 1.5s ease pulse when today is done; grayed at `--text-dim` when today isn't done yet.
- **Chips:** concept "?" chip = `--info-bg` bg + `--info` text + radius full; option pills for parsons/blank = `--surface-2` + border, drag state lifts with slight scale + border-accent.
- **Answer options (mcq):** full-width cards, 14px radius, border `--border`; selected-correct → `--success` border + `--success-bg`; selected-wrong → `--danger` equivalents + gentle 250ms shake. Never color before the user commits.
- **Bottom sheet** (concept card in-session): rounded-top 20px, drag handle, scrim `rgba(0,0,0,.5)`, spring-in 250ms.
- **Tab bar:** 5 items, inline SVG icons 24px, active = `--accent-text` icon + 11px label (the darker amber. The fill amber is too pale for small glyphs on light), inactive `--text-dim`; respects safe-area bottom inset; hidden during sessions.
- **Code block:** `--surface-2`, 12px radius, 12px padding, mono 13.5, highlight theme matched to this palette (tune a Shiki/hljs _light_ theme's bg to `--surface-2`; keep token colors in the deep range of the track colors, no neon-on-white).

## Motion

- Durations: micro 150ms, standard 250ms, celebratory 400ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Session flow: next exercise slides in from right 250ms. Feedback panel slides up 250ms.
- Correct answer: option pops (scale 1 → 1.03 → 1) + success tint; session-complete screen gets one confetti-lite burst (a dozen accent/track-color particles, canvas or CSS, no library heavier than ~2KB, hand-rolling is fine).
- Wrong answer: 250ms horizontal shake, ±4px. No red flashes.
- Streak milestone (7/30): flame pulse + count-up animation on the number.
- All motion behind `prefers-reduced-motion` + the in-app toggle → fades only.

## Copy voice

Short, warm, adult. Sound like a sharp friend, not a teacher. Examples. Correct: "That's the one." / "Interviewer nods." Wrong: "Not this one. Here's the idea:" Unsure: "No stress. Here's how it works:" Streak: "Day 12. This is becoming a habit." Never: "Incorrect", "Oops!", "Great job!!!". No emoji anywhere: track and card identity is carried by a drawn icon and the track colour.

## Screens with prescribed layouts

Follow the wireframe descriptions in the product spec §Home/§Session. Anything unspecified: default to a single-column stack of cards with 12px gaps on `--bg`. When in doubt, remove elements rather than add.
