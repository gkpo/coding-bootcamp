# 01, Product spec

## Screen map

```
Home (daily hub)
├── Session player (the core loop: one exercise at a time)
│   └── Session summary (XP earned, streak, mistakes recap)
├── Tracks (the path: browse tracks → lesson stations → exercises)
├── Review (spaced-repetition pile)
├── Cheat sheets (browsable concept card library + search)
└── Profile/Stats (streak calendar, XP, per-track mastery, settings)
```

Navigation: bottom tab bar with 5 tabs: **Home, Tracks, Review, Sheets, Me**. Session player is a full-screen modal flow on top (no tab bar while in a session; X button to abandon with confirmation).

## Home screen

The screen the user sees every morning. Contents, top to bottom:

1. **Streak header**. Flame icon + day count, plus a 7-day dot row (filled = practiced that day).
2. **Primary CTA: "Daily session"**. One big button. The daily session is auto-composed (see below). Shows estimated time ("~6 min") and a progress ring if partially done.
3. **Review nudge**. If the review pile has due items: "8 items due for review" card with a secondary CTA. Review items also get mixed into the daily session automatically, so this card is for people who want to clear the pile explicitly.
4. **Track progress strip**. Horizontally scrollable cards, one per track, each with icon, name, and a progress bar. Tapping opens that track.
5. **"Concept of the day"**. One cheat-sheet card surfaced daily (rotates through cards the user hasn't mastered). One tap flips it open.

## The daily session (core loop)

Auto-composed, ~8 exercises:

- Up to 3 **due review items** (spaced repetition, any track).
- ~4 **exercises the user has never seen** from their least-advanced tracks (round-robin so tracks progress together; slight bias toward the track the user last opened). The frontier only ever introduces: anything already presented comes back through the review line above, when spaced repetition says it is due.
- 1 **vocabulary/decoder item** (Track 6). Always, because decoder items are the highest-leverage gap and they're fast.

Session player behavior:

- One exercise per screen. Progress bar at top (segments = exercises). No timer in normal mode. Pressure is the enemy of learning. (A "Speed round" toggle exists in settings for later; not v1-blocking.)
- **Answer → immediate feedback.** Correct: green flash, short affirmation, "Continue". Wrong: the UI shows the correct answer, plus an **explanation panel in plain words** (2–4 sentences, always authored per-exercise), plus a link "Read the concept card →".
- **"I'm not sure" button** on every exercise (in addition to answering). It reveals the answer + explanation, counts as a miss for spaced repetition, but with gentler copy ("No stress. Here's the idea"). This prevents guess-gambling from corrupting the learning signal.
- Wrong/unsure items are **re-queued at the end of the same session** (Duolingo-style: you must get it right once before the session completes).
- Every exercise screen has a small **"?" chip** next to the prompt: opens the linked concept card in a bottom sheet _without_ leaving or failing the exercise. Reading the card before answering is allowed and encouraged. This is a learning app, not an exam.
- The chip is the icon alone, never the concept's name. On a "name the pattern" exercise the concept title _is_ the answer ("Sliding window", "Guard clauses", "Idempotency"), and everywhere else printing it decodes the interviewer's riddle before the user has had a go at it (vision, gap 3). The help stays one tap away; it is just never given away unasked.

### Session summary screen

- XP earned (see gamification), streak status ("Day 12 🔥"), items answered right/wrong.
- "Toughest moment". The exercise with most retries, with one-line takeaway.
- If any concept card was opened or linked from a miss: "Concepts touched today" chips linking to the sheets.

## Gamification

Keep it honest and lightweight:

- **XP:** +10 per exercise solved first try, +5 solved after retry/unsure, +5 bonus per completed session, +10 streak bonus at 7/30-day marks. XP is cosmetic (lifetime number + weekly bar on profile). No leagues, no leaderboards (single user).
- **Streak:** a day counts if ≥1 session completed. One "streak freeze" earned per 7-day streak, auto-consumed on a missed day, max 2 banked. Local-timezone day boundary.
- **Track mastery:** an exercise is _mastered_ when its spaced-repetition box ≥ 4 (see below).
  Each track's bar carries two layers: a pale fill for exercises seen at least once, and a
  solid fill for the mastered ones, labelled "9 of 26 seen · 2 mastered". Mastery alone is
  not a usable progress signal early on: the box intervals put the earliest possible mastery
  eleven days after an exercise is first seen, so a mastery-only bar reads 0% through the
  whole first fortnight of daily use and looks like lost work. The pale layer moves from the
  first session; the solid layer keeps its strict meaning.
- **Concept card mastery:** a card is "known" when all exercises linked to it are mastered; the Sheets tab shows known cards with a subtle check.

## Spaced repetition (Leitner boxes)

Simple, explainable, no SM-2 tuning:

- Every exercise has a box 0–5. New = box 0.
- Correct first-try → box +1. Wrong or "not sure" → box = max(box−2, 0) _(drop two boxes: misses on old material must come back fast)_.
- Due schedule by box: 0 = now, 1 = +1 day, 2 = +3 days, 3 = +7 days, 4 = +16 days, 5 = +35 days.
- The Review tab lists due items grouped by track; a "Review all" button runs them as a session.
- Variant-aware: where an exercise defines prompt variants (see data schemas), reviews shuffle option order and can swap in a variant so the user learns the concept, not the answer's position.

## Cheat sheets (concept cards)

The core requirement: **a quick way to understand a concept in simple words.**

Card anatomy (all fields authored per card, see schemas doc):

1. **Title + icon**, e.g. "Closure" with the key icon.
2. **In plain words**: 1–2 sentences, zero jargon. _"A function that carries a backpack: it keeps access to the variables that existed where it was created, even after that place is gone."_
3. **The analogy**. One concrete everyday image, expanded to 2–3 sentences.
4. **Interviewer says…**. The riddle phrases that map to this concept: _"a function that remembers", "how would you keep this variable private?"_. This field is the decoder ring and is searchable.
5. **Tiny example**: ≤ 8 lines of JS/TS, syntax highlighted, with a one-line caption.
6. **Say this in the interview**: 1–2 canonical sentences to literally say out loud: _"I'd use a closure so the counter variable stays private to the function."_
7. **Related cards**. Chips linking to siblings (e.g. Closure ↔ Scope ↔ Module pattern).

Sheets tab: cards grouped by track, fuzzy search across title + "interviewer says" phrases + plain-words text. Cards open as full screens with generous typography. They must be pleasant to read on a phone in a queue.

## Empty/edge states

- First launch: 3-screen intro (what this is, how sessions work, pick nothing, no config), then straight into a first session that starts with two easy wins.
- Review pile empty: "Nothing due. Come back tomorrow or learn something new →" (link to Tracks).
- All content mastered (far future): congratulate + point at re-running speed rounds.
- Abandon session: progress within the session is discarded, but per-exercise results already given are kept (boxes updated). Copy makes that clear.

## Settings (Me tab)

Minimal: sound on/off, haptics on/off, reduce motion, reset progress (double confirm), export/import progress JSON (stretch), about/version.
