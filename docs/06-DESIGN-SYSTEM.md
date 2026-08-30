# 06, Design system

The bar: **simple but not ugly**: appealing enough that opening it daily feels good. This doc is binding. The failure mode to avoid is "developer default UI": browser buttons, pure black-on-white, cramped text, default blue links. The direction below is **warm, lively, confident**. A learning app that feels good to tap, for an adult: energetic without being childish, and never a corporate dashboard.

The energy comes from **saturation and form, not from lightness**. Fully saturated colour on warm paper, and controls with real physical weight that respond to a finger. It does not come from pale, bright fills: on a warm off-white ground those wash out, and the app spent its first version with a primary button that measured 1.97:1 against the page behind it.

## Direction

- **Light theme only in v1**: a very light neutral grey page under white cards. The grey is what lets a card read as a card, so cards take the soft shadow and no border. Design tokens make a future dark theme cheap; do not build one now.
- Personality comes from: one warm accent used sparingly, generous whitespace, big friendly numerals for streak/XP, soft cards with gentle shadows, springy micro-motion. Not from illustrations or gradients everywhere.

## Color tokens (CSS custom properties in `styles/tokens.css`)

| Token                                        | Value                                    | Use                                                                                                                            |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--bg`                                       | `#F4F5F6`                                | App background (very light neutral grey)                                                                                       |
| `--surface`                                  | `#FFFFFF`                                | Cards, tab bar, sheets                                                                                                         |
| `--surface-2`                                | `#EAECEF`                                | Nested surfaces (code blocks, pressed states, bar tracks)                                                                      |
| `--border`                                   | `#EAEDF0`                                | Box borders (2px, see `--border-w`), dividers                                                                                  |
| `--text`                                     | `#1A1D21`                                | Primary text (near-black)                                                                                                      |
| `--text-dim`                                 | `#5D646C`                                | Secondary text, captions (AA on all three surfaces)                                                                            |
| `--accent`                                   | `#49970A`                                | THE accent (grass green): button fills, progress fills, streak dots and flame, the toggle's on state, active tab icon          |
| `--accent-pressed`                           | `#37740A`                                | Pressed state, the solid underside every button sits on, and any **small** text on an accent fill (see "The large-label rule") |
| `--accent-text`                              | `#2F7300`                                | Accent used _as text or small icons_ on light bg. Always use this darker step for text and strokes                             |
| `--accent-bright`                            | `#A3E635`                                | Lime. **Decoration only**: the session-summary bloom, and nothing else. Never text, never state (see "Accent split")           |
| `--on-accent`                                | `#FFFFFF`                                | Text on accent-filled surfaces                                                                                                 |
| `--success`                                  | `#4C9426`                                | Correct answers, mastered checks. Leaf green: warm on purpose, kept apart from the accent by role, not hue (see below)          |
| `--danger`                                   | `#D13B35`                                | Wrong answers (used gently. Border/tint, never full red panels)                                                                |
| `--info`                                     | `#1B6D93`                                | Ocean petrol blue. Links, ghost-button labels, the session bar, the concept chip's help mark, focus and selection outlines      |
| `--success-bg` / `--danger-bg` / `--info-bg` | the above at ~10% opacity on `--surface` | Feedback panel tints                                                                                                           |
| `--success-soft`                             | `--success` at 70% into `--surface`      | The graded box outline on a correct option, panel, cell, gap or row. Never the mark itself (see "Full strength and soft")       |
| `--danger-soft`                              | `--danger` at 70% into `--surface`       | The same outline on a wrong one                                                                                                |
| `--info-soft`                                | `--info` at 70% into `--surface`         | The same outline on a picked or aimed cell, and on the unsure/recovered panel. Focus rings stay full `--info`                   |

### Accent split

The accent is split by **job, not by hue**: `--accent` carries anything that means something, `--accent-bright` carries only decoration. Measurement forced this, and the rule is binding because breaking it silently reintroduces the exact bug it was written for. The original bright amber `#F59E0B` could do neither job on warm paper:

| Where it was used   | Measured                     | What went wrong                          |
| ------------------- | ---------------------------- | ---------------------------------------- |
| Primary button fill | 1.97:1 against `--bg`        | the control never sat forward            |
| Progress-bar fill   | 1.85:1 against `--surface-2` | the fill was invisible against its track |
| Toggle "on" state   | 2.15:1 against `--surface`   | the state could not be read              |

Its dark-brown label passed at 7.06:1, so the button cleared AAA on paper while reading as low contrast to every actual user. **The label was never the problem.** A bright fill on a bright ground is the problem, and the only fix is to darken the fill, at which point the label flips to white.

So: if an element encodes state, carries text, or has to be found, it takes `--accent`. If it is pure expression sitting beside text that already says the same thing, it may take `--accent-bright`. Today exactly one element qualifies: the summary bloom.

### The large-label rule

`--accent` is light on purpose: a darker green reads heavy, and heavy is what this palette was changed to get away from. White on it measures **3.67:1**, which is below the 4.5:1 that normal text needs but comfortably above the **3:1 that WCAG allows for large text**, defined as 18.66px bold or larger.

So the primary button's label is **19px at weight 800**, and that size is load-bearing rather than decorative. Shrink it and the label silently drops under its real threshold.

Two consequences, both enforced by `tokens.test.ts`:

1. Any button whose label sits on `--accent` must be 19px/800. That includes the session's confirm dialog, not just `.btn`.
2. Anything **small** on an accent fill takes `--accent-pressed` instead, which clears 4.5:1 under white. The review count badge is 12px, so it uses the deeper step. This is the same instinct as `--accent-text`: small things need more contrast, not less.

The test walks every rule in the app that sets `color: var(--on-accent)`, resolves a BEM modifier's type size from its base rule, and applies the 3:1 threshold only where the label is genuinely large and bold. It is written that way because both exceptions above were missed on the first pass, and a test that only checked the two known cases would not have found them.

### Full strength and soft

`--success` sat at teal for one release, on the rule that it had to stay clearly apart from `--accent` or "correct" would read as "the accent again". **That rule is retired.** The near-accent leaf green was put beside the accent, the collision was shown, and it was chosen anyway. Success and danger are warm now because that is what was picked, and the doc records the choice rather than the old reasoning.

What keeps success distinct from the accent is **role, not hue distance**:

- The accent **fills controls**: buttons, progress fills, the toggle's on state, the streak dots, the active tab icon. It is what you press.
- Success **never fills a control**. It appears only as a filled ring, a 10% tint and a soft outline, and only on a surface that has just been graded. It is what you read after you pressed something.

Two colours that look alike but never share a component do not blur, because nothing ever puts them side by side and asks the eye to tell them apart. Track colours still avoid green, for the separate reason given below.

`--info` moved with them, from steel `#12629E` to ocean petrol `#1B6D93`. With success out of teal, the cyan-adjacent range is free, and a cyan-leaning blue sits with leaf green and warm red where the old steel read cold beside them. `--info` is the one semantic colour that carries real text (links, ghost-button labels, the session bar), so it is held to the 4.5:1 text bar on all three surfaces rather than the 3:1 the other two get.

The second half of that: a state colour drawn **as a box outline around a state-tinted fill** takes the soft step (`--success-soft`, `--danger-soft`, `--info-soft`, each the full colour at 70% into `--surface`). A state colour that **is the mark** stays full strength: the filled radio ring, a chip fill, coloured text, a drawn glyph, the 3px edge on a concept-card note or a code block, and any outline that means attention rather than decoration (a capstone board error). The soft step sits on the 3:1 line deliberately, near it from either side: on `--surface` the three resolve to `#82b467` (2.42), `#df7672` (3.01) and `#5f99b3` (3.14). It is not carrying the verdict; the ring, the tint and the words all state it at full strength first, and the outline is only drawing the edge of the box they sit in. Drawing that edge at full strength doubles the same signal and turns a graded answer into a warning label.

Corollary for any new colour: a fill that carries text needs 4.5:1 against that text, and a fill that encodes state needs 3:1 against whatever sits behind it. On this warm ground, that puts every usable accent at full saturation and roughly 30-45% lightness. Warm hues cannot be both pale and legible here; do not try to recover brightness by lightening a fill.

Track identity colors (track cards, progress bars, lesson headers). Deep enough to read on light backgrounds: t1 orange `#C2410C`, t2 violet `#7C3AED`, t3 magenta `#BE185D`, t4 cyan `#0E7490`, t5 blue `#1D4ED8`, t6 teal `#0F766E`, t7 gold `#A16207`, t8 indigo `#4F46E5`, t9 slate `#475569`. **No track is green.** The accent owns that hue, and a track chip wearing the accent's colour stops reading as identity and starts reading as selection. Use at full strength only for small elements (icons, bar fills, 15px+ bold text); tint at ~8–10% for card backgrounds and icon chips. **Never carry track colour on a single edge of a rounded card.** A thick one-sided border cannot share the card's 16px radius, so the browser miters the join and the corners come to a point. Where colour must sit on an edge, square off that side's corners (as `.concept__say-line` does); otherwise give the colour a shape of its own.

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
- Border width: every box border is `--border-w` (2px), never a 1px hairline. A 1px stroke renders unevenly from screen to screen, and swept through a corner radius it is mostly antialiasing, so a coloured border (a graded answer option) looks denser at its four corners than along its sides. 2px removes that, and it matches the 2px ring an answer option already carries. The only 1px lines left in the app are the two full-width dividers, under the screen bar and above the tab bar: those are rules rather than box strokes, and 2px there reads heavy.
- Elevation: cards are `--surface` on `--bg` with a 2px `--border` **or** a soft shadow (`0 1px 3px rgba(31,36,48,.06), 0 4px 12px rgba(31,36,48,.05)`). Pick one per component and stay consistent; bottom sheet and modal get a stronger soft shadow. Never harsh black shadows.

## Core components

- **Primary button:** full-width, 52px tall, `--accent` bg, `--on-accent` (white) **19px/800** text (see "The large-label rule": the size is what makes the light fill legal), radius 14. It sits on a **solid 4px underside** (`box-shadow: 0 4px 0 var(--accent-pressed)`, a hard colour stop and never a blur) and on press travels down by exactly that 4px while the underside is removed, so the bottom edge lands where the shadow's was. A scale-down reads as the button shrinking away from the finger; travelling into its own shadow reads as the button being depressed, which is what actually happened. Secondary: `--surface` bg + `--border`, same underside in `--border`. Ghost: text-only `--info`, no underside. Under reduced motion the underside stays (it is shape, not motion) and only the travel is dropped.
- **Card:** `--surface`, radius 16, 16–20px padding, optional 2px border.
- **Track card:** uniform 2px `--border` and the soft shadow, never an accent edge. Identity is carried by an **icon chip**: a 40px (34px in the Home strip) rounded square, radius 12 (10), filled with a ~12% tint of the track colour, with the drawn icon at full strength inside it. The progress-bar fill repeats the colour. Two deliberate uses beat one smeared along a border.
- **Progress bar:** 6px tall, radius full, track `--surface-2`, fill = track color or accent; animate width 300ms ease-out.
  Track progress bars carry two stacked fills in that same 6px: the mastered fill at full track colour, over a
  "seen" fill at ~28% track colour mixed into `--surface-2`. Both are absolutely positioned from the left edge, so
  the wider seen layer reads as the ground the solid one advances across. The counts are always printed as text
  beside the bar, so the bar itself is `aria-hidden`.
- **Progress ring:** (Home CTA, session summary) 3–4px stroke, accent on `--surface-2` track.
- **Streak flame:** the one playful mascot-ish element. Inline SVG flame, accent-colored, subtle 1.5s ease pulse when today is done; grayed at `--text-dim` when today isn't done yet.
  The practiced days in the streak week are filled with the accent tint (`--accent-bg`, the accent at 16%), which is now visually close to `--success-bg`. That is accepted: the two never appear in the same component, or on the same screen. The streak week lives on Home and the success tint lives on a graded exercise, so no one ever sees them together and has to decide which is which.
- **Chips:** concept chip = the drawn help mark at 20px plus the words "Concept card", on `--surface-2` with a `--text-dim` label, no border, radius full, min-height 44px. The mark stays `--info` and is the only colour on it. Pressing recolours rather than moves: the fill steps to `--border`, the label to `--text`. **It is deliberately quiet.** The 44px footprint is what says it is tappable; a tint, an edge or an underside would put help in the same visual class as the primary button and pull the eye before the question has been read. **The label names the object, never the concept:** the concept's own name is the answer on "name the pattern" exercises, so no chip ever carries it. Option pills for parsons/blank = `--surface-2` + border, drag state lifts with slight scale + border-accent.
  Every draggable pill carries a 20px grip at its left edge (six dots, `--text-dim`, accent while dragging). It is the only thing on a pill that says it moves, and that it moves by being held: a row that responds to nothing but a drag, with nothing on it suggesting a drag, reads as a broken screen. The grip is a hint and not a handle, the whole pill stays the drag target. Drawn once in `SortableZone`, which every drag surface in the app goes through.
- **Answer options (mcq):** full-width cards, 14px radius, border `--border`; selected-correct → `--success-soft` border + `--success-bg`; selected-wrong → `--danger` equivalents + gentle 250ms shake. Never color before the user commits.
  Each option carries a 22px radio ring on the left (2px `--border`), and the answer area is headed by a small uppercase `--text-dim` label reading "Pick one", so a stack of full-width sentences reads as a set of choices rather than as prose. Once graded the ring fills with the state colour **at full strength**, keeping an inset ring of `--surface` inside it, while the card's own border takes the soft step: the ring is the mark, the border is only the edge of the box around it (see "Full strength and soft"). The complexity grid takes the label but no rings: a ring beside `O(n)` crowds a tile that is mostly notation.
  Pressing an option tints its border and ring `--accent` for as long as the finger is down. That is a press receipt, not a verdict, so it does not break the rule above: without it a tap that landed and a tap that did not look identical.
- **Bottom sheet** (concept card in-session): rounded-top 20px, drag handle, scrim `rgba(0,0,0,.5)`, spring-in 250ms.
- **Tab bar:** 5 items, inline SVG icons 24px, active = `--accent-text` icon + 11px label (the darker step; small glyphs need more weight than a fill does), inactive `--text-dim`; respects safe-area bottom inset; hidden during sessions.
- **Build mode board, chips and flow packets:** see docs/12 parts C and D; the motion tokens and restraint rules above govern it. The board is the one surface in the app that is not a white card: it stands in for a whiteboard, so it takes warm paper (`--paper`) with a faint dot grid, drawn connections in `--ink`, and chips as white cards with a warm edge. The paper tokens are measured against each other in `tokens.test.ts` exactly like the greys; the lane caption was drawn three steps lighter first, measured 2.51:1, and was darkened until it was legal rather than until it looked legal.
- **Code block:** `--surface-2`, 12px radius, 12px padding, mono 13.5, highlight theme matched to this palette (tune a Shiki/hljs _light_ theme's bg to `--surface-2`; keep token colors in the deep range of the track colors, no neon-on-white).

## Motion

- Durations: micro 150ms, standard 250ms, celebratory 400ms. Easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Session flow: next exercise slides in from right 250ms. Feedback panel slides up 250ms.
- Correct answer: option pops (scale 1 → 1.03 → 1) + success tint.
- Session complete: no particles. The celebration is the figures landing, not decoration on top of them. The XP total counts up from zero over ~700ms (quadratic ease out, tabular numerals so the line does not jitter) and overshoots to 1.035 once as it settles; a single soft `--accent` radial bloom breathes out behind it and is gone inside a second; the result dots cascade in left to right, 45ms apart. Nothing falls, nothing is thrown, and no celebration element outlives its animation.
- Wrong answer: 250ms horizontal shake, ±4px. No red flashes.
- Streak milestone (7/30): flame pulse + count-up animation on the number.
- All motion behind `prefers-reduced-motion` + the in-app toggle → fades only.

## Sound

Synthesised at runtime in `src/engine/feedback.ts`, so there is nothing to ship or cache. Behind the Sound toggle, and silent wherever the browser lacks a node.

- **Level:** quiet. Peaks sit near 0.09 of full scale for a correct answer and 0.06 for a miss. The cue reads as expensive because of what it is, not how loud it is. A `tanh` soft clip on the master catches stacked peaks. Not a `DynamicsCompressor`: Chrome's costs around 7dB even on material far below its threshold.
- **Correct:** A4 up to E5 through the third, pitched low and rounded off with triangles: more wood than glass. A low E under it for weight, an A5 over it for sparkle, and a long hall behind all of it. About 1.6s to silence. Chosen by ear in the sound studio over six alternatives.
- **Per cue, not global:** each cue carries its own treatment. The correct answer is wide and wet by choice; the same hall on a miss would make it an event rather than a shrug.
- **Wrong:** one low A, a small fall in pitch, mostly dry, gone in 0.2s. A shrug, never a buzzer.
- **Session complete:** a fast run up the C scale landing on a held C6, over a low C, in the biggest room in the app. Roughly 2.6s, the longest cue by some way. The only place it plays is the summary screen, once on arrival.
- **Width:** notes above a whisper are stacked as two oscillators detuned a few cents apart and panned to opposite sides, and the room's two channels carry independent noise. That is where the size comes from. Where `StereoPannerNode` or `ConvolverNode` is missing the cue degrades to plain centred tones.
- **Envelope:** 12ms in, exponential out. A bell decays, a beep stops.

## Copy voice

Short, warm, adult. Sound like a sharp friend, not a teacher. Examples. Correct: "That's the one." / "Interviewer nods." Wrong: "Not this one. Here's the idea:" Unsure: "No stress. Here's how it works:" Streak: "Day 12. This is becoming a habit." Never: "Incorrect", "Oops!", "Great job!!!". No emoji anywhere: track and card identity is carried by a drawn icon and the track colour.

## Screens with prescribed layouts

Follow the wireframe descriptions in the product spec §Home/§Session. Anything unspecified: default to a single-column stack of cards with 12px gaps on `--bg`. When in doubt, remove elements rather than add.
