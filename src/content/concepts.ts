import type { ConceptCard } from './types';

/**
 * Concept cards — the plain-words layer. Every exercise links to one, and the
 * rule from docs/00 is absolute: someone who has never heard the term must be
 * able to read the card and then answer the exercise. Analogy first, formal
 * term second, never the other way round.
 *
 * M1 authors Track 1's cards; Tracks 2–6 follow in M4.
 */
export const conceptCards: ConceptCard[] = [
  {
    id: 'big-o',
    title: 'Big-O (how work grows)',
    emoji: '📈',
    trackIds: ['t1'],
    plainWords:
      'Big-O describes how much *more* work a function does when you give it more input. It ignores exact seconds and asks one question: if the input doubles, what happens to the work?',
    analogy:
      'Think about handing out flyers. If you hand one to every person on the street, twice the people means twice the walking. But if you shout once through a megaphone, it costs you the same whether ten people are listening or ten thousand. Same goal, completely different way of growing.',
    interviewerSays: [
      "what's the complexity?",
      'how does this scale?',
      'it grows linearly',
      "what's the Big-O of this?",
    ],
    example: {
      lang: 'js',
      source: `// visits every item once → work grows with the list
for (const item of items) {
  total += item.price;
}`,
    },
    exampleCaption: 'One pass over the list: double the items, double the work.',
    sayThis: [
      'It grows linearly — double the input, double the work.',
      'This is O(n): the work is proportional to the size of the list.',
    ],
    related: ['log-n', 'hidden-loops', 'space-time', 'perf-script'],
  },
  {
    id: 'log-n',
    title: 'O(log n) and binary search',
    emoji: '✂️',
    trackIds: ['t1'],
    plainWords:
      'O(log n) means every step throws away half of what is left. Because the pile shrinks so fast, even an enormous input only needs a handful of steps.',
    analogy:
      'Guess the number I am thinking of between 1 and 1000. If you guess 500 and I say "higher", you just eliminated 500 numbers with one guess. Ten guesses covers a thousand numbers; twenty covers a million. That is why halving is so powerful.',
    interviewerSays: [
      'can you do better than linear?',
      'the input is sorted…',
      'how many steps for a million items?',
    ],
    example: {
      lang: 'js',
      source: `while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}`,
    },
    exampleCaption: 'Each pass discards half the range, so the range collapses fast.',
    sayThis: [
      "It's O(log n) — each step halves what's left, so a million items takes about twenty steps.",
      'Since the input is sorted, I can binary search instead of scanning.',
    ],
    related: ['big-o', 'sort-cost'],
  },
  {
    id: 'sort-cost',
    title: 'The cost of sorting',
    emoji: '🔤',
    trackIds: ['t1'],
    plainWords:
      'Sorting is not free — the usual cost is O(n log n). If your solution sorts first and then walks the list once, the sort is the expensive part and the walk barely registers.',
    analogy:
      'Alphabetising a shoebox of index cards takes real effort. Once they are in order, finding any single card is quick. But you paid for that speed up front, and the cost of ordering the box is bigger than the cost of pulling one card out of it.',
    interviewerSays: ['what does the sort cost you?', "you sorted — what's the complexity now?"],
    example: {
      lang: 'js',
      source: `const sorted = [...nums].sort((a, b) => a - b); // O(n log n)
for (const n of sorted) {                        // O(n)
  if (n > limit) return n;
}`,
    },
    exampleCaption: 'The sort dominates: O(n log n) + O(n) is just O(n log n).',
    sayThis: [
      "Sorting dominates here — it's O(n log n), and the scan afterwards is only O(n), so overall it's O(n log n).",
      'When you add two costs, the bigger one wins — the small one disappears.',
    ],
    related: ['big-o', 'log-n'],
  },
  {
    id: 'hidden-loops',
    title: 'Hidden loops',
    emoji: '🕳️',
    trackIds: ['t1'],
    plainWords:
      'Some methods look like one quick call but secretly walk the entire list. Put one of those inside a loop and you have two loops, even though you only typed one.',
    analogy:
      'Imagine checking "is this name on the guest list?" by reading the list from the top every single time. One question looks quick. A hundred questions means reading the whole list a hundred times, and nobody watching would call that one job.',
    interviewerSays: [
      "there's a hidden loop here",
      "what's the real complexity?",
      'what is includes actually doing?',
    ],
    example: {
      lang: 'js',
      source: `// looks like one loop, is really two
for (const name of guests) {
  if (banned.includes(name)) reject(name);
}`,
    },
    exampleCaption: '`includes` scans `banned` every time, so this is O(n·m), not O(n).',
    sayThis: [
      '`includes` is itself O(n), so calling it inside a loop makes this quadratic.',
      "There's a hidden loop — `indexOf` re-scans the array on every iteration.",
    ],
    related: ['big-o', 'hash-lookup', 'perf-script'],
  },
  {
    id: 'hash-lookup',
    title: 'Hash maps and Sets',
    emoji: '🎫',
    trackIds: ['t1'],
    plainWords:
      'A Set or a Map finds something in one step, no matter how much is stored in it. Instead of searching, it computes where the item must be and looks straight there.',
    analogy:
      'A coat check at a theatre. You do not search the racks for your coat — the number on your ticket tells you exactly which hook to go to. A thousand coats is no slower than ten, because you never look at the coats you do not want.',
    interviewerSays: [
      'instant lookup',
      'trade memory for speed',
      'is there a data structure that would help?',
    ],
    example: {
      lang: 'js',
      source: `const banned = new Set(bannedList); // built once
for (const name of guests) {
  if (banned.has(name)) reject(name);  // O(1) each
}`,
    },
    exampleCaption: 'Same job as the hidden-loop example, but O(n) instead of O(n·m).',
    sayThis: [
      "I'd put them in a Set so lookups are O(1) instead of scanning the array each time.",
      'That trades a little memory for a lot of speed.',
    ],
    related: ['hidden-loops', 'space-time', 'big-o'],
  },
  {
    id: 'space-time',
    title: 'Space and time trade off',
    emoji: '⚖️',
    trackIds: ['t1'],
    plainWords:
      'You can usually make code faster by letting it use more memory, or shrink its memory by letting it run slower. Interviewers want you to name the trade you just made.',
    analogy:
      'Keeping a shopping list on the fridge costs you a scrap of paper, but saves you walking to the cupboard every time you wonder whether you need milk. The paper is the memory. The saved walk is the time.',
    interviewerSays: [
      "what's the memory cost?",
      'what did you trade?',
      'can you do it in constant space?',
    ],
    sayThis: [
      'I traded O(n) extra memory for the Set to get lookups from O(n) down to O(1).',
      "It's faster, but it now holds a second copy of the data — worth naming if memory is tight.",
    ],
    related: ['hash-lookup', 'memoization', 'big-o'],
  },
  {
    id: 'amortized',
    title: 'Amortized cost',
    emoji: '🚌',
    trackIds: ['t1'],
    plainWords:
      'Some operations are almost always cheap but occasionally expensive. Amortized cost is the average across many operations, which is why we say "O(1) amortized" instead of pretending the expensive case never happens.',
    analogy:
      'A minibus picks people up instantly while it has seats. When it fills, everyone has to move to a bigger bus, which is slow. That swap is rare enough that the average wait stays short — but it would be dishonest to say it never happens.',
    interviewerSays: ['why is push O(1)?', "isn't it sometimes slower than that?"],
    example: {
      lang: 'js',
      source: `const out = [];
for (const x of items) {
  out.push(x); // usually instant; occasionally the array grows
}`,
    },
    exampleCaption: 'Growing happens rarely, and the cost spreads across all the cheap pushes.',
    sayThis: [
      'Push is O(1) amortized — it occasionally has to grow the array, but that cost spreads across all the cheap pushes.',
    ],
    related: ['big-o'],
  },
  {
    id: 'pragmatic-perf',
    title: 'When performance actually matters',
    emoji: '🎚️',
    trackIds: ['t1'],
    plainWords:
      'Big-O only starts to bite when the input gets big. An O(n²) loop over 100 items finishes before you blink; the same loop over a million items will not finish today.',
    analogy:
      'Walking is a perfectly good way to cross a room and a hopeless way to cross a country. The method did not get worse — the distance changed. Asking "how big does this get?" is what tells you which situation you are in.',
    interviewerSays: [
      'is this fast enough?',
      'premature optimization',
      'would you optimize this?',
      'how big does n get?',
    ],
    sayThis: [
      "It's O(n²), but n is around 100 here, so it's fine — I'd keep it readable unless we expect the input to grow.",
      "Before optimizing I'd want to know how big n actually gets in practice.",
    ],
    related: ['big-o', 'perf-script'],
  },
  {
    id: 'memoization',
    title: 'Memoization',
    emoji: '🗒️',
    trackIds: ['t1'],
    plainWords:
      'Memoizing means remembering an answer the first time you work it out, so that the next time the same question comes up you just look it up instead of redoing the work.',
    analogy:
      'You work out a hard sum on paper, then write the answer on a sticky note. When someone asks you the same sum an hour later, you read the note. The sum has not got easier — you just stopped doing it twice.',
    interviewerSays: ['only computed once', 'cache the result', "don't repeat that call"],
    example: {
      lang: 'js',
      source: `const cache = new Map();
const fib = (n) => {
  if (n < 2) return n;
  if (cache.has(n)) return cache.get(n);
  cache.set(n, fib(n - 1) + fib(n - 2));
  return cache.get(n);
};`,
    },
    exampleCaption: 'Without the cache this recomputes the same values an absurd number of times.',
    sayThis: [
      "I'd memoize it — cache each result so we never recompute the same input twice.",
      'That takes it from exponential down to linear.',
    ],
    related: ['hash-lookup', 'space-time'],
  },
  {
    id: 'perf-script',
    title: 'Talking about performance',
    emoji: '🎙️',
    trackIds: ['t1'],
    plainWords:
      'There is a script interviewers expect when they ask about speed: name the complexity, say it in plain words, point at the line that costs the most, then say what you would change.',
    analogy:
      'It is how a doctor talks through an X-ray. They name what they see, put it in ordinary words, point at the spot that worries them, and only then propose the treatment. Jumping straight to the treatment makes everyone nervous, even when it is the right one.',
    interviewerSays: [
      'how does this scale?',
      'walk me through the complexity',
      'how would you speed this up?',
    ],
    sayThis: [
      "Right now it's O(n²) — for every item we scan the whole list again.",
      'The bottleneck is the inner `includes`. If I put those values in a Set, lookups become O(1) and the whole thing drops to O(n).',
    ],
    related: ['big-o', 'pragmatic-perf', 'hidden-loops'],
  },
];
