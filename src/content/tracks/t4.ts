import type { Exercise, Track } from '../types';

/**
 * Track 4 — Refactoring & code quality.
 *
 * Goal: the staged-interview reflex. Improve code out loud, in the right
 * order, and say *why* this move comes before that one.
 */

export const t4Exercises: Exercise[] = [
  {
    id: 't4-01',
    trackId: 't4',
    type: 'steps',
    difficulty: 1,
    conceptId: 'refactor-ladder',
    prompt: 'Put the refactoring ladder in the order an interviewer expects you to climb it.',
    steps: [
      'Make it work — get a correct answer for the normal case',
      'Make it right — handle the empty, single and awkward inputs',
      'Make it fast — only now look at the complexity',
      'Make it clear — name things properly and flatten the nesting',
      'Add types — pin down what goes in and what comes out',
    ],
    explanation:
      'Each rung depends on the one below. Optimising code that is still wrong bakes in the bug; adding types to code you are about to restructure is wasted work. Saying "it works, so the next thing is the edge cases" out loud is worth as much as doing it, because it shows you have an order rather than a pile of opinions.',
  },
  {
    id: 't4-02',
    trackId: 't4',
    type: 'ladder',
    difficulty: 1,
    conceptId: 'naming',
    prompt: 'It works. The interviewer asks: **what would you improve first?**',
    code: {
      lang: 'js',
      source: `function check(d) {
  if (d > 86400000) return 'stale';
  return 'fresh';
}`,
    },
    options: [
      { text: 'Name the magic number — `const ONE_DAY_MS = 86_400_000`', correct: true },
      {
        text: 'Add TypeScript types to the parameter and return',
        whyWrong:
          'Types are worth adding, but they are the last rung. Right now the reader cannot tell what the function *means*, and no type fixes that.',
      },
      {
        text: 'Replace the if/else with a ternary',
        whyWrong:
          'That is a style preference and changes nothing about clarity. The linter can have this argument; the interviewer is asking about meaning.',
      },
      {
        text: 'Memoize the result',
        whyWrong:
          'There is nothing expensive here — one comparison. Optimising a function that does no work is the definition of premature.',
      },
    ],
    explanation:
      'Naming a magic number is almost always the cheapest real improvement available. `86400000` forces the reader to do arithmetic to discover it means a day; `ONE_DAY_MS` says it outright. While you are there, `d` should be `ageMs` — both changes cost nothing and remove all the guesswork.',
  },
  {
    id: 't4-03',
    trackId: 't4',
    type: 'ladder',
    difficulty: 2,
    conceptId: 'dry',
    prompt: 'Both branches do the same work. **Best next move?**',
    code: {
      lang: 'js',
      source: `if (user.isAdmin) {
  log('access', user.id, Date.now());
  return adminView(user);
} else {
  log('access', user.id, Date.now());
  return userView(user);
}`,
    },
    options: [
      { text: 'Pull the duplicated `log` call out above the branch', correct: true },
      {
        text: 'Extract each branch into its own function',
        whyWrong:
          'The branches are already one call each — there is nothing inside them to extract. It is the line they *share* that is duplicated.',
      },
      {
        text: 'Add a comment noting the logging is intentional',
        whyWrong:
          'A comment explaining duplication is a sign the duplication should go. When someone edits one copy later, the comment will not stop them missing the other.',
      },
      {
        text: 'Replace the if/else with a lookup object',
        whyWrong:
          'Reasonable for many branches, overkill for two — and it still leaves the logging duplicated inside whatever the lookup returns.',
      },
    ],
    explanation:
      'The `log` call is identical in both branches, so it belongs above them where it runs once. This is real duplication rather than coincidental similarity: it is the same logic for the same reason, so a change to it must apply to both — which is exactly the case DRY is about.',
  },
  {
    id: 't4-04',
    trackId: 't4',
    type: 'ladder',
    difficulty: 2,
    conceptId: 'guard-clause',
    prompt: 'Four levels of nesting. **Best next move?**',
    code: {
      lang: 'js',
      source: `function getCity(user) {
  if (user) {
    if (user.active) {
      if (user.address) {
        return user.address.city;
      }
    }
  }
  return null;
}`,
    },
    options: [
      { text: 'Invert the conditions into guard clauses that return early', correct: true },
      {
        text: 'Combine them into one `if` with `&&`',
        whyWrong:
          'Better than nesting, and a fair answer — but it puts every reason for failing on one line, so you cannot return a different result or message per case later.',
      },
      {
        text: 'Use optional chaining and return `user?.address?.city`',
        whyWrong:
          'Tempting and much shorter, but it quietly drops the `active` check — a behaviour change dressed as a refactor, which is the trap here.',
      },
      {
        text: 'Extract the body into a helper function',
        whyWrong:
          'That moves the nesting somewhere else rather than removing it. The helper would be just as deeply nested as what it replaced.',
      },
    ],
    explanation:
      'Guard clauses invert each condition and leave immediately: `if (!user) return null;` and so on. The happy path then sits unindented at the bottom, where it reads as the point of the function. Note the trap — optional chaining looks like the same thing but silently loses a rule.',
  },
  {
    id: 't4-05',
    trackId: 't4',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'guard-clause',
    prompt: 'Rebuild that function using guard clauses.',
    lines: [
      { code: 'function getCity(user) {', indent: 0 },
      { code: 'if (!user) return null;', indent: 1 },
      { code: 'if (!user.active) return null;', indent: 1 },
      { code: 'if (!user.address) return null;', indent: 1 },
      { code: 'return user.address.city;', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'if (user) return null;', indent: 1, distractor: true },
    ],
    explanation:
      'Each guard handles one reason to stop and returns straight away, so the real answer lands unindented at the end. The distractor drops the `!` — `if (user) return null` returns null for every valid user and the city only for missing ones, which is the exact inverse of the intent.',
  },
  {
    id: 't4-06',
    trackId: 't4',
    type: 'ladder',
    difficulty: 2,
    conceptId: 'refactor-ladder',
    prompt:
      'It works, and it is O(n²). The interviewer asks **"what next?"** What is the strongest move?',
    code: {
      lang: 'js',
      source: `function findDuplicate(items) {
  for (const item of items) {
    if (items.indexOf(item) !== items.lastIndexOf(item)) return item;
  }
  return null;
}`,
    },
    options: [
      {
        text: 'Nail down the behaviour on empty input and multiple duplicates first, then optimise',
        correct: true,
      },
      {
        text: 'Swap it for a Set straight away — it is obviously quadratic',
        whyWrong:
          'You will end up doing this, and it is right. But optimising before you have pinned the behaviour risks a faster function that returns something different, and you would not notice.',
      },
      {
        text: 'Add types to the parameter and return value',
        whyWrong:
          'Types are the last rung. They will not tell you what this should return for an empty array, which is the open question.',
      },
      {
        text: 'Rename `items` to something more descriptive',
        whyWrong:
          '`items` is perfectly clear. Renaming here is motion without progress while a real correctness question is sitting unanswered.',
      },
    ],
    explanation:
      'Make it right before you make it fast. What should this return for an empty array, or when there are two different duplicates? Once that is settled, the Set rewrite is safe because you know what you are preserving. Saying "let me pin the behaviour first" is a strong senior signal — it is the habit that stops fast, wrong code.',
  },
  {
    id: 't4-07',
    trackId: 't4',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'naming',
    prompt: 'A variable holds the number of days since the user last signed in. **Best name?**',
    options: [
      { text: '`daysSinceLastLogin`', correct: true },
      {
        text: '`d`',
        whyWrong:
          'Fine for a loop index living for two lines, useless here. Anyone reading the condition has to hunt for where it was assigned to learn what it means.',
      },
      {
        text: '`data`',
        whyWrong:
          'Says only that it is a value, which was never in doubt. `data`, `info` and `obj` are placeholders that survived into the commit.',
      },
      {
        text: '`numberOfDaysSinceTheUserLastLoggedIn`',
        whyWrong:
          'Complete but exhausting, and it will wrap awkwardly everywhere it is used. Names should be as long as they need to be and no longer.',
      },
    ],
    explanation:
      'A good name states the meaning and the unit — days, since what. Interviewers care because naming is the cheapest readability win there is and it is entirely within your control under pressure. It is also a small window into whether you write code other people have to maintain.',
  },
  {
    id: 't4-08',
    trackId: 't4',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'single-responsibility',
    prompt:
      'This function does three jobs. **Tap the line that belongs in a different function entirely.**',
    code: {
      lang: 'js',
      source: `function saveUser(user) {
  if (!user.email.includes('@')) throw new Error('bad email');
  db.insert('users', user);
  sendWelcomeEmail(user.email);
  return user.id;
}`,
    },
    buggyLineIndex: 3,
    lineHints: {
      1: 'Validating before saving is defensible — many teams keep a cheap guard right here.',
      2: 'Inserting the user is the one job this function is actually named for.',
      4: 'Returning the new id is exactly what a save function should hand back.',
    },
    explanation:
      'Sending an email is not saving a user. It fails for unrelated reasons, it is slow, it is hard to test, and it makes `saveUser` do something its name never promised. Move it out — the caller can send the email, or better, the save can publish an event and something else can listen.',
  },
  {
    id: 't4-09',
    trackId: 't4',
    type: 'ladder',
    difficulty: 3,
    conceptId: 'refactor-ladder',
    prompt:
      'You are shown an unfamiliar function and asked to improve it. **What do you do first?**',
    options: [
      {
        text: 'Say out loud what it does and what is wrong with it, before changing anything',
        correct: true,
      },
      {
        text: 'Start rewriting immediately — showing beats telling',
        whyWrong:
          'Silent rewriting reads as guessing. The interviewer cannot tell whether you spotted the real problem or are shuffling code, and if you misread it you find out very late.',
      },
      {
        text: 'Ask them to explain what the function is supposed to do',
        whyWrong:
          'One clarifying question is fine, but handing back the whole reading task looks like you cannot read unfamiliar code — which is much of the job.',
      },
      {
        text: 'Add tests before touching it',
        whyWrong:
          'Genuinely good practice, and worth mentioning. But in a short interview it burns the clock, and they asked for a critique rather than a safety net.',
      },
    ],
    explanation:
      'The order is diagnose, then treat. "This builds a lookup inside the loop, so it is quadratic — I would hoist it into a Set first, then handle the empty case, then add types" tells them everything: that you read it, spotted the cost, and have a plan with an order. The code you write afterwards is confirmation rather than exploration.',
  },
  {
    id: 't4-10',
    trackId: 't4',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'pure-functions',
    prompt:
      'Should `addItem` push onto the array it was given, or return a new one? **What is the senior answer?**',
    options: [
      {
        text: 'Return a new array — the caller does not expect their data to change underneath them',
        correct: true,
      },
      {
        text: 'Mutate it — copying wastes memory',
        whyWrong:
          'The copy is real but almost always irrelevant next to the debugging cost of action-at-a-distance. Where it does matter, that is a measured decision worth stating.',
      },
      {
        text: 'Mutate it and also return it, so both styles work',
        whyWrong:
          'The worst of both. Returning a value implies purity, so callers assume the original is untouched — and are wrong. Ambiguous contracts cause the bugs.',
      },
      {
        text: 'It makes no difference as long as it is documented',
        whyWrong:
          'Documentation does not travel with the value. The next person sees `addItem(cart, x)` at a call site, not the docblock.',
      },
    ],
    explanation:
      'A function that returns a new array is pure: same input, same output, nothing changed elsewhere. That makes it trivially testable and safe to call from anywhere. Mutation is legitimate in a hot loop over a large array — but then say so, and make the name announce it, like `pushItem`.',
  },
  {
    id: 't4-11',
    trackId: 't4',
    type: 'blank',
    difficulty: 2,
    conceptId: 'naming',
    prompt: 'Extract the magic number into a named constant.',
    template: `const ____ = 86_400_000;

function isStale(ageMs: number): ____ {
  return ageMs > ONE_DAY_MS;
}`,
    gaps: ['ONE_DAY_MS', 'boolean'],
    bank: ['ONE_DAY_MS', 'boolean', 'oneDayMs', 'number', 'string'],
    explanation:
      'Module-level constants are conventionally SCREAMING_SNAKE_CASE, and the unit belongs in the name — `ONE_DAY` alone would leave you guessing between seconds and milliseconds. The return type is `boolean` because the function answers a yes-or-no question, which the `is` prefix already promised.',
  },
  {
    id: 't4-12',
    trackId: 't4',
    type: 'steps',
    difficulty: 3,
    conceptId: 'review-script',
    prompt: "You are asked to review a colleague's code out loud. **Put it in order.**",
    steps: [
      'Say what the code is trying to do, so they know you read it',
      'Raise anything that is actually incorrect or unsafe',
      'Then readability — naming, nesting, functions doing too much',
      'Then performance, if it will matter at this scale',
      'Leave pure style to the linter',
    ],
    explanation:
      'The order signals what you think matters. Opening with a style nit tells everyone you either did not read it or did not understand it. Opening with the intent proves you did, and it makes the correctness point that follows land as help rather than an attack. This is a communication exercise as much as a technical one.',
  },
];

export const t4: Track = {
  id: 't4',
  title: 'Refactoring & code quality',
  emoji: '🪜',
  tagline: 'Improve code out loud, in the right order.',
  lessons: [
    { id: 't4-l1', title: 'The ladder', exerciseIds: ['t4-01', 't4-02', 't4-03'] },
    { id: 't4-l2', title: 'Leaving early', exerciseIds: ['t4-04', 't4-05', 't4-06'] },
    { id: 't4-l3', title: 'One job, good name', exerciseIds: ['t4-07', 't4-08', 't4-11'] },
    { id: 't4-l4', title: 'Critique out loud', exerciseIds: ['t4-09', 't4-10', 't4-12'] },
  ],
};
