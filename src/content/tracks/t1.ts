import type { Exercise, Track } from '../types';

/**
 * Track 1: Big-O and optimization talk.
 *
 * Goal: see code, name its growth, and *say it* the way interviewers expect.
 * Wrong options are real misconceptions, each with a `whyWrong` that corrects
 * the specific mistaken belief rather than just saying "no".
 */

export const t1Exercises: Exercise[] = [
  {
    id: 't1-01',
    trackId: 't1',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'big-o',
    prompt:
      'This function looks at every item in a list once. The list grows from **100 items to 200 items**. What happens to the work?',
    code: {
      lang: 'js',
      source: `function total(items) {
  let sum = 0;
  for (const item of items) sum += item.price;
  return sum;
}`,
    },
    options: [
      { text: 'It roughly doubles', correct: true },
      {
        text: 'It stays about the same',
        whyWrong:
          'That would be true if the function only touched one item. This one visits every item, so more items means more visits.',
      },
      {
        text: 'It roughly quadruples',
        whyWrong:
          'Quadrupling happens when each item has to be compared with every other item. Here each item is visited exactly once.',
      },
      {
        text: 'It goes up by one extra step',
        whyWrong:
          'One extra step would mean the loop did not depend on the list length. Adding 100 items adds 100 trips through the loop.',
      },
    ],
    explanation:
      'The loop runs once per item, so the work tracks the size of the list. Double the list, double the work. That relationship, work rising in step with the input, is what people mean by "linear", written O(n).',
  },
  {
    id: 't1-02',
    trackId: 't1',
    type: 'complexity',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'How does the work grow as `nums` gets longer?',
    code: {
      lang: 'js',
      source: `function sum(nums) {
  let total = 0;
  for (const n of nums) total += n;
  return total;
}`,
    },
    answer: 'O(n)',
    sayIt: 'It grows linearly. Double the input, double the work.',
    explanation:
      'One loop, one pass, one visit per item. The number of additions is exactly the length of the list, so the work rises in step with the input. That is linear growth, written O(n).',
  },
  {
    id: 't1-03',
    trackId: 't1',
    type: 'complexity',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'How does the work grow as the array and the object get bigger?',
    code: {
      lang: 'js',
      source: `function lookup(arr, byId, i, id) {
  return [arr[i], byId[id]];
}`,
    },
    answer: 'O(1)',
    sayIt: "It's constant. The size of the data doesn't change the cost at all.",
    explanation:
      'Reading `arr[i]` jumps straight to a position; reading `byId[id]` jumps straight to a key. Neither one looks at the other entries, so a million-item array costs the same as a three-item one. Constant time, written O(1).',
  },
  {
    id: 't1-04',
    trackId: 't1',
    type: 'complexity',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'This checks every pair of people for a duplicate. How does the work grow?',
    code: {
      lang: 'js',
      source: `function hasDuplicate(people) {
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      if (people[i].id === people[j].id) return true;
    }
  }
  return false;
}`,
    },
    answer: 'O(n²)',
    sayIt: "It's quadratic. Ten times the people means a hundred times the work.",
    explanation:
      'Each person is compared against the others, so the number of comparisons grows with the *square* of the list. The `j = i + 1` start halves the comparisons, but halving does not change how it grows, it is still O(n²).',
  },
  {
    id: 't1-05',
    trackId: 't1',
    type: 'complexity',
    difficulty: 2,
    conceptId: 'big-o',
    prompt: 'Two loops, one after the other. How does the work grow?',
    code: {
      lang: 'js',
      source: `function report(nums) {
  let total = 0;
  for (const n of nums) total += n;

  let biggest = -Infinity;
  for (const n of nums) if (n > biggest) biggest = n;

  return { total, biggest };
}`,
    },
    answer: 'O(n)',
    sayIt: "It's still linear. Two passes is twice the work, not a different shape of growth.",
    explanation:
      'Two passes means roughly twice as many steps, but doubling is a constant factor and Big-O ignores those. What matters is that the work still rises in step with the list. Loops one *after* another add up; only loops *inside* one another multiply.',
  },
  {
    id: 't1-06',
    trackId: 't1',
    type: 'complexity',
    difficulty: 2,
    conceptId: 'big-o',
    prompt:
      'A loop over `orders` wraps a loop over `products`: **two different lists**. How does the work grow?',
    code: {
      lang: 'js',
      source: `function match(orders, products) {
  const out = [];
  for (const order of orders) {
    for (const product of products) {
      if (order.sku === product.sku) out.push(product);
    }
  }
  return out;
}`,
    },
    answer: 'O(n·m)',
    optionSet: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n·m)'],
    sayIt: "It's O(n·m). Orders times products, because the two lists grow independently.",
    explanation:
      'Calling this O(n²) quietly assumes both lists are the same size. They are not: 10 orders against 10,000 products is 100,000 steps, nowhere near 100. Give each input its own letter (n orders times m products) and the real cost is visible. Interviewers notice this one.',
  },
  {
    id: 't1-07',
    trackId: 't1',
    type: 'complexity',
    difficulty: 2,
    conceptId: 'log-n',
    prompt: 'The search range halves on every pass. How does the work grow?',
    code: {
      lang: 'js',
      source: `function find(sorted, target) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    },
    answer: 'O(log n)',
    sayIt:
      "It's logarithmic. Each step throws away half, so a million items takes about twenty steps.",
    explanation:
      'Every pass discards half of what is left, so the range collapses very fast: 1,000,000 → 500,000 → 250,000 and so on. Reaching one item takes roughly twenty steps. Whenever you see the search space halving, that is O(log n).',
  },
  {
    id: 't1-08',
    trackId: 't1',
    type: 'complexity',
    difficulty: 2,
    conceptId: 'sort-cost',
    prompt: 'Sort the list, then walk it once. What is the overall growth?',
    code: {
      lang: 'js',
      source: `function secondLargest(nums) {
  const sorted = [...nums].sort((a, b) => b - a);
  for (const n of sorted) {
    if (n !== sorted[0]) return n;
  }
  return null;
}`,
    },
    answer: 'O(n log n)',
    sayIt: "The sort dominates. It's O(n log n), and the scan afterwards is only O(n).",
    explanation:
      'Sorting costs O(n log n) and the scan costs O(n). When two costs happen one after the other you keep the bigger one, because the smaller becomes irrelevant as the input grows. So the whole function is O(n log n). The sort is what you are paying for.',
  },
  {
    id: 't1-09',
    trackId: 't1',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'hidden-loops',
    prompt:
      'There is only one `for` loop here, but the interviewer says the function is quadratic. **Why?**',
    code: {
      lang: 'js',
      source: `function findBanned(guests, banned) {
  const found = [];
  for (const guest of guests) {
    if (banned.includes(guest)) found.push(guest);
  }
  return found;
}`,
    },
    options: [
      {
        text: '`includes` scans the whole `banned` array on every iteration, so there are really two loops',
        correct: true,
      },
      {
        text: '`push` gets slower as `found` grows',
        whyWrong:
          'Push is essentially free. O(1) amortized. It occasionally has to grow the array, but that cost spreads out and is nowhere near the real problem.',
      },
      {
        text: 'Creating the `found` array costs extra time proportional to the input',
        whyWrong:
          'Allocating an empty array is a one-off constant cost. It happens once, not once per guest, so it cannot change how the function grows.',
      },
      {
        text: 'The `for…of` loop is slower than a classic indexed `for` loop',
        whyWrong:
          'That is a difference in constant factor at most, and Big-O ignores constant factors. Swapping loop syntax would not change the shape of the growth at all.',
      },
    ],
    explanation:
      '`includes` is not a free lookup. It walks the array from the start until it finds a match. Doing that once per guest means guests × banned steps in total. This is the classic "hidden loop": one loop you typed, one loop the method runs for you.',
  },
  {
    id: 't1-10',
    trackId: 't1',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'hidden-loops',
    prompt:
      'This works, but it is far slower than it looks. **Tap the line that makes it quadratic.**',
    code: {
      lang: 'js',
      source: `function firstRepeat(items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (items.indexOf(item) !== i) {
      return item;
    }
  }
  return null;
}`,
    },
    buggyLineIndex: 3,
    lineHints: {
      1: 'This is the outer loop, and it is fine. One pass over the list is exactly what you want.',
      2: 'Reading `items[i]` jumps straight to a position. That is constant time, no scanning involved.',
      4: 'Returning is instant. The cost is in whatever decided we should return.',
    },
    explanation:
      '`items.indexOf(item)` scans the array from the beginning every single time round the loop. One loop you wrote plus one loop `indexOf` runs gives you n × n steps. It is a neat trick for spotting repeats, and it quietly costs quadratic time.',
  },
  {
    id: 't1-11',
    trackId: 't1',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'hash-lookup',
    prompt:
      'Same function as before. It uses `indexOf` inside a loop. **Which change makes it O(n)?**',
    code: {
      lang: 'js',
      source: `function firstRepeat(items) {
  for (let i = 0; i < items.length; i++) {
    if (items.indexOf(items[i]) !== i) return items[i];
  }
  return null;
}`,
    },
    options: [
      {
        text: 'Keep a `Set` of items already seen and check `seen.has(item)` instead',
        correct: true,
      },
      {
        text: 'Sort the array first, then look for neighbours that match',
        whyWrong:
          'That does work and it is a real answer, but sorting costs O(n log n), so it is slower than the Set version and it also reorders the data, losing which repeat came first.',
      },
      {
        text: 'Replace `indexOf` with `lastIndexOf`',
        whyWrong:
          'Both scan the array. One from the front, one from the back. Changing direction does not remove the scan, so it stays quadratic.',
      },
      {
        text: 'Cache `items.length` in a variable before the loop',
        whyWrong:
          'A reasonable micro-optimization, but reading `.length` was never the expensive part. The scanning inside `indexOf` is, and this leaves it untouched.',
      },
    ],
    explanation:
      'A `Set` answers "have I seen this?" in one step instead of scanning. You walk the list once, checking and adding as you go, so the whole function becomes O(n). You pay for it with memory. The Set holds up to one entry per item, which is exactly the trade worth naming out loud.',
  },
  {
    id: 't1-12',
    trackId: 't1',
    type: 'complexity',
    difficulty: 2,
    conceptId: 'memoization',
    prompt: 'Every call spawns two more calls, and nothing is remembered. How does the work grow?',
    code: {
      lang: 'js',
      source: `function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    },
    answer: 'O(2ⁿ)',
    optionSet: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
    sayIt: "It's exponential. Adding one to n roughly doubles the work, so this falls over fast.",
    explanation:
      'Each call makes two more calls, which each make two more, and the same values get computed over and over: `fib(30)` recalculates `fib(10)` thousands of times. Work that roughly doubles for each step up in n is exponential. Caching each result once (memoizing) collapses it to O(n).',
  },
  {
    id: 't1-13',
    trackId: 't1',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'space-time',
    prompt:
      'You replaced the `indexOf` scan with a `Set` and the function went from O(n²) to O(n). The interviewer asks: **what did that cost you?**',
    options: [
      {
        text: 'Extra memory. Up to one Set entry per item, so O(n) additional space',
        correct: true,
      },
      {
        text: 'Nothing. The Set version is better in every way',
        whyWrong:
          'Nearly always the right practical call, but "nothing" is the wrong interview answer. There is a cost, and naming it is what shows you understand the change rather than having memorised it.',
      },
      {
        text: 'Accuracy. A Set can report a match that is not really there',
        whyWrong:
          'A Set gives exact answers. You may be thinking of a Bloom filter, which trades exactness for tiny memory and can produce false positives.',
      },
      {
        text: 'Readability. The Set version is much harder to follow',
        whyWrong:
          '"Have I seen this before?" is arguably clearer than a nested scan. And even if it were denser, readability is not the cost Big-O is asking about here.',
      },
    ],
    explanation:
      'You bought speed with memory: the Set holds up to one entry per item, so you added O(n) space to remove an O(n) scan. That is the space–time trade, and saying it out loud: "I traded O(n) memory for O(1) lookups". Is exactly the sentence interviewers are listening for.',
  },
  {
    id: 't1-14',
    trackId: 't1',
    type: 'match',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'Pair each notation with the plain-words phrase you would say out loud.',
    pairs: [
      { left: 'The size makes no difference', right: 'O(1)' },
      { left: 'It halves each step', right: 'O(log n)' },
      { left: 'It scales with the input', right: 'O(n)' },
      { left: 'It checks every pair', right: 'O(n²)' },
    ],
    explanation:
      'Interviewers frequently score the *phrase*, not the symbol. Knowing a loop is O(n) is worth little if you cannot say "it grows linearly. Double the input, double the work". Practise the pairing until the plain words arrive first and the notation follows.',
  },
  {
    id: 't1-15',
    trackId: 't1',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'amortized',
    prompt:
      'Arrays sometimes have to grow, which means copying everything into a bigger block. So **why is `push` still called O(1)?**',
    code: {
      lang: 'js',
      source: `const out = [];
for (const item of items) {
  out.push(item);
}`,
    },
    options: [
      {
        text: 'Growing is rare, and its cost spreads across all the cheap pushes. That average is what "amortized O(1)" means',
        correct: true,
      },
      {
        text: 'Arrays are allocated at full size up front, so they never actually grow',
        whyWrong:
          'They do grow. A dynamic array starts small and reallocates as needed. That is precisely why the question is interesting.',
      },
      {
        text: 'The copy happens in the background, so it does not count',
        whyWrong:
          'The copy is real, synchronous work on the same thread. It is counted. It is just averaged across many operations rather than charged to one.',
      },
      {
        text: 'Because we ignore constant factors, and the copy is a constant factor',
        whyWrong:
          'Copying n items is not constant. It grows with the array. The reason it still averages out is *how rarely* it happens, not that it is cheap when it does.',
      },
    ],
    explanation:
      'Each time an array runs out of room it grabs a bigger block, typically double, and copies across. Because the capacity doubles, those copies get rarer and rarer, and the total copying across n pushes stays proportional to n. Averaged out, each push is constant: "O(1) amortized". Saying the word "amortized" is the whole point of this question.',
  },
  {
    id: 't1-16',
    trackId: 't1',
    type: 'complexity',
    difficulty: 3,
    conceptId: 'hidden-loops',
    prompt:
      'Strings cannot be changed in place, so `+=` builds a **brand new string** each time. How does this grow?',
    code: {
      lang: 'js',
      source: `function join(words) {
  let out = '';
  for (const word of words) {
    out += word + ', ';
  }
  return out;
}`,
    },
    answer: 'O(n²)',
    sayIt:
      "It's quadratic. Each `+=` copies the whole string so far, and the string keeps getting longer.",
    explanation:
      'Every `+=` copies everything built so far into a new string. The first copy is tiny, the last copies almost the whole result, and adding all those copies up gives roughly n²/2 character moves. One visible loop, one invisible copy. The same hidden-loop trap in a different disguise. `words.join(", ")` does it in O(n).',
  },
  {
    id: 't1-17',
    trackId: 't1',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'pragmatic-perf',
    prompt:
      'You wrote an O(n²) loop. The interviewer asks whether you would optimize it. **What is the strongest answer?**',
    options: [
      {
        text: '"It depends on how big n gets. At around 100 items this is fine, so I would leave it readable unless we expect it to grow"',
        correct: true,
      },
      {
        text: '"Yes, always. Quadratic code should never ship"',
        whyWrong:
          'Too absolute. Plenty of quadratic code is perfectly correct and perfectly fast on small inputs, and rewriting it can cost clarity for no real gain. Interviewers read this as rule-following rather than judgement.',
      },
      {
        text: '"No, premature optimization is the root of all evil"',
        whyWrong:
          'Quoting the maxim without engaging looks like dodging. The full quote is about *premature* optimization; if n is a million, optimizing here is not premature, it is required.',
      },
      {
        text: '"I would benchmark it and decide from the numbers"',
        whyWrong:
          'Sensible in a real codebase, but in an interview it postpones the thinking they are testing. Reason about the input size first, then benchmarking is a refinement, not a substitute.',
      },
    ],
    explanation:
      'The signal here is judgement, not doctrine. Asking "how big does n get?" shows you connect complexity to real cost. A hundred items is 10,000 steps and finishes instantly; a million items is a trillion and never finishes. Same code, completely different answer, so the honest response depends on the size.',
  },
  {
    id: 't1-18',
    trackId: 't1',
    type: 'steps',
    difficulty: 2,
    conceptId: 'perf-script',
    prompt:
      'The interviewer asks "how does this scale?". **Put your answer in the order they expect to hear it.**',
    steps: [
      'Name the current complexity: "right now this is O(n²)"',
      'Say it in plain words: "for every item we scan the whole list again"',
      'Point at the bottleneck: "the cost is the `includes` inside the loop"',
      'Propose the change: "a Set makes those lookups O(1)"',
      'Restate the new complexity: "that brings the whole thing down to O(n)"',
    ],
    explanation:
      'Interviewers are listening for a structure, not just a verdict. Naming the complexity shows you can read code; the plain-words line shows you actually understand it; pointing at the bottleneck proves you can find the cost; and restating the improvement closes the loop. Jumping straight to "use a Set" skips the reasoning they are trying to score.',
  },
];

export const t1: Track = {
  id: 't1',
  title: 'Big-O & optimization talk',
  icon: 'growth',
  tagline: 'See the code, name the growth, say it out loud.',
  lessons: [
    { id: 't1-l1', title: 'Seeing growth', exerciseIds: ['t1-01', 't1-02', 't1-03', 't1-04'] },
    { id: 't1-l2', title: 'Loops that add up', exerciseIds: ['t1-05', 't1-06', 't1-07', 't1-08'] },
    { id: 't1-l3', title: 'Hidden loops', exerciseIds: ['t1-09', 't1-10', 't1-11'] },
    { id: 't1-l4', title: 'What it costs you', exerciseIds: ['t1-12', 't1-13', 't1-14'] },
    {
      id: 't1-l5',
      title: 'Saying it out loud',
      exerciseIds: ['t1-15', 't1-16', 't1-17', 't1-18'],
    },
  ],
};
