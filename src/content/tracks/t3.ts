import type { Exercise, Track } from '../types';

/**
 * Track 3 — JS/TS language concepts.
 *
 * Goal: the language-internals questions full stack interviews love. Closures
 * first, because "a function that remembers" is the riddle most often missed.
 */

export const t3Exercises: Exercise[] = [
  {
    id: 't3-01',
    trackId: 't3',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'closure',
    prompt: 'The interviewer asks for **"a function that remembers"**. What does this print?',
    code: {
      lang: 'js',
      source: `function makeCounter() {
  let count = 0;
  return () => ++count;
}
const next = makeCounter();
console.log(next(), next(), next());`,
    },
    options: [
      { text: '1 2 3', correct: true },
      {
        text: '1 1 1',
        whyWrong:
          '`count` is created once, when `makeCounter` runs — not each time the returned function is called. The inner function keeps hold of that same variable.',
      },
      {
        text: '0 1 2',
        whyWrong:
          '`++count` increments *before* returning, so the first call already yields 1. `count++` would give 0 1 2.',
      },
      {
        text: 'undefined undefined undefined',
        whyWrong:
          'The arrow function body is a single expression, so its value is returned automatically. You would only get undefined with braces and no `return`.',
      },
    ],
    explanation:
      '`makeCounter` finishes immediately, but `count` does not disappear — the returned function still holds a reference to it, so it survives between calls. That is a closure: a function carrying the variables from where it was written. Saying the word is what the question is really testing.',
  },
  {
    id: 't3-02',
    trackId: 't3',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'closure',
    prompt: 'Build `makeCounter()` — each returned counter keeps its own private tally.',
    lines: [
      { code: 'function makeCounter() {', indent: 0 },
      { code: 'let count = 0;', indent: 1 },
      { code: 'return function () {', indent: 1 },
      { code: 'count += 1;', indent: 2 },
      { code: 'return count;', indent: 2 },
      { code: '};', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'let count = 0;', indent: 2, distractor: true },
    ],
    explanation:
      '`count` has to live in the outer function, so it is created once per counter and shared by every call to the inner one. The distractor puts `let count = 0` inside the returned function, which resets it on every call — the counter would return 1 forever.',
  },
  {
    id: 't3-03',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'closure',
    prompt: 'The classic. What does this print?',
    code: {
      lang: 'js',
      source: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    },
    options: [
      { text: '3 3 3', correct: true },
      {
        text: '0 1 2',
        whyWrong:
          'That is what `let` gives you, because `let` creates a fresh binding each iteration. `var` has only one `i` for the whole loop.',
      },
      {
        text: '0 0 0',
        whyWrong:
          'The callbacks all read the same `i`, but they read it *after* the loop finished — by then it is 3, not still 0.',
      },
      {
        text: 'Nothing — the timeouts never fire',
        whyWrong:
          'A timeout of 0 still fires; it just waits until the current work and any pending promise callbacks are done. All three run.',
      },
    ],
    explanation:
      '`var` is scoped to the whole function, so all three callbacks close over one shared `i`. The loop finishes before any timeout runs, leaving `i` at 3, and every callback prints that. Swapping `var` for `let` creates a new `i` per iteration and prints 0 1 2.',
  },
  {
    id: 't3-04',
    trackId: 't3',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'closure',
    prompt: 'Each handler should log its own index. **Tap the line that makes them all log 3.**',
    code: {
      lang: 'js',
      source: `const handlers = [];
for (var i = 0; i < 3; i++) {
  handlers.push(() => console.log(i));
}
handlers.forEach((h) => h());`,
    },
    buggyLineIndex: 1,
    lineHints: {
      0: 'An empty array is fine — nothing here decides what the handlers capture.',
      2: 'Pushing an arrow function is exactly right. The problem is which `i` it closes over.',
      4: 'Calling them is fine; by this point the damage is already done.',
    },
    explanation:
      '`var i` creates one variable for the entire loop, so all three arrow functions capture the same one. Changing it to `let i` gives each iteration its own binding, and the handlers log 0, 1 and 2. This is the single most-asked closure question in JavaScript interviews.',
  },
  {
    id: 't3-05',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'equality',
    prompt: 'What does this print?',
    code: {
      lang: 'js',
      source: `console.log('' == 0, null == undefined, null === undefined);`,
    },
    options: [
      { text: 'true true false', correct: true },
      {
        text: 'false true false',
        whyWrong:
          "`'' == 0` is true: the empty string converts to the number 0 before comparing. It is one of the conversions people forget.",
      },
      {
        text: 'true false false',
        whyWrong:
          '`null == undefined` is true — a deliberate special case in the language, so that one check catches both.',
      },
      {
        text: 'true true true',
        whyWrong:
          '`===` compares types first, and null and undefined are different types, so it is false. That is exactly the difference being tested.',
      },
    ],
    explanation:
      '`==` converts before comparing: the empty string becomes 0, so the first is true. `null == undefined` is a special rule in the spec, so the second is true. `===` skips all conversion and checks the type too, so the third is false. Defaulting to `===` is the answer interviewers want to hear.',
  },
  {
    id: 't3-06',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'event-loop',
    prompt: 'What order do these print in?',
    code: {
      lang: 'js',
      source: `console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');`,
    },
    options: [
      { text: 'a d c b', correct: true },
      {
        text: 'a b c d',
        whyWrong:
          'That would mean each line runs in written order and waits. Both `setTimeout` and `.then` schedule work for later — they do not pause anything.',
      },
      {
        text: 'a d b c',
        whyWrong:
          'Close, but promise callbacks are microtasks and run before timers. A timeout of 0 does not mean immediately; it means after everything already queued.',
      },
      {
        text: 'a c d b',
        whyWrong:
          "The promise callback cannot run before `console.log('d')` — all the synchronous code finishes first, and only then does the engine drain the microtask queue.",
      },
    ],
    explanation:
      'Synchronous lines run first: a, then d. Then the engine drains the microtask queue, which holds the promise callback: c. Timers come last: b. The rule to remember is synchronous, then promises, then timers.',
  },
  {
    id: 't3-07',
    trackId: 't3',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'event-loop',
    prompt: 'Round two. What order?',
    code: {
      lang: 'js',
      source: `setTimeout(() => console.log(1), 0);
Promise.resolve()
  .then(() => console.log(2))
  .then(() => console.log(3));
setTimeout(() => console.log(4), 0);`,
    },
    options: [
      { text: '2 3 1 4', correct: true },
      {
        text: '1 4 2 3',
        whyWrong:
          'Timers do not win. Both timeouts are queued as macrotasks, and the entire microtask queue is drained before the first of them runs.',
      },
      {
        text: '2 1 3 4',
        whyWrong:
          'The chained `.then` queues another microtask, and the queue is drained *completely* — including anything added while draining — before any timer.',
      },
      {
        text: '1 2 3 4',
        whyWrong:
          'This assumes everything runs in source order. The two scheduling mechanisms have different priorities, which is the whole point of the question.',
      },
    ],
    explanation:
      'Both timeouts go to the macrotask queue in order. The promise chain goes to the microtask queue, and that queue is drained completely — including the second `.then` added while draining — before any macrotask runs. So 2 and 3 come first, then 1 and 4 in the order they were scheduled.',
  },
  {
    id: 't3-08',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'this-binding',
    prompt: 'What does `timer.arrow()` return, and why?',
    code: {
      lang: 'js',
      source: `const timer = {
  label: 'tick',
  arrow: () => this.label,
  method() { return this.label; },
};`,
    },
    options: [
      {
        text: 'undefined — an arrow function has no `this` of its own, so it uses the outer one',
        correct: true,
      },
      {
        text: "'tick' — it is defined inside the object, so `this` is the object",
        whyWrong:
          'Object literals do not create a scope for `this`. The arrow was written at the top level, so it captured whatever `this` was there — not the object.',
      },
      {
        text: 'It throws, because `this` is undefined',
        whyWrong:
          'Reading a property of the module-level `this` does not throw here; you simply get undefined back rather than an error.',
      },
      {
        text: "'tick', but only in strict mode",
        whyWrong:
          'Strict mode changes what `this` is in a plain function call, but it does not give an arrow function a `this` of its own — that is fixed at definition either way.',
      },
    ],
    explanation:
      'An arrow function permanently borrows `this` from where it was written, and an object literal is not a scope — so `timer.arrow` picks up the surrounding `this`, not `timer`. The shorthand `method()` is a normal function, so `this` is whatever it was called on, giving "tick". Arrows are right for callbacks and wrong for methods.',
  },
  {
    id: 't3-09',
    trackId: 't3',
    type: 'spot-bug',
    difficulty: 3,
    conceptId: 'async-await',
    prompt:
      'This should save every user before logging "done", but "done" appears first. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `async function saveAll(users) {
  users.forEach(async (user) => {
    await save(user);
  });
  console.log('done');
}`,
    },
    buggyLineIndex: 1,
    lineHints: {
      2: '`await save(user)` is correct in itself — it does pause *this* inner function.',
      4: 'The log is in the right place; the problem is that nothing above it actually waited.',
    },
    explanation:
      '`forEach` ignores whatever its callback returns, and an async callback returns a promise. So it starts all the saves, throws away every promise, and returns immediately — leaving "done" to print while the saves are still in flight. Use `for…of` with `await` for sequential, or `await Promise.all(users.map(save))` for parallel.',
  },
  {
    id: 't3-10',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'async-await',
    prompt:
      'You need to fetch 50 independent URLs. Which do you reach for, and what is the trade-off?',
    options: [
      {
        text: '`Promise.all` — they are independent, so run them at once and wait once',
        correct: true,
      },
      {
        text: '`for…of` with `await` inside — safer and easier to read',
        whyWrong:
          'It is the right shape when each call depends on the last, or when you must not overwhelm the server. For 50 independent fetches it is needlessly 50 times slower.',
      },
      {
        text: '`forEach` with an async callback',
        whyWrong:
          'This one is simply broken — `forEach` discards the returned promises, so nothing is awaited at all and you carry on before any result arrives.',
      },
      {
        text: '`Promise.race` across all 50',
        whyWrong:
          '`race` settles as soon as the *first* one does and abandons the rest, so you would end up with a single result instead of 50.',
      },
    ],
    explanation:
      '`Promise.all` starts everything immediately and resolves when all have finished, so the total wait is the slowest one rather than the sum. Two things worth saying out loud: it rejects as soon as any single promise rejects (`allSettled` if you want them all regardless), and 50 simultaneous requests may need a concurrency limit in the real world.',
  },
  {
    id: 't3-11',
    trackId: 't3',
    type: 'blank',
    difficulty: 2,
    conceptId: 'debounce-throttle',
    prompt: 'Fill in `debounce` — it should wait until the calls stop, then run once.',
    template: `function debounce(fn, ms) {
  let timer;
  return (...args) => {
    ____(timer);
    timer = ____(() => fn(...args), ms);
  };
}`,
    gaps: ['clearTimeout', 'setTimeout'],
    bank: ['clearTimeout', 'setTimeout', 'setInterval', 'clearInterval'],
    explanation:
      'Every call cancels the pending timer and starts a fresh one, so the function only runs once the calls stop for `ms`. `timer` lives in a closure, which is what lets one call cancel the previous one — this is closures doing real work rather than being a puzzle.',
  },
  {
    id: 't3-12',
    trackId: 't3',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'debounce-throttle',
    prompt:
      'A **search box** that queries as you type, and a **scroll handler** that repositions a header. Which technique for which?',
    options: [
      { text: 'Debounce the search box, throttle the scroll handler', correct: true },
      {
        text: 'Throttle the search box, debounce the scroll handler',
        whyWrong:
          'Backwards. A throttled search fires mid-word on partial input, and a debounced scroll handler does nothing at all until scrolling stops — so the header lags the whole way down.',
      },
      {
        text: 'Debounce both',
        whyWrong:
          'Debouncing the scroll means nothing moves until the user stops, which looks broken. Scroll needs steady updates during the gesture.',
      },
      {
        text: 'Throttle both',
        whyWrong:
          'Throttling the search box fires requests for half-typed words. You want to wait until they have finished typing, which is debounce.',
      },
    ],
    explanation:
      'Debounce waits for quiet, which is exactly right for typing — you want the query once they stop. Throttle acts at a steady maximum rate, which is right for scroll and resize where you need continuous but bounded updates. "Wait until they stop" versus "at most once per" is the phrase pair to remember.',
  },
  {
    id: 't3-13',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'reference-value',
    prompt: 'What does this print?',
    code: {
      lang: 'js',
      source: `function rename(user) {
  user.name = 'changed';
}
const original = { name: 'original' };
rename(original);
console.log(original.name);`,
    },
    options: [
      { text: "'changed' — the object was passed by reference", correct: true },
      {
        text: "'original' — arguments are copies",
        whyWrong:
          'The *reference* is copied, not the object. Both names point at the same object, so a change through either is visible through the other.',
      },
      {
        text: 'It throws, because `original` is a const',
        whyWrong:
          '`const` stops you reassigning the binding, not changing the object it points at. `original = {}` would throw; `original.name = ...` is allowed.',
      },
      {
        text: "'undefined' — the property was replaced",
        whyWrong:
          'Assigning to a property sets it. Nothing here removes the property or replaces the object.',
      },
    ],
    explanation:
      'Objects and arrays are handed around as references, so a function receiving one can reach the caller\'s data. Primitives like numbers and strings really are copied. This is behind most "why did the original change?" bugs, and it is the reason interviewers ask whether your function has side effects.',
  },
  {
    id: 't3-14',
    trackId: 't3',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'reference-value',
    prompt:
      'This should leave `user` untouched, but `user.address.city` changes too. **Tap the line where it leaks.**',
    code: {
      lang: 'js',
      source: `function moveHouse(user, city) {
  const copy = { ...user };
  copy.name = user.name;
  copy.address.city = city;
  return copy;
}`,
    },
    buggyLineIndex: 3,
    lineHints: {
      1: 'The spread is where the shallow copy is made — but making it is not the bug. Using it as though it were deep is.',
      2: 'Copying a string across is harmless: primitives really are copied.',
      4: 'Returning the copy is fine; the damage happened on the line above.',
    },
    explanation:
      'Spread copies only the top layer, so `copy.address` and `user.address` are the *same object*. Writing to `copy.address.city` writes straight through to the original. Fix it by copying the nested object too — `{ ...user, address: { ...user.address, city } }` — or with `structuredClone` when the shape is deep.',
  },
  {
    id: 't3-15',
    trackId: 't3',
    type: 'blank',
    difficulty: 2,
    conceptId: 'ts-annotations',
    prompt:
      'The interviewer says **"now add types"**. Annotate the parameters and the return type.',
    template: `function chunk(text: ____, limit: ____): ____ {
  const out = [];
  for (let i = 0; i < text.length; i += limit) out.push(text.slice(i, i + limit));
  return out;
}`,
    gaps: ['string', 'number', 'string[]'],
    bank: ['string', 'number', 'string[]', 'any', 'unknown', 'number[]'],
    explanation:
      'Parameters first, return type after the closing bracket. `string[]` is an array of strings — `Array<string>` means the same thing. This is often the last stage of a staged interview, and it is quick marks: annotate what goes in and what comes out, and avoid `any`.',
  },
  {
    id: 't3-16',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'ts-annotations',
    prompt: '**"interface or type?"** What is the strongest answer?',
    options: [
      {
        text: 'Interface for object shapes that may be extended or merged, type for unions and aliases — and consistency matters more than the choice',
        correct: true,
      },
      {
        text: 'Always interface — it is the TypeScript way',
        whyWrong:
          'Interfaces cannot express a union, which is one of the most useful things `type` does. An absolute rule here reads as repeating advice rather than having formed a view.',
      },
      {
        text: 'Always type — it can do everything interface can',
        whyWrong:
          'Nearly true, but interfaces support declaration merging, which matters when you are augmenting types from a library. And "always" invites the follow-up you cannot answer.',
      },
      {
        text: 'They are identical, so it makes no difference',
        whyWrong:
          'Mostly interchangeable for plain object shapes, but not identical: only `type` does unions, only `interface` merges. Saying "no difference" invites exactly that correction.',
      },
    ],
    explanation:
      'For a plain object shape they are interchangeable, and the honest senior answer says so. The real differences: `type` can express unions and mapped types; `interface` can be reopened and merged, which libraries rely on. Interviewers are checking whether you have an informed preference rather than a memorised rule.',
  },
  {
    id: 't3-17',
    trackId: 't3',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'ts-generics',
    prompt: 'Which signature types `first` correctly — any array in, the right element type out?',
    options: [
      { text: '`function first<T>(arr: T[]): T | undefined`', correct: true },
      {
        text: '`function first(arr: any[]): any`',
        whyWrong:
          'It compiles for every input and tells you nothing about the output. The caller loses all type information, which is the exact problem generics solve.',
      },
      {
        text: '`function first<T>(arr: T[]): T`',
        whyWrong:
          'Very close, and the trap. An empty array yields undefined at runtime, so claiming it always returns `T` is a lie the compiler will believe.',
      },
      {
        text: '`function first<T>(arr: T): T[]`',
        whyWrong:
          'The parameter and return are inverted: this takes a single value and claims to return an array of them.',
      },
    ],
    explanation:
      '`T` is a placeholder the caller fills in: pass `number[]` and you get `number | undefined` back. The `| undefined` is the part people drop, and it is what makes the type honest about the empty case — with `strictNullChecks` on, the compiler then forces the caller to handle it.',
  },
  {
    id: 't3-18',
    trackId: 't3',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'ts-annotations',
    prompt: '**`unknown` versus `any`** — why do interviewers ask this?',
    options: [
      {
        text: '`unknown` forces you to narrow the value before using it; `any` switches type checking off entirely',
        correct: true,
      },
      {
        text: '`unknown` is the newer spelling of `any`',
        whyWrong:
          'They behave in opposite ways. `any` lets you do anything with no complaint; `unknown` lets you do almost nothing until you have proved what it is.',
      },
      {
        text: '`unknown` is for values from an API, `any` is for everything else',
        whyWrong:
          'API responses are a good use for `unknown`, but that is a consequence of the rule rather than the rule itself — it applies anywhere the type is not yet established.',
      },
      {
        text: '`any` is faster to compile',
        whyWrong:
          'Compile time is not the consideration. The difference is entirely about what the compiler will let you get away with.',
      },
    ],
    explanation:
      'Both mean "the type is not known yet", but `any` silently disables checking wherever it spreads, while `unknown` requires a check — a typeof, a schema parse — before you can touch the value. Interviewers ask because reaching for `any` under pressure is the habit that quietly undoes a typed codebase.',
  },
  {
    id: 't3-19',
    trackId: 't3',
    type: 'parsons',
    difficulty: 3,
    conceptId: 'memoization',
    prompt: 'Build `memoize(fn)` — a higher-order function caching results by argument.',
    lines: [
      { code: 'function memoize(fn) {', indent: 0 },
      { code: 'const cache = new Map();', indent: 1 },
      { code: 'return (arg) => {', indent: 1 },
      { code: 'if (cache.has(arg)) return cache.get(arg);', indent: 2 },
      { code: 'const result = fn(arg);', indent: 2 },
      { code: 'cache.set(arg, result);', indent: 2 },
      { code: 'return result;', indent: 2 },
      { code: '};', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'const cache = new Map();', indent: 2, distractor: true },
    ],
    explanation:
      'The cache must be created once per memoized function, outside the returned closure — the distractor puts it inside, so it is rebuilt on every call and nothing is ever remembered. Worth mentioning out loud: a Map keyed by a single argument only works for primitives, and real implementations need a key strategy for objects.',
  },
  {
    id: 't3-20',
    trackId: 't3',
    type: 'match',
    difficulty: 2,
    conceptId: 'event-loop',
    prompt: 'Pair each plain-words phrase with the feature it describes.',
    pairs: [
      { left: 'Runs after this code, before any timer', right: 'Microtask' },
      { left: 'Copies the top layer only', right: 'Shallow copy' },
      { left: 'Remembers where it was born', right: 'Closure' },
      { left: 'Decides `this` when it is called', right: 'Normal function' },
    ],
    explanation:
      'These four sit behind a large share of JavaScript interview questions, and each has a plain-words handle that is easier to hold than the formal definition. Being able to go from the phrase to the term — and back — is the reflex this track is building.',
  },
];

export const t3: Track = {
  id: 't3',
  title: 'JS/TS language concepts',
  emoji: '⚙️',
  tagline: 'Closures, the event loop, and the traps interviewers love.',
  lessons: [
    { id: 't3-l1', title: 'The backpack', exerciseIds: ['t3-01', 't3-02', 't3-03', 't3-04'] },
    {
      id: 't3-l2',
      title: "The browser's to-do list",
      exerciseIds: ['t3-05', 't3-06', 't3-07', 't3-08'],
    },
    { id: 't3-l3', title: 'Awaiting properly', exerciseIds: ['t3-09', 't3-10', 't3-11', 't3-12'] },
    { id: 't3-l4', title: 'Copies and references', exerciseIds: ['t3-13', 't3-14', 't3-20'] },
    {
      id: 't3-l5',
      title: 'Now add types',
      exerciseIds: ['t3-15', 't3-16', 't3-17', 't3-18', 't3-19'],
    },
  ],
};
