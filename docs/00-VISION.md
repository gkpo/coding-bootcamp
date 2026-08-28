# 00, Vision

## One-liner

Duolingo for coding interviews: 5-minute daily reps on your phone that turn interview patterns, vocabulary, and communication into second nature.

## The user

Anyone training for coding interviews, with content currently tuned to full stack JS/TS roles. Single-user by design for now: built for one person's daily practice, not a classroom. The premise: interview performance is a skill of its own, separate from engineering ability, and like any skill it is built and kept sharp with regular repetitions. The reps target:

1. **Pattern blindness under pressure.** Given "make change for an amount with these coin denominations", you invent an ad-hoc loop instead of recognizing "this is the greedy pattern (and its dynamic-programming sibling when greedy fails)". Interviews reward recognizing the problem's _shape_ in the first 60 seconds.
2. **Vocabulary gaps.** You can see a function is inefficient, but the interviewer is waiting for the words "it grows linearly / it's O(n)". Interviewers often score you on saying the canonical term.
3. **Prompt decoding.** "A function that remembers" = closure. Interviewers speak in riddles; each riddle has a canonical answer.
4. **Staged interviews.** Real interviews escalate: "make it work → make it right → make it fast → add types". That takes reflexes for _incrementally improving_ code out loud, not just solving from scratch.
5. **System design** rounds for full stack roles: the standard vocabulary (load balancer, cache-aside, fan-out, idempotency…) and the standard "how to walk through a design" script.

## Product principles

1. **Reps over depth.** Many small exercises beat few big ones. A session is 5–10 exercises, finishable while commuting. The win condition is _recognition speed_, not novel problem solving.
2. **Recognition, not typing.** You cannot write code on a phone, and you don't need to. Every mechanic is tap, drag, or choose. The skill trained is "look at problem → name the pattern → know the next move", which is exactly what breaks down under interview pressure.
3. **Never assume a known term.** Every exercise links to a plain-words concept card. Cards lead with an analogy and everyday language, formal term second. A dedicated "Interview decoder" track maps interviewer phrases → expected answers.
4. **The interviewer's voice is in the app.** Exercises are framed the way interviewers frame them ("how does this scale?", "what's the complexity here?", "can you make this cleaner?") so the phrasing itself becomes familiar.
5. **Progress must be felt.** Streaks, XP, per-track progress bars, a review pile that visibly shrinks. Missed items come back via spaced repetition until they stick.
6. **Beautiful enough to open daily.** An app that isn't pleasant to look at doesn't get opened, and an app that doesn't get opened teaches nothing. Design system doc is binding.

## Non-goals (v1)

- No typing/executing real code, no embedded editor, no code runner.
- No backend, accounts, or sync: single device, `localStorage`. (Export/import of progress as a JSON blob is a cheap escape hatch; roadmap has it as a stretch.)
- No other languages than JS/TS.
- No user-generated content or content-authoring UI.
- No LeetCode-style hard algorithm grinding. Target is the pragmatic full stack interview: patterns, Big-O talk, JS/TS internals, refactoring, system design basics.

## Success criteria

- It opens on a phone in dead time without friction (PWA on home screen, loads instantly, works offline).
- After 2–3 weeks of daily use: naming the pattern for a fresh problem statement in under a minute, describing complexity in interviewer-approved words, decoding common interviewer riddles.
- Nothing in the app ever makes you feel dumb: wrong answers get a warm, plain-words explanation and a "you'll see this again". The Duolingo tone, not the exam tone.
