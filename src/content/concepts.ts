import type { ConceptCard } from './types';

/**
 * Concept cards: the plain-words layer. Every exercise links to one, and the
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
    icon: 'growth',
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
      source: `// visits every item once, so work grows with the list
for (const item of items) {
  total += item.price;
}`,
    },
    exampleCaption: 'One pass over the list: double the items, double the work.',
    sayThis: [
      'It grows linearly. Double the input, double the work.',
      'This is O(n): the work is proportional to the size of the list.',
    ],
    related: ['log-n', 'hidden-loops', 'space-time', 'perf-script'],
  },
  {
    id: 'log-n',
    title: 'O(log n) and binary search',
    icon: 'halve',
    trackIds: ['t1', 't2'],
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
      "It's O(log n). Each step halves what's left, so a million items takes about twenty steps.",
      'Since the input is sorted, I can binary search instead of scanning.',
    ],
    related: ['big-o', 'sort-cost'],
  },
  {
    id: 'sort-cost',
    title: 'The cost of sorting',
    icon: 'sort',
    trackIds: ['t1'],
    plainWords:
      'Sorting is not free. The usual cost is O(n log n). If your solution sorts first and then walks the list once, the sort is the expensive part and the walk barely registers.',
    analogy:
      'Alphabetising a shoebox of index cards takes real effort. Once they are in order, finding any single card is quick. But you paid for that speed up front, and the cost of ordering the box is bigger than the cost of pulling one card out of it.',
    interviewerSays: ['what does the sort cost you?', "you sorted. What's the complexity now?"],
    example: {
      lang: 'js',
      source: `const sorted = [...nums].sort((a, b) => a - b); // O(n log n)
for (const n of sorted) {                        // O(n)
  if (n > limit) return n;
}`,
    },
    exampleCaption: 'The sort dominates: O(n log n) + O(n) is just O(n log n).',
    sayThis: [
      "Sorting dominates here. It's O(n log n), and the scan afterwards is only O(n), so overall it's O(n log n).",
      'When you add two costs, the bigger one wins. The small one disappears.',
    ],
    related: ['big-o', 'log-n'],
  },
  {
    id: 'hidden-loops',
    title: 'Hidden loops',
    icon: 'loop',
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
      "There's a hidden loop: `indexOf` re-scans the array on every iteration.",
    ],
    related: ['big-o', 'hash-lookup', 'perf-script'],
  },
  {
    id: 'hash-lookup',
    title: 'Hash maps and Sets',
    icon: 'key',
    trackIds: ['t1', 't2'],
    plainWords:
      'A Set or a Map finds something in one step, no matter how much is stored in it. Instead of searching, it computes where the item must be and looks straight there.',
    analogy:
      'A coat check at a theatre. You do not search the racks for your coat. The number on your ticket tells you exactly which hook to go to. A thousand coats is no slower than ten, because you never look at the coats you do not want.',
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
    icon: 'balance',
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
      "It's faster, but it now holds a second copy of the data. Worth naming if memory is tight.",
    ],
    related: ['hash-lookup', 'memoization', 'big-o'],
  },
  {
    id: 'amortized',
    title: 'Amortized cost',
    icon: 'coins',
    trackIds: ['t1'],
    plainWords:
      'Some operations are almost always cheap but occasionally expensive. Amortized cost is the average across many operations, which is why we say "O(1) amortized" instead of pretending the expensive case never happens.',
    analogy:
      'A minibus picks people up instantly while it has seats. When it fills, everyone has to move to a bigger bus, which is slow. That swap is rare enough that the average wait stays short, but it would be dishonest to say it never happens.',
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
      'Push is O(1) amortized. It occasionally has to grow the array, but that cost spreads across all the cheap pushes.',
    ],
    related: ['big-o'],
  },
  {
    id: 'pragmatic-perf',
    title: 'When performance actually matters',
    icon: 'gauge',
    trackIds: ['t1'],
    plainWords:
      'Big-O only starts to bite when the input gets big. An O(n²) loop over 100 items finishes before you blink; the same loop over a million items will not finish today.',
    analogy:
      'Walking is a perfectly good way to cross a room and a hopeless way to cross a country. The method did not get worse. The distance changed. Asking "how big does this get?" is what tells you which situation you are in.',
    interviewerSays: [
      'is this fast enough?',
      'premature optimization',
      'would you optimize this?',
      'how big does n get?',
    ],
    sayThis: [
      "It's O(n²), but n is around 100 here, so it's fine. I'd keep it readable unless we expect the input to grow.",
      "Before optimizing I'd want to know how big n actually gets in practice.",
    ],
    related: ['big-o', 'perf-script'],
  },
  {
    id: 'memoization',
    title: 'Memoization',
    icon: 'note',
    trackIds: ['t1', 't3'],
    plainWords:
      'Memoizing means remembering an answer the first time you work it out, so that the next time the same question comes up you just look it up instead of redoing the work.',
    analogy:
      'You work out a hard sum on paper, then write the answer on a sticky note. When someone asks you the same sum an hour later, you read the note. The sum has not got easier. You just stopped doing it twice.',
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
      "I'd memoize it. Cache each result so we never recompute the same input twice.",
      'That takes it from exponential down to linear.',
    ],
    related: ['hash-lookup', 'space-time'],
  },
  {
    id: 'perf-script',
    title: 'Talking about performance',
    icon: 'speech',
    trackIds: ['t1', 't6'],
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
      "Right now it's O(n²). For every item we scan the whole list again.",
      'The bottleneck is the inner `includes`. If I put those values in a Set, lookups become O(1) and the whole thing drops to O(n).',
    ],
    related: ['big-o', 'pragmatic-perf', 'hidden-loops'],
  },
  // ---------------------------------------------------------------------
  // Track 2, Algorithm patterns
  // ---------------------------------------------------------------------
  {
    id: 'greedy',
    title: 'Greedy (take the best bite)',
    icon: 'coins',
    trackIds: ['t2'],
    plainWords:
      'A greedy method makes the choice that looks best right now and never looks back. It is fast and simple, and it is correct only when local best choices happen to add up to the overall best.',
    analogy:
      'Making change from a till: you reach for the biggest coin that still fits, then the next biggest, and so on. With ordinary coins that always gives the fewest coins. With an odd set of denominations it can leave you stuck, which is exactly why interviewers ask about it.',
    interviewerSays: ['fewest coins', 'locally best choice', 'can you do it greedily?'],
    example: {
      lang: 'js',
      source: `for (const coin of coins) {      // biggest first
  while (amount >= coin) {
    amount -= coin;
    out.push(coin);
  }
}`,
    },
    exampleCaption: 'Take the largest coin that fits, repeat. No backtracking.',
    sayThis: [
      'This looks greedy. Take the biggest coin that fits and repeat.',
      "Greedy is not always safe here: with denominations like 1, 3 and 4 it misses the best answer, so I'd reach for dynamic programming.",
    ],
    related: ['pattern-map', 'edge-cases'],
  },
  {
    id: 'sliding-window',
    title: 'Sliding window',
    icon: 'window',
    trackIds: ['t2'],
    plainWords:
      'Keep a stretch of the input, a window, and move its edges instead of starting over. Grow it from the right, shrink it from the left, and each item is looked at about twice instead of once per possible stretch.',
    analogy:
      'Reading a long sentence through a cardboard slot. Rather than lifting the card and repositioning it for every possible phrase, you slide it along: the right edge moves forward to take in a new word, and the left edge follows to drop one off the back.',
    interviewerSays: [
      'longest substring…',
      'rolling average',
      'within any window of…',
      'contiguous',
    ],
    example: {
      lang: 'js',
      source: `let start = 0;
for (let end = 0; end < s.length; end++) {
  while (seen.has(s[end])) seen.delete(s[start++]);
  seen.add(s[end]);
  best = Math.max(best, end - start + 1);
}`,
    },
    exampleCaption: 'The window grows at `end` and shrinks at `start`, one pass, O(n).',
    sayThis: [
      "The word contiguous points at a sliding window. I'd grow the right edge and pull the left edge in when the window breaks the rule.",
    ],
    related: ['pattern-map', 'two-pointers', 'frequency-map'],
  },
  {
    id: 'chunking',
    title: 'Chunking text',
    icon: 'halve',
    trackIds: ['t2'],
    plainWords:
      'Splitting a long piece of text into pieces no bigger than some limit. The interesting part is never the splitting. It is what you do when a cut would land in the middle of a word.',
    analogy:
      'Cutting a long ribbon into lengths that fit a box. Measuring the length is trivial; the care is in not cutting through the printed pattern, so you step back to the last clean gap and cut there instead.',
    interviewerSays: [
      'split into pieces of at most N',
      'without breaking words',
      'chunk this text',
    ],
    example: {
      lang: 'js',
      source: `let cut = text.lastIndexOf(' ', limit);
if (cut <= 0) cut = limit;   // one very long word
chunks.push(text.slice(0, cut));
text = text.slice(cut).trimStart();`,
    },
    exampleCaption: 'Walk back to the last space, unless there is no space to walk back to.',
    sayThis: [
      "I'd cut at the limit, then walk back to the last space so words stay whole.",
      'The edge case is a single word longer than the limit, then I have to cut it hard, or the loop never advances.',
    ],
    related: ['edge-cases', 'pattern-map'],
  },
  {
    id: 'two-pointers',
    title: 'Two pointers',
    icon: 'pointers',
    trackIds: ['t2'],
    plainWords:
      'Walk two positions through the data at once. Often one from each end, sometimes both from the front at different speeds. It replaces a nested loop with a single pass.',
    analogy:
      'Checking whether a word reads the same backwards by putting a finger on the first letter and another on the last, then walking them toward each other. You compare as you go and stop when your fingers meet.',
    interviewerSays: ['the array is sorted', 'from both ends', 'in place', 'without extra memory'],
    example: {
      lang: 'js',
      source: `let lo = 0, hi = s.length - 1;
while (lo < hi) {
  if (s[lo] !== s[hi]) return false;
  lo++; hi--;
}
return true;`,
    },
    exampleCaption: 'Two fingers walking inward: one pass, no extra memory.',
    sayThis: [
      "Since it's sorted, two pointers from both ends gets this in O(n) with no extra memory.",
    ],
    related: ['sliding-window', 'pattern-map'],
  },
  {
    id: 'frequency-map',
    title: 'Frequency counters',
    icon: 'sort',
    trackIds: ['t2'],
    plainWords:
      'Count how many times each thing appears by keeping a tally in an object or Map. One pass to count, then a second pass to answer whatever the question actually was.',
    analogy:
      'Counting votes by making a mark next to each name as you read the ballots, rather than re-reading the whole pile once per candidate. One trip through the box tells you everything.',
    interviewerSays: [
      'count occurrences',
      'first non-repeating',
      'is it an anagram?',
      'most common',
    ],
    example: {
      lang: 'js',
      source: `const counts = words.reduce((acc, w) => {
  acc[w] = (acc[w] ?? 0) + 1;
  return acc;
}, {});`,
    },
    exampleCaption: 'The `?? 0` is the whole trick: the first sighting starts at zero.',
    sayThis: [
      "I'd build a frequency map in one pass, then answer from the map in a second pass, O(n) overall.",
    ],
    related: ['hash-lookup', 'pattern-map'],
  },
  {
    id: 'bfs-mental-model',
    title: 'BFS and DFS in plain words',
    icon: 'graph',
    trackIds: ['t2'],
    plainWords:
      'Two ways to explore options. Breadth-first checks everything one step away, then everything two steps away, so the first time it reaches the goal, that path is the shortest. Depth-first follows one path all the way down before trying the next.',
    analogy:
      'Looking for a friend in a building. Breadth-first is checking every room on this floor before going upstairs. Depth-first is following one corridor to its very end, then backing up and taking the next turning.',
    interviewerSays: ['shortest path', 'explore all options', 'minimum number of steps'],
    sayThis: [
      'Minimum number of steps points at breadth-first search. The first time it reaches the goal, that is the shortest route.',
      "Depth-first is fine when I just need *a* path rather than the shortest one, and it's easier to write recursively.",
    ],
    related: ['recursion', 'pattern-map'],
  },
  {
    id: 'recursion',
    title: 'Recursion and the call stack',
    icon: 'loop',
    trackIds: ['t2'],
    plainWords:
      'A function that calls itself on a smaller piece of the problem until the piece is small enough to answer outright. Every call in progress is remembered on a stack, and that stack has a limit.',
    analogy:
      'Russian dolls. To count them you open the outer one and ask the same question of what is inside, and the answer comes back out layer by layer. Each doll you have opened is sitting on the table waiting. That pile is the call stack.',
    interviewerSays: [
      'what happens on very deep input?',
      'could you do it iteratively?',
      'stack overflow',
    ],
    example: {
      lang: 'js',
      source: `const depth = (node) =>
  node === null ? 0 : 1 + Math.max(depth(node.left), depth(node.right));`,
    },
    exampleCaption: 'The base case is what stops it. Without one it recurses until the stack dies.',
    sayThis: [
      'Recursion is the natural fit for a tree, but on very deep input it can blow the call stack, so an explicit stack or a loop is the safe version.',
    ],
    related: ['bfs-mental-model', 'memoization'],
  },
  {
    id: 'pattern-map',
    title: 'The pattern cheat table',
    icon: 'compass',
    trackIds: ['t2'],
    plainWords:
      'Most interview problems are a handful of shapes wearing different costumes. Recognising the shape in the first minute is worth more than any clever coding afterwards.',
    analogy:
      'A doctor hearing "sharp pain, left side, worse when breathing in" and immediately narrowing to a short list. They are not guessing. They have heard the pattern before and know which questions separate the possibilities.',
    interviewerSays: [
      'how would you approach this?',
      'what does this remind you of?',
      "what's the pattern here?",
    ],
    sayThis: [
      '"Have I seen this before?" is the first question. Sorted input suggests two pointers or binary search, contiguous suggests a sliding window, counting suggests a frequency map, and "seen before" suggests a Set.',
    ],
    related: ['greedy', 'sliding-window', 'two-pointers', 'frequency-map', 'hash-lookup'],
  },
  {
    id: 'edge-cases',
    title: 'The edge case checklist',
    icon: 'warning',
    trackIds: ['t2', 't6'],
    plainWords:
      'The handful of inputs that break code written for the normal case: nothing, one thing, enormous, repeats, and negatives or odd characters. Naming them unprompted is a strong interview signal.',
    analogy:
      'Testing a door by opening it empty-handed, then with an armful of shopping, then with a pram. The door works fine in the showroom; the awkward cases are where the design shows.',
    interviewerSays: ['any edge cases?', 'what if it is empty?', 'what could go wrong here?'],
    sayThis: [
      'Edge cases I would check: empty input, a single item, very large input, duplicates, and negatives or unicode.',
      'It is worth saying these out loud even if the code already handles them.',
    ],
    related: ['whiteboard-script', 'chunking'],
  },
  {
    id: 'whiteboard-script',
    title: 'Opening a whiteboard problem',
    icon: 'compass',
    trackIds: ['t2', 't6'],
    plainWords:
      'The first two minutes have a script: say the problem back in your own words, invent a tiny example, describe the obvious slow approach out loud, name the pattern, then plan the code. Silence is what sinks people, not difficulty.',
    analogy:
      'A carpenter given a drawing does not start cutting. They read it back to the client, sketch the joint on scrap, say how they would do it the plain way, and only then pick up the saw. Nobody watching thinks they are slow.',
    interviewerSays: [
      'walk me through your thinking',
      'how would you start?',
      'talk me through it',
    ],
    sayThis: [
      'Let me restate it to check I have it right, then try a small example.',
      "The brute force would be to check every pair. That's O(n²). Let me see whether a Set gets it down.",
    ],
    related: ['edge-cases', 'pattern-map', 'stuck-script'],
  },
  // ---------------------------------------------------------------------
  // Track 3, JS/TS language concepts
  // ---------------------------------------------------------------------
  {
    id: 'closure',
    title: 'Closure (the backpack)',
    icon: 'key',
    trackIds: ['t3'],
    plainWords:
      'A function that carries a backpack: it keeps access to the variables that existed where it was written, even after that place has finished running.',
    analogy:
      'You are handed a locker key when you leave a building. The building closes, everyone goes home, but your key still opens your locker and only yours. The function is the key; the locker is the variables it grew up with.',
    interviewerSays: [
      'a function that remembers',
      'how would you keep this private?',
      'why does it still have access?',
    ],
    example: {
      lang: 'js',
      source: `function makeCounter() {
  let count = 0;              // lives in the backpack
  return () => ++count;       // and the returned function keeps it
}
const next = makeCounter();
next(); // 1
next(); // 2`,
    },
    exampleCaption: '`count` survives because the returned function still holds a reference to it.',
    sayThis: [
      "I'd use a closure so the counter stays private to the function.",
      'The inner function closes over `count`, so it persists between calls without being global.',
    ],
    related: ['reference-value', 'debounce-throttle', 'memoization'],
  },
  {
    id: 'equality',
    title: '== versus === ',
    icon: 'balance',
    trackIds: ['t3'],
    plainWords:
      '`===` asks "are these the same type and the same value?". `==` first tries to convert one side to match the other, which produces some genuinely surprising answers.',
    analogy:
      'Comparing two passports. Triple equals checks the country and the number. Double equals will accept a driving licence if the number matches, and occasionally waves through a library card.',
    interviewerSays: ['why triple equals?', "what does '' == 0 give you?", 'type coercion'],
    example: {
      lang: 'js',
      source: `'' == 0            // true: '' converts to 0
'0' == 0           // true: '0' converts to 0
null == undefined  // true, a special case
null === undefined // false`,
    },
    exampleCaption: 'Every one of these is false with `===`, which is why it is the default.',
    sayThis: [
      "I use === by default so there's no hidden conversion. The one place == is idiomatic is checking for null or undefined together.",
    ],
    related: ['reference-value'],
  },
  {
    id: 'event-loop',
    title: 'The event loop',
    icon: 'clock',
    trackIds: ['t3'],
    plainWords:
      'JavaScript does one thing at a time. Work that has to wait goes on a to-do list, and the engine picks the next item only once the current one finishes. Promise callbacks jump the queue ahead of timers.',
    analogy:
      'A chef with one hob. Orders that need the hob are done one at a time. Little jobs like plating up (promise callbacks) get squeezed in the moment the current dish leaves the pan, while jobs on a timer wait their turn in the ticket rail.',
    interviewerSays: ['what prints first?', "don't block the main thread", 'is this synchronous?'],
    example: {
      lang: 'js',
      source: `console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');
// a, d, c, b`,
    },
    exampleCaption: 'Synchronous first, then promises (microtasks), then timers.',
    sayThis: [
      'Synchronous code runs first, then promise callbacks, then timers, so it prints a, d, c, b.',
      "setTimeout with 0 doesn't mean now, it means as soon as the current work and all pending promise callbacks are done.",
    ],
    related: ['async-await'],
  },
  {
    id: 'this-binding',
    title: '`this` and arrow functions',
    icon: 'cursor',
    trackIds: ['t3'],
    plainWords:
      'In a normal function, `this` is decided by how the function is called. An arrow function has no `this` of its own. It uses the one from where it was written.',
    analogy:
      'A normal function is a hired hand who works for whoever picks up the phone that day. An arrow function is a family member: no matter who calls, they still belong to the household they grew up in.',
    interviewerSays: [
      'what is `this` here?',
      'why is `this` undefined?',
      'arrow function versus method',
    ],
    example: {
      lang: 'js',
      source: `const timer = {
  label: 'tick',
  arrow: () => this.label,        // outer this, not timer
  method() { return this.label; } // timer
};`,
    },
    exampleCaption: 'Arrows are the right choice for callbacks, the wrong choice for methods.',
    sayThis: [
      "An arrow function takes `this` from where it was defined, so it's ideal in a callback and wrong as an object method.",
    ],
    related: ['closure'],
  },
  {
    id: 'async-await',
    title: 'async/await pitfalls',
    icon: 'clock',
    trackIds: ['t3'],
    plainWords:
      '`await` pauses the function until a promise settles. The classic mistakes are awaiting inside `forEach` (which ignores it entirely) and awaiting in a loop when the work could run at the same time.',
    analogy:
      'Sending letters. Awaiting in a loop is posting one and waiting for the reply before writing the next. `Promise.all` is posting all of them, then waiting once for the pile of replies. Both are right sometimes. The second is usually what people mean.',
    interviewerSays: [
      'these should run in parallel',
      'why is this so slow?',
      'does forEach await?',
    ],
    example: {
      lang: 'js',
      source: `// sequential, each waits for the last
for (const url of urls) results.push(await fetch(url));

// parallel, all in flight, one wait
const results = await Promise.all(urls.map(fetch));`,
    },
    exampleCaption: '`forEach` with `await` inside does neither: it starts them and ignores them.',
    sayThis: [
      "forEach ignores the promise you return, so nothing is actually awaited. I'd use for…of for sequential, or Promise.all to run them at once.",
    ],
    related: ['event-loop'],
  },
  {
    id: 'debounce-throttle',
    title: 'Debounce versus throttle',
    icon: 'gauge',
    trackIds: ['t3'],
    plainWords:
      'Debounce waits until things go quiet and then acts once. Throttle acts straight away but refuses to act again until a set time has passed.',
    analogy:
      'A lift. Debounce is the door waiting until nobody has stepped in for three seconds before closing. Throttle is a revolving door that turns at a fixed speed no matter how many people push.',
    interviewerSays: [
      'fires at most once per…',
      'wait until they stop typing',
      'this handler runs too often',
    ],
    example: {
      lang: 'js',
      source: `const debounce = (fn, ms) => {
  let t;                       // closed over
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};`,
    },
    exampleCaption: 'The timer id lives in a closure, which is why each call can cancel the last.',
    sayThis: [
      'Debounce for a search box: wait until they stop typing. Throttle for scroll or resize: act at a steady rate.',
    ],
    related: ['closure'],
  },
  {
    id: 'reference-value',
    title: 'Reference versus value',
    icon: 'link',
    trackIds: ['t3'],
    plainWords:
      'Numbers and strings are copied when you pass them around. Objects and arrays are not. You pass a pointer to the same thing, so changing it inside a function changes it everywhere.',
    analogy:
      'Giving someone a photocopy of a page versus giving them the address of the filing cabinet. Scribbling on the photocopy is harmless. Anyone with the address can rearrange the originals.',
    interviewerSays: ['why did the original change?', 'is this a deep copy?', 'any side effects?'],
    example: {
      lang: 'js',
      source: `const copy = { ...user };        // top layer only
copy.name = 'new';               // safe
copy.address.city = 'Berlin';    // ALSO changes user.address`,
    },
    exampleCaption: 'Spread is shallow: nested objects are still shared.',
    sayThis: [
      'Spread copies the top layer only, so nested objects are still shared. I would use structuredClone or copy the nested part explicitly.',
    ],
    related: ['pure-functions', 'equality'],
  },
  {
    id: 'ts-annotations',
    title: 'TypeScript essentials',
    icon: 'note',
    trackIds: ['t3'],
    plainWords:
      'Types describe what a value is allowed to be, checked before the code ever runs. Most interview questions want parameter and return types on a function, and an opinion on `interface` versus `type`.',
    analogy:
      'Labels on kitchen containers. They do not change what is inside, but they stop you tipping salt into the coffee, and they tell the next person what to expect without opening the lid.',
    interviewerSays: ['add types to this', 'interface or type?', 'why not use any?'],
    example: {
      lang: 'ts',
      source: `function chunk(text: string, limit: number): string[] {
  return [];
}`,
    },
    exampleCaption: 'Parameters and return type. The annotation interviewers actually ask for.',
    sayThis: [
      'I use interface for object shapes that might be extended, and type for unions and aliases. In practice either is fine if the codebase is consistent.',
      "unknown forces me to check before using the value; any switches type checking off. I'd reach for unknown.",
    ],
    related: ['ts-generics'],
  },
  {
    id: 'ts-generics',
    title: 'Generics in one idea',
    icon: 'braces',
    trackIds: ['t3'],
    plainWords:
      'A generic is a type left blank for the caller to fill in. It lets one function work with any type while still remembering which type it was given.',
    analogy:
      'A pair of tongs. They are not built for chips or for ice specifically, but whatever you pick up with them, that is what comes back. They do not turn your ice into chips on the way.',
    interviewerSays: ['make it work for any type', 'without using any', 'what is T here?'],
    example: {
      lang: 'ts',
      source: `function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);      // number | undefined
first(['a', 'b']);     // string | undefined`,
    },
    exampleCaption: 'The caller decides what T is, and the return type follows automatically.',
    sayThis: [
      "I'd make it generic so the return type follows the input. That keeps type safety without resorting to any.",
    ],
    related: ['ts-annotations'],
  },
  // ---------------------------------------------------------------------
  // Track 4. Refactoring & code quality
  // ---------------------------------------------------------------------
  {
    id: 'refactor-ladder',
    title: 'Work, right, fast, typed',
    icon: 'ladder',
    trackIds: ['t4'],
    plainWords:
      'The order to improve code in an interview: first make it work, then make it correct on the awkward inputs, then make it fast, then add types. Doing these out of order is the classic mistake.',
    analogy:
      'Building a wall. You get it standing, then you check it is straight, then you worry about how quickly you could build the next one, and only then do you paint it. Painting a leaning wall impresses nobody.',
    interviewerSays: [
      'what would you improve?',
      "what's the next step?",
      'how would you make this better?',
    ],
    sayThis: [
      "It works, so the next thing I'd do is make it correct on the edge cases, then look at performance once I trust it.",
      "I'd optimise after it's correct, not before.",
    ],
    related: ['guard-clause', 'naming', 'review-script'],
  },
  {
    id: 'guard-clause',
    title: 'Guard clauses',
    icon: 'door',
    trackIds: ['t4'],
    plainWords:
      'Handle the awkward cases first and return early, so the main logic sits flat at the bottom instead of buried inside three levels of `if`.',
    analogy:
      'A bouncer at the door. Anyone underage, on the list, or without a ticket is turned away right there. Everyone still walking is definitely allowed in, so nobody inside needs checking again.',
    interviewerSays: ['can you flatten this?', 'this is deeply nested', 'reduce the nesting'],
    example: {
      lang: 'js',
      source: `if (!user) return null;
if (!user.active) return null;
return user.profile;    // the real work, unnested`,
    },
    exampleCaption: 'Each guard leaves early, so the happy path never gets indented.',
    sayThis: [
      "I'd invert those conditions into guard clauses so the main path isn't nested three deep.",
    ],
    related: ['refactor-ladder', 'single-responsibility'],
  },
  {
    id: 'dry',
    title: 'DRY, without overdoing it',
    icon: 'link',
    trackIds: ['t4'],
    plainWords:
      'Do not repeat yourself: the same logic in two places will eventually be fixed in only one of them. But two pieces of code that merely look alike are not duplication, and merging them can make things worse.',
    analogy:
      'Two recipes both saying "preheat to 180". That is not worth extracting. Two recipes both using the same secret sauce is, because when the sauce changes you want to change it once, not remember every dish it appears in.',
    interviewerSays: ['I see duplication', 'could you extract that?', 'this looks repetitive'],
    sayThis: [
      "That's the same logic twice, so I'd extract it. A bug fixed in one copy would otherwise survive in the other.",
      "These only look similar; they change for different reasons, so I'd leave them apart.",
    ],
    related: ['single-responsibility', 'refactor-ladder'],
  },
  {
    id: 'naming',
    title: 'Naming things',
    icon: 'note',
    trackIds: ['t4'],
    plainWords:
      'A good name says what the value means, not what type it is or how it was made. Naming a magic number is usually the cheapest improvement available to you.',
    analogy:
      'Labelling a spare key "back door" rather than "key 2". Both identify it. Only one is any use when you are standing in the rain.',
    interviewerSays: [
      'what would you call this?',
      "what's that number?",
      'can you make this clearer?',
    ],
    example: {
      lang: 'js',
      source: `if (elapsed > 86400000) { }               // what is that?
const ONE_DAY_MS = 86_400_000;
if (elapsed > ONE_DAY_MS) { }             // now it reads`,
    },
    exampleCaption: 'The constant is not faster. It is readable, which is the point.',
    sayThis: [
      "First thing I'd do is name that magic number. Right now the reader has to do arithmetic to understand the condition.",
    ],
    related: ['refactor-ladder', 'dry'],
  },
  {
    id: 'single-responsibility',
    title: 'One job per function',
    icon: 'target',
    trackIds: ['t4'],
    plainWords:
      'A function should do one thing. If you need the word "and" to describe it (validates and saves and emails), it is doing several, and each one is harder to test and reuse.',
    analogy:
      'A kitchen gadget that chops, boils and toasts. Impressive until the toaster part breaks and you can no longer chop anything. Separate tools fail separately.',
    interviewerSays: [
      'this function does a lot',
      'could you break this up?',
      "what's this function's job?",
    ],
    sayThis: [
      "This does three things. Validate, save and notify. I'd split them so each can be tested on its own.",
    ],
    related: ['guard-clause', 'dry', 'pure-functions'],
  },
  {
    id: 'pure-functions',
    title: 'Pure functions and side effects',
    icon: 'sparkle',
    trackIds: ['t4'],
    plainWords:
      'A pure function returns the same answer for the same input and changes nothing outside itself. It is trivially testable, because there is no setup and nothing to clean up.',
    analogy:
      'A calculator versus a vending machine. Ask the calculator for 2 + 2 a hundred times and you get the same answer with nothing else changed. The vending machine gives you a drink and quietly has one fewer.',
    interviewerSays: ['any side effects?', 'does this mutate the input?', 'is this function pure?'],
    example: {
      lang: 'js',
      source: `const addItem = (cart, item) => [...cart, item]; // pure
const addItemBad = (cart, item) => { cart.push(item); }; // mutates`,
    },
    exampleCaption: "The pure version hands back a new cart and leaves the caller's alone.",
    sayThis: [
      "I'd return a new array rather than mutating the argument. The caller probably doesn't expect their data to change under them.",
    ],
    related: ['reference-value', 'single-responsibility'],
  },
  {
    id: 'review-script',
    title: 'Reviewing code out loud',
    icon: 'speech',
    trackIds: ['t4'],
    plainWords:
      "There is an order to reviewing someone else's code that keeps it useful rather than nitpicky: say what the code is trying to do, then correctness, then readability, then performance, then style.",
    analogy:
      'A driving instructor does not open with "your mirror is smudged". They note you checked the junction properly, then mention you missed a blind spot, and only later mention the smudge. Order signals what actually matters.',
    interviewerSays: ['review this code for me', 'what would you comment on?'],
    sayThis: [
      'I can see what this is going for. The one thing that worries me is correctness on empty input. After that it is mostly readability.',
      'Style points I would leave to the linter.',
    ],
    related: ['refactor-ladder', 'naming'],
  },
  // ---------------------------------------------------------------------
  // Track 5, System design foundations
  // ---------------------------------------------------------------------
  {
    id: 'design-script',
    title: 'The system design script',
    icon: 'compass',
    trackIds: ['t5'],
    plainWords:
      'Design rounds have a running order: clarify what is actually being asked, estimate the scale, sketch the boxes, go deep on one of them, then talk about the trade-offs you made.',
    analogy:
      'An architect handed "design me a house" does not start drawing. They ask how many people live there and what the budget is, sketch the footprint, then go deep on the one bit that matters. The kitchen, and explain what they gave up for it.',
    interviewerSays: ['design me a…', 'how would you build…', 'sketch the architecture'],
    sayThis: [
      'Before I draw anything. How many users, and is this read-heavy or write-heavy?',
      "I'll sketch the high level first, then go deep wherever you're most interested.",
    ],
    related: ['lb-cache-queue', 'scaling'],
  },
  {
    id: 'lb-cache-queue',
    title: 'The standard building blocks',
    icon: 'blocks',
    trackIds: ['t5'],
    plainWords:
      'Nearly every design is assembled from the same few parts: a load balancer spreading requests, a cache holding recent answers, a queue holding work for later, a CDN serving files from nearby, and a database as the source of truth.',
    analogy:
      'A restaurant. The host seats people evenly across the waiters (load balancer), specials are already made (cache), orders go on a rail for the kitchen to work through (queue), bread comes from the front counter rather than the kitchen (CDN), and the stockroom holds what is really there (database).',
    interviewerSays: [
      'what sits in front of the servers?',
      'where would you put a cache?',
      'walk me through the components',
    ],
    sayThis: [
      'A load balancer in front, a cache for the hot reads, a queue for anything slow, and the database as the source of truth.',
    ],
    related: ['caching', 'queues', 'scaling'],
  },
  {
    id: 'caching',
    title: 'Caching and invalidation',
    icon: 'database',
    trackIds: ['t5'],
    plainWords:
      'Keep a copy of an expensive answer somewhere fast, so the next person asking gets it immediately. The hard part is never storing it. It is deciding when the copy has gone stale.',
    analogy:
      'A pinned note by the phone with the opening hours on it. Saves ringing every time. The trouble starts when the hours change and nobody remembers to update the note.',
    interviewerSays: [
      "it's read-heavy",
      'how do you keep it fresh?',
      'what happens when the data changes?',
    ],
    sayThis: [
      "Read-heavy points at a cache. I'd start with cache-aside: check the cache, and on a miss read the database and put the answer back.",
      'For freshness, a short TTL is the simple answer; write-through is stronger but couples the write path to the cache.',
    ],
    related: ['lb-cache-queue', 'resilience', 'memoization'],
  },
  {
    id: 'queues',
    title: 'Queues and background work',
    icon: 'inbox',
    trackIds: ['t5'],
    plainWords:
      'When a request triggers slow work, write down that the work needs doing, answer straight away, and let a separate worker get through the list. The user stops waiting for something they do not need to watch.',
    analogy:
      'Dropping off dry cleaning. They do not make you stand there while it is cleaned. They take it, hand you a ticket, and get on with it. The ticket is how you check later.',
    interviewerSays: ['this endpoint is slow', 'do it in the background', 'the request times out'],
    sayThis: [
      "I'd accept the upload, put a job on a queue and return a job id immediately. Raising the timeout just moves the problem.",
      'The worker retries on failure, and anything that keeps failing goes to a dead letter queue for a human to look at.',
    ],
    related: ['lb-cache-queue', 'resilience', 'idempotency'],
  },
  {
    id: 'sql-vs-nosql',
    title: 'Choosing a database',
    icon: 'database',
    trackIds: ['t5'],
    plainWords:
      'Pick based on the shape of your data and the questions you will ask of it. Relational databases are strong when things relate to each other and you need guarantees; document stores are strong when records are self-contained and you read them whole.',
    analogy:
      'A filing cabinet with cross-references versus a shelf of ring binders. If you constantly need "everything connected to this customer", the cross-references earn their keep. If you always grab one binder and read it cover to cover, the shelf is simpler.',
    interviewerSays: ['SQL or NoSQL?', 'which database would you pick?', 'why not Postgres?'],
    sayThis: [
      "It depends on the access patterns. If the data is relational and I need transactions, I'd start with Postgres. It scales further than people expect.",
      "I'd reach for a document store when records are self-contained and read whole, or when the schema genuinely varies.",
    ],
    related: ['scaling', 'pagination'],
  },
  {
    id: 'scaling',
    title: 'Scaling and statelessness',
    icon: 'growth',
    trackIds: ['t5'],
    plainWords:
      'Vertical scaling is a bigger machine. Easy until you cannot buy a bigger one. Horizontal scaling is more machines, which only works if any machine can serve any request, meaning they hold no session state of their own.',
    analogy:
      'One till with a faster cashier versus more tills. More tills only helps if any till can serve any customer. If your receipt only works at the till you started at, the queue rebuilds itself.',
    interviewerSays: ['10x the users tomorrow', 'how would you scale this?', 'sticky sessions'],
    sayThis: [
      "First I'd measure. I want to know whether we're limited by CPU, database or network before adding machines.",
      'Horizontal scaling needs the services to be stateless, so sessions go in Redis or a signed token rather than in memory on one box.',
    ],
    related: ['lb-cache-queue', 'design-script', 'sql-vs-nosql'],
  },
  {
    id: 'idempotency',
    title: 'Idempotency (safe to retry)',
    icon: 'loop',
    trackIds: ['t5'],
    plainWords:
      'An operation is idempotent if doing it twice has the same effect as doing it once. It matters because networks retry, and users double-tap.',
    analogy:
      'A lift call button. Pressing it five times does not summon five lifts. Compare that with a vending machine, where pressing twice costs you twice.',
    interviewerSays: [
      'the user double-clicked pay',
      'what if the request is retried?',
      'exactly once',
    ],
    example: {
      lang: 'js',
      source: `// client sends the same key on every retry
if (await seen(idempotencyKey)) return existingResult;`,
    },
    exampleCaption: 'The key turns "do it again" into "give me the answer you already computed".',
    sayThis: [
      "The client sends an idempotency key with the payment. If we've seen that key we return the original result instead of charging again.",
    ],
    related: ['queues', 'resilience'],
  },
  {
    id: 'pagination',
    title: 'Offset versus cursor',
    icon: 'inbox',
    trackIds: ['t5'],
    plainWords:
      'Offset paging asks for "the next twenty starting at number two thousand", which makes the database count past two thousand rows every time. Cursor paging says "the next twenty after this item", which it can jump straight to.',
    analogy:
      'Finding your place in a book by counting pages from the front every time, versus using a bookmark. The bookmark also survives someone inserting a page earlier in the book.',
    interviewerSays: ['the feed gets slow on page 100', 'how do you paginate?', 'why cursors?'],
    sayThis: [
      "Offset gets slower the deeper you go, and items shift if something is inserted. I'd use a cursor. The id or timestamp of the last item seen.",
    ],
    related: ['sql-vs-nosql', 'scaling'],
  },
  {
    id: 'rate-limiting',
    title: 'Rate limiting',
    icon: 'gauge',
    trackIds: ['t5'],
    plainWords:
      'Capping how many requests one caller may make in a window, so a single client cannot exhaust the service for everyone else. It usually lives at the edge, before the request reaches your code.',
    analogy:
      'A bucket with a hole in it. Each request drops in a token; the hole drains at a steady rate. Occasional bursts are absorbed by the bucket, but a constant flood overflows and gets turned away.',
    interviewerSays: [
      'someone is hammering the API',
      'how do you protect the service?',
      'token bucket',
    ],
    sayThis: [
      "I'd rate limit at the gateway with a token bucket. It allows short bursts while capping the sustained rate, and returns 429 with a Retry-After.",
    ],
    related: ['resilience', 'scaling'],
  },
  {
    id: 'resilience',
    title: 'Failure patterns and mitigations',
    icon: 'shield',
    trackIds: ['t5'],
    plainWords:
      'Things fail, so systems are designed to fail small. Retry with random delays so clients do not stampede together, spread hot data across shards, stop calling a dead service, and keep failed jobs rather than losing them.',
    analogy:
      'A power cut. Everyone switching their heating back on at the same instant trips the grid again, so devices restart at slightly different times. That deliberate raggedness is jitter.',
    interviewerSays: ['what if this component dies?', 'thundering herd', 'how does it degrade?'],
    sayThis: [
      "I'd add retries with exponential backoff and jitter so clients don't all come back at once.",
      'A circuit breaker stops us hammering a service that is already down, and a dead letter queue means a failed job is parked rather than lost.',
    ],
    related: ['queues', 'caching', 'rate-limiting'],
  },

  // ---------------------------------------------------------------------
  // Track 6. Interview decoder & communication
  // ---------------------------------------------------------------------
  {
    id: 'decoder',
    title: 'The interviewer phrasebook',
    icon: 'speech',
    trackIds: ['t6'],
    plainWords:
      'Interviewers ask in riddles, and each riddle has a canonical answer they are waiting to hear. Knowing the mapping is worth as much as knowing the concept, because the concept without the word often scores zero.',
    analogy:
      'Ordering coffee abroad. You know exactly what you want, and the barista knows exactly how to make it, but until you say the local word for it you both stand there. The gap is vocabulary, not competence.',
    interviewerSays: [
      'a function that remembers',
      'instant lookup',
      'only computed once',
      'first in first out',
    ],
    sayThis: [
      '"A function that remembers" is a closure. "Grows linearly" is O(n). "Instant lookup" is a hash map. "Only computed once" is memoization.',
      'When you hear the riddle, say the term back. That is the thing being scored.',
    ],
    related: ['stuck-script', 'hints', 'whiteboard-script'],
  },
  {
    id: 'stuck-script',
    title: 'What to do when stuck',
    icon: 'compass',
    trackIds: ['t6'],
    plainWords:
      'Being stuck is normal and survivable. Going quiet is what actually loses interviews. There is a script: say what you do know, restate the goal, offer the brute force, and ask one specific question.',
    analogy:
      'Lost while driving with someone in the passenger seat. Silently taking random turnings is the worst option. Saying "I know we passed the bridge, I think we want north, shall I take the next left?" turns a passenger into a navigator.',
    interviewerSays: ['take your time', 'what are you thinking?', 'talk me through it'],
    sayThis: [
      "Let me say where I am: I know it's a lookup problem, I'm not sure how to handle duplicates yet.",
      "I'll start with the brute force so we have something working, then improve it.",
      'The three-minute rule: if an approach has not started working in about three minutes, say so out loud and try another. Sinking the whole interview into one wrong idea is the real failure.',
    ],
    related: ['hints', 'whiteboard-script', 'decoder'],
  },
  {
    id: 'hints',
    title: 'Hints are gifts',
    icon: 'cursor',
    trackIds: ['t6'],
    plainWords:
      'When an interviewer drops a detail ("what if the array were sorted?"), they are not making conversation. They are steering you toward the intended approach, and taking the hint is rewarded, not penalised.',
    analogy:
      'A friend watching you struggle with a jar says "try running it under hot water". They are not judging your grip. Ignoring them and carrying on is the only wrong response.',
    interviewerSays: [
      'what if it was sorted?',
      'is there a data structure that…',
      'do you need to check that twice?',
    ],
    sayThis: [
      'That is a good hint. If it is sorted I can use two pointers instead of the nested loop.',
      'Say the hint back and name what it unlocks. That shows you heard it and understood why it matters.',
    ],
    related: ['stuck-script', 'decoder', 'pattern-map'],
  },
];
