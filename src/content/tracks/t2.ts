import type { Exercise, Track } from '../types';

/**
 * Track 2: Algorithm patterns.
 *
 * Goal: read a problem statement and name the pattern inside a minute. The
 * statement-to-pattern exercises deliberately repeat the same shape with
 * different costumes, because that recognition is the trained reflex.
 */

export const t2Exercises: Exercise[] = [
  {
    id: 't2-01',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'hash-lookup',
    prompt:
      '**"Given a list of numbers, find two that add up to a target."** Which approach does an interviewer expect you to reach for?',
    options: [
      {
        text: 'Store what you have seen in a Set, and check for target − current as you go',
        correct: true,
      },
      {
        text: 'Two nested loops over every pair',
        whyWrong:
          'That is the brute force, and it is a fine thing to *mention*, but it is O(n²) and the question is asking for the improvement.',
      },
      {
        text: 'Sort the list first, then binary search for each partner',
        whyWrong:
          'This genuinely works and is O(n log n). Better than brute force, worse than the Set, and it loses the original positions if the answer needs indexes.',
      },
      {
        text: 'A sliding window over the list',
        whyWrong:
          'Sliding windows need a contiguous stretch. The two numbers here can be anywhere, so there is no window to slide.',
      },
    ],
    explanation:
      'As you walk the list, the partner you need for the current number is target minus that number. A Set answers "have I already seen that partner?" in one step, so one pass is enough. O(n) time for O(n) memory.',
  },
  {
    id: 't2-02',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'greedy',
    prompt:
      '**"An ATM must pay out an amount using the fewest banknotes."** With ordinary note values, what is this problem called?',
    options: [
      { text: 'Greedy. Repeatedly hand out the largest note that still fits', correct: true },
      {
        text: 'A one-off loop you invent on the spot',
        whyWrong:
          'This is the trap. It often produces working code, but the interviewer is listening for the *name*, and without it you cannot discuss when the approach breaks.',
      },
      {
        text: 'Binary search over the note values',
        whyWrong:
          'Binary search finds a value in sorted data. Here you are not looking for a note, you are choosing how many of each to dispense.',
      },
      {
        text: 'A frequency map of the notes in the machine',
        whyWrong:
          'Counting what is loaded in the cassettes is a different question. This one asks which notes to hand out.',
      },
    ],
    explanation:
      'This is the classic greedy problem, the one usually taught as making change: at each step take the biggest note that still fits, then repeat. Saying the word "greedy" in the first minute is worth more than the code. It tells the interviewer you recognise the shape, and it opens the conversation about when greedy fails.',
  },
  {
    id: 't2-03',
    trackId: 't2',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'greedy',
    prompt:
      'Attend as many meetings as you can. `meetings` is already sorted by finishing time, and each one has a `start` and an `end` in minutes from midnight.',
    lines: [
      { code: 'const chosen = [];', indent: 0 },
      { code: 'let freeFrom = 0;', indent: 0 },
      { code: 'for (const meeting of meetings) {', indent: 0 },
      { code: 'if (meeting.start >= freeFrom) {', indent: 1 },
      { code: 'chosen.push(meeting);', indent: 2 },
      { code: 'freeFrom = meeting.end;', indent: 2 },
      { code: '}', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'return chosen;', indent: 0 },
      { code: 'meetings.sort(byStartTime);', indent: 0, distractor: true },
      { code: 'if (meeting.start > freeFrom) {', indent: 1, distractor: true },
    ],
    explanation:
      'The greedy insight in plain words: always take the meeting that frees you earliest, because it leaves the most room for everything after it. That is why the list is sorted by finishing time, and why the sort-by-start line is a trap: starting earliest is no use if the meeting runs all afternoon. The other trap is `>` instead of `>=`, which throws away a meeting that begins exactly as the last one ends.',
  },
  {
    id: 't2-04',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'greedy',
    prompt:
      'Your stamps come in **1, 3 and 4**. The postage you need is **6**. Greedy takes 4, then 1, then 1. Three stamps. What does that tell you?',
    options: [
      {
        text: 'Greedy is not always optimal: 3 + 3 is two stamps, so this needs dynamic programming',
        correct: true,
      },
      {
        text: 'The stamp values should have been sorted the other way',
        whyWrong:
          'Sorting smallest first makes greedy worse, not better. It would take six 1s. The order is not the problem; the strategy is.',
      },
      {
        text: 'Greedy is broken and should never be used for this shape of problem',
        whyWrong:
          'Too strong. With everyday denominations, banknotes for instance, greedy is optimal and much simpler. It is the *arbitrary* values that break it.',
      },
      {
        text: 'The amount of postage is too small for greedy to work properly',
        whyWrong:
          'Size is not the issue. Greedy fails here because taking the locally biggest stamp steps past a better combination, and that can happen at any size.',
      },
    ],
    explanation:
      'Greedy commits to the best-looking choice and never reconsiders. Taking the 4 rules out using two 3s. Dynamic programming exists precisely for this: it tries the combinations and keeps the best, at the cost of more time and memory. Being able to say *why* greedy fails here is the answer interviewers want.',
  },
  {
    id: 't2-05',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sliding-window',
    prompt: '**"Find the longest stretch of a string with no repeated characters."** Pattern?',
    options: [
      {
        text: 'Sliding window. Grow from the right, shrink from the left on a repeat',
        correct: true,
      },
      {
        text: 'Sort the characters, then scan for runs',
        whyWrong:
          'Sorting destroys the order, and the question is about a *stretch* of the original string. After sorting there is no such thing as the original stretch.',
      },
      {
        text: 'Check every possible substring',
        whyWrong:
          'That is the brute force at O(n²) or worse. Worth naming out loud, but the window does the same job in one pass.',
      },
      {
        text: 'Two pointers from both ends',
        whyWrong:
          'Close. It is two pointers, but both move forward from the left rather than inward from the ends. That specific variant is the sliding window.',
      },
    ],
    explanation:
      'The word "stretch" (or "substring", or "contiguous") is the tell. Grow the window by moving the right edge; when the new character is already inside, pull the left edge in until it is not. Each character enters and leaves once, so it is O(n).',
  },
  {
    id: 't2-06',
    trackId: 't2',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'chunking',
    prompt:
      'A long alert has to go out over SMS, so it must be split into segments of at most `limit` characters (160 for a plain text message). Cuts can land anywhere for now.',
    lines: [
      { code: 'const segments = [];', indent: 0 },
      { code: 'for (let i = 0; i < text.length; i += limit) {', indent: 0 },
      { code: 'segments.push(text.slice(i, i + limit));', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'return segments;', indent: 0 },
      { code: 'segments.push(text.slice(i, limit));', indent: 1, distractor: true },
    ],
    explanation:
      'Step forward `limit` characters at a time and take a slice each step. The distractor uses `slice(i, limit)` instead of `slice(i, i + limit)`. An easy slip that returns shorter and shorter segments and empty strings once `i` passes `limit`.',
  },
  {
    id: 't2-07',
    trackId: 't2',
    type: 'parsons',
    difficulty: 3,
    conceptId: 'chunking',
    prompt:
      'Same alert, but now **no word may be split across two messages**. Walk back to the last space when the cut would land mid-word.',
    lines: [
      { code: 'const segments = [];', indent: 0 },
      { code: 'while (text.length > limit) {', indent: 0 },
      { code: 'let cut = text.lastIndexOf(" ", limit);', indent: 1 },
      { code: 'if (cut <= 0) cut = limit;', indent: 1 },
      { code: 'segments.push(text.slice(0, cut));', indent: 1 },
      { code: 'text = text.slice(cut).trimStart();', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'return [...segments, text];', indent: 0 },
      { code: 'let cut = text.indexOf(" ", limit);', indent: 1, distractor: true },
    ],
    explanation:
      '`lastIndexOf(" ", limit)` finds the last space at or before the limit. The latest clean place to cut. The `if (cut <= 0)` guard covers a single word longer than the limit; without it the loop makes no progress and hangs forever. The distractor uses `indexOf`, which finds the *next* space after the limit and produces segments that are too long.',
  },
  {
    id: 't2-08',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'edge-cases',
    prompt:
      'Your word-safe splitter meets an alert containing a tracking link **longer than the 160-character limit**, with no space anywhere inside it. What happens if you have not handled it?',
    options: [
      {
        text: 'There is no space to cut at, so the loop makes no progress and hangs',
        correct: true,
      },
      {
        text: 'It throws an error you can catch',
        whyWrong:
          'It would be kinder if it did. `lastIndexOf` returns -1 rather than throwing, so the code carries on with a nonsense cut point instead of failing loudly.',
      },
      {
        text: 'It silently drops the long link',
        whyWrong:
          'Nothing removes it. The slice at a bad cut point returns an empty string while the message stays the same length, so it repeats rather than disappears.',
      },
      {
        text: 'The link gets split across two messages anyway',
        whyWrong:
          'Only if you wrote the fallback. Without it there is no valid cut point at all, which is exactly what makes this the interesting case.',
      },
    ],
    explanation:
      'A 180-character link with the limit at 160 has no space to walk back to, so `lastIndexOf` returns -1. Slicing to -1 yields nothing, the message never shrinks, and the loop spins. The fix is a guard: if there is no space, cut hard at the limit. Naming this case before being asked is the reflex worth training.',
  },
  {
    id: 't2-09',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'hash-lookup',
    prompt:
      '**"Have I seen this before?"**. Duplicates, membership, "is X in this group". Which structure?',
    options: [
      { text: 'A Set. Membership in one step regardless of size', correct: true },
      {
        text: 'An array with `includes`',
        whyWrong:
          'It works, and it is fine for a handful of items. But `includes` scans the array, so inside a loop it turns into a hidden O(n²).',
      },
      {
        text: 'A sorted array with binary search',
        whyWrong:
          'O(log n) per lookup and it needs sorting first. Perfectly reasonable, just strictly worse than the Set when you only need membership.',
      },
      {
        text: 'A two-pointer scan',
        whyWrong:
          'Two pointers need sorted data and answer questions about pairs or stretches, not "is this one thing present".',
      },
    ],
    explanation:
      'Whenever the problem says "seen before", "duplicate", "unique" or "contains", a Set is the reflex answer. It trades memory for one-step lookups, and saying that trade out loud is the part interviewers score.',
  },
  {
    id: 't2-10',
    trackId: 't2',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'two-pointers',
    prompt: 'Build a two-pointer palindrome check.',
    lines: [
      { code: 'let lo = 0;', indent: 0 },
      { code: 'let hi = s.length - 1;', indent: 0 },
      { code: 'while (lo < hi) {', indent: 0 },
      { code: 'if (s[lo] !== s[hi]) return false;', indent: 1 },
      { code: 'lo++;', indent: 1 },
      { code: 'hi--;', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'return true;', indent: 0 },
      { code: 'let hi = s.length;', indent: 0, distractor: true },
    ],
    explanation:
      'Start a pointer at each end and walk them inward, comparing as you go. The distractor sets `hi` to `s.length` rather than `s.length - 1`, so the first comparison is against `undefined` and every string fails. It is the most common off-by-one in this pattern.',
  },
  {
    id: 't2-11',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'two-pointers',
    prompt: '**"Merge two already-sorted lists into one sorted list."** Pattern?',
    options: [
      { text: 'Two pointers. One per list, always take the smaller head', correct: true },
      {
        text: 'Concatenate them and sort the result',
        whyWrong:
          'It gives the right answer, but it throws away the fact that they are already sorted: O(n log n) instead of O(n). Interviewers ask this specifically to see whether you notice.',
      },
      {
        text: 'A sliding window across both lists',
        whyWrong:
          'A window tracks one contiguous stretch of one sequence. Here you are consuming two sequences at independent speeds.',
      },
      {
        text: 'Put both in a Set to deduplicate, then sort',
        whyWrong:
          'That changes the answer. Merging keeps duplicates. And it still sorts, so it inherits the same cost as concatenating.',
      },
    ],
    explanation:
      'Keep an index into each list, compare the two current items, take the smaller and advance that index. Each item is touched once, so it is O(n + m). The giveaway is "already sorted". Whenever an interviewer says that, they have handed you the constraint that makes the fast solution possible.',
  },
  {
    id: 't2-12',
    trackId: 't2',
    type: 'blank',
    difficulty: 2,
    conceptId: 'sliding-window',
    prompt: 'Fill in the sliding window that finds the longest run with no repeats.',
    template: `let start = 0, best = 0;
const seen = new Set();
for (let end = 0; end < s.length; end++) {
  while (seen.has(s[end])) seen.____(s[start++]);
  seen.add(s[____]);
  best = Math.max(best, end - ____ + 1);
}`,
    gaps: ['delete', 'end', 'start'],
    bank: ['delete', 'end', 'start', 'add', 'has', 'best'],
    explanation:
      'The right edge (`end`) always moves forward. When the incoming character is already in the window, the left edge (`start`) advances and those characters leave the Set until the clash is gone. The window length is `end - start + 1`, and the `+ 1` is because both ends are inclusive.',
  },
  {
    id: 't2-13',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'frequency-map',
    prompt: '**"Count how many times each word appears."** Pattern?',
    options: [
      { text: 'A frequency map. One pass, tallying into an object or Map', correct: true },
      {
        text: 'Sort the words, then count runs of the same word',
        whyWrong:
          'It works and needs no extra structure, but it costs O(n log n) for the sort where the map does it in O(n).',
      },
      {
        text: 'For each unique word, filter the array and take the length',
        whyWrong:
          'This is the hidden O(n²): a full scan per unique word. It reads nicely, which is exactly why it slips through.',
      },
      {
        text: 'A Set of the words',
        whyWrong:
          'A Set tells you *which* words appeared but not how many times. It deliberately discards duplicates, which is the information you need here.',
      },
    ],
    explanation:
      'Counting occurrences is the frequency-map reflex: walk the list once, adding one to the tally for each item. The same structure answers "most common", "first non-repeating" and "is this an anagram". Recognising it once buys you a whole family of problems.',
  },
  {
    id: 't2-14',
    trackId: 't2',
    type: 'parsons',
    difficulty: 2,
    conceptId: 'frequency-map',
    prompt: 'Build a frequency counter with `reduce`.',
    lines: [
      { code: 'const counts = words.reduce((acc, word) => {', indent: 0 },
      { code: 'acc[word] = (acc[word] ?? 0) + 1;', indent: 1 },
      { code: 'return acc;', indent: 1 },
      { code: '}, {});', indent: 0 },
      { code: 'return counts;', indent: 0 },
      { code: '});', indent: 0, distractor: true },
    ],
    explanation:
      'The `?? 0` handles the first sighting of a word, where the tally does not exist yet. The distractor closes `reduce` without the `{}` starting value, and without it, the first `acc` is the first *word* rather than an empty object, so the whole thing collapses.',
  },
  {
    id: 't2-15',
    trackId: 't2',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'edge-cases',
    prompt:
      'Page 1 should return items 0–9, page 2 items 10–19. **Tap the line with the off-by-one.**',
    code: {
      lang: 'js',
      source: `function page(items, pageNumber, size) {
  const start = pageNumber * size;
  const end = start + size;
  return items.slice(start, end);
}`,
    },
    buggyLineIndex: 1,
    lineHints: {
      2: 'This line is fine. The end is always the start plus one page of items.',
      3: '`slice` is doing exactly what it should here; the values it is given are the problem.',
    },
    explanation:
      'Pages are numbered from 1 but arrays are indexed from 0, so the start must be `(pageNumber - 1) * size`. As written, page 1 starts at index 10 and the first ten items can never be reached. This is the most common pagination bug there is, and it hides well because nothing crashes.',
  },
  {
    id: 't2-16',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'frequency-map',
    prompt: '**"Find the first character that never repeats."** What is the shape of the solution?',
    options: [
      {
        text: 'Two passes: count everything first, then scan again for the first count of 1',
        correct: true,
      },
      {
        text: 'One pass, returning the first character whose count is still 1',
        whyWrong:
          'You cannot know a character never repeats until you have seen the whole string. A later duplicate would prove you wrong after you had already returned.',
      },
      {
        text: 'Sort the string and look for a lone character',
        whyWrong:
          'Sorting groups duplicates together, which does find the non-repeating ones, but it destroys the order, and the question asks for the *first*.',
      },
      {
        text: 'A sliding window of size one',
        whyWrong:
          'A window of one character carries no information about the rest of the string, so there is nothing for it to slide over.',
      },
    ],
    explanation:
      'Two passes is the answer, and it is still O(n). Two passes is a constant factor, not a change in growth. Pass one builds the tally; pass two walks the original string in order and returns the first character with a count of one. Going in the original order is what makes it the *first*.',
  },
  {
    id: 't2-17',
    trackId: 't2',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'bfs-mental-model',
    prompt:
      '**"What is the minimum number of moves to reach the end?"** What does "minimum number of moves" point at?',
    options: [
      {
        text: 'Breadth-first search. The first time it arrives, that route is the shortest',
        correct: true,
      },
      {
        text: 'Depth-first search, following each route to the end',
        whyWrong:
          'Depth-first will find *a* route, but it may find a long one first, so you would have to explore everything and compare. Breadth-first gets the shortest for free.',
      },
      {
        text: 'Greedy. Always take the biggest jump available',
        whyWrong:
          'Sometimes right, often not. A big jump can land somewhere with no good continuation, and greedy never reconsiders. Some jump problems do have a greedy solution, but "minimum" alone does not guarantee it.',
      },
      {
        text: 'Sort the moves and binary search',
        whyWrong:
          'There is no sorted structure to search. The answer is a sequence of moves through states, not a value hiding in a list.',
      },
    ],
    explanation:
      'Breadth-first explores everything one move away, then everything two moves away, and so on. Because it never looks at distance three before finishing distance two, the first time it touches the goal it has arrived by the shortest route. "Minimum number of steps" is the phrase that should make you say BFS.',
  },
  {
    id: 't2-18',
    trackId: 't2',
    type: 'steps',
    difficulty: 2,
    conceptId: 'whiteboard-script',
    prompt: 'You have just been given a problem. **Put the first two minutes in order.**',
    steps: [
      'Restate the problem in your own words and check you have it right',
      'Make up a tiny concrete example and walk through it',
      'Say the brute-force approach out loud, with its complexity',
      'Name the pattern that would improve on it',
      'Describe your plan for the code before writing any',
    ],
    explanation:
      'Every step here buys you something. Restating catches a misunderstanding while it is still free. The example gives you something to test against. Saying the brute force means you always have an answer on the table. Naming the pattern is what is actually being scored. And the plan means the code you write is the code you meant to write.',
  },
  {
    id: 't2-19',
    trackId: 't2',
    type: 'parsons',
    difficulty: 3,
    conceptId: 'log-n',
    prompt: 'Build binary search over a sorted array. Return the index, or -1.',
    lines: [
      { code: 'let lo = 0, hi = arr.length - 1;', indent: 0 },
      { code: 'while (lo <= hi) {', indent: 0 },
      { code: 'const mid = Math.floor((lo + hi) / 2);', indent: 1 },
      { code: 'if (arr[mid] === target) return mid;', indent: 1 },
      { code: 'if (arr[mid] < target) lo = mid + 1;', indent: 1 },
      { code: 'else hi = mid - 1;', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'return -1;', indent: 0 },
      { code: 'const mid = (lo + hi) / 2;', indent: 1, distractor: true },
      { code: 'if (arr[mid] < target) lo = mid;', indent: 1, distractor: true },
    ],
    explanation:
      'Two classic traps, both included as distractors. Without `Math.floor`, `mid` can be 2.5 and the index lookup returns undefined. And `lo = mid` rather than `lo = mid + 1` means that when `hi` is `lo + 1` the range stops shrinking. An infinite loop that passes every test where the target happens to be found early.',
  },
  {
    id: 't2-20',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'recursion',
    prompt:
      'You wrote a recursive tree traversal. The interviewer asks: **"what happens on a very deep tree?"** What are they probing?',
    options: [
      {
        text: 'That deep recursion can exhaust the call stack, and an iterative version avoids it',
        correct: true,
      },
      {
        text: 'That recursion is always slower than a loop',
        whyWrong:
          'There is some call overhead, but it is a constant factor and rarely the point. The failure mode they are asking about is the stack running out, not gradual slowness.',
      },
      {
        text: 'That recursion uses more memory per node',
        whyWrong:
          'Warm. The stack frames are memory. But the concern is not the per-node cost, it is that the stack has a hard ceiling and crashes when it is hit.',
      },
      {
        text: 'That the tree should have been balanced first',
        whyWrong:
          'You usually do not control the shape of the input. The question is how your code behaves given a bad shape, not how to avoid receiving one.',
      },
    ],
    explanation:
      'Every call in progress occupies a frame on the call stack, and the stack is finite. A few thousand frames deep and it throws. A balanced tree of a million nodes is only about twenty deep and fine; a degenerate one-per-level tree is a million deep and fatal. The answer they want is "I would rewrite it with an explicit stack if the depth could get large."',
  },
  {
    id: 't2-21',
    trackId: 't2',
    type: 'blank',
    difficulty: 3,
    conceptId: 'memoization',
    prompt: 'Fill in the memoised Fibonacci. The cache check and the cache write.',
    template: `const cache = new Map();
function fib(n) {
  if (n < 2) return n;
  if (cache.____(n)) return cache.get(n);
  const result = fib(n - 1) + fib(n - 2);
  cache.____(n, result);
  return result;
}`,
    gaps: ['has', 'set'],
    bank: ['has', 'set', 'get', 'add', 'delete'],
    explanation:
      'Two lines turn an exponential function into a linear one. The check returns early for anything already worked out; the write records each new answer before returning it. Note `set` takes a key and a value: `add` is the Set method, and reaching for it here is the usual slip.',
  },
  {
    id: 't2-22',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sliding-window',
    prompt: '**"Alert if a user makes more than 100 requests in any rolling minute."** Pattern?',
    options: [
      {
        text: 'A sliding window over timestamps. Drop anything older than a minute',
        correct: true,
      },
      {
        text: 'Count requests per calendar minute and check each total',
        whyWrong:
          'That is a fixed window, and it misses bursts that straddle the boundary: 100 requests at 10:00:59 and 100 more at 10:01:01 never trip it, despite 200 in two seconds.',
      },
      {
        text: 'A frequency map keyed by user',
        whyWrong:
          'You do need to count per user, but a plain tally has no notion of time, so it can only ever grow. The time dimension is the whole problem.',
      },
      {
        text: 'Sort the timestamps and binary search for the cut-off',
        whyWrong:
          'Timestamps arrive in order already, so there is nothing to sort. Dropping expired entries from the front is cheaper than searching for them.',
      },
    ],
    explanation:
      'This is the same window as the substring problem, with time on the axis instead of position. Push each new timestamp on the right and drop anything older than sixty seconds off the left; the window size is your count. "Rolling" is the giveaway word, and this is the version you actually meet at work.',
  },
  {
    id: 't2-23',
    trackId: 't2',
    type: 'match',
    difficulty: 2,
    conceptId: 'pattern-map',
    prompt: 'Pair each problem statement with the pattern it points at.',
    pairs: [
      { left: 'Longest stretch with no repeats', right: 'Sliding window' },
      { left: 'Two numbers adding to a target', right: 'Hash map' },
      { left: 'The array is sorted, find a pair', right: 'Two pointers' },
      { left: 'How many times does each appear', right: 'Frequency map' },
      { left: 'Fewest coins for an amount', right: 'Greedy' },
    ],
    explanation:
      'This mapping is the single highest-value thing in the track. Interviews are won in the first sixty seconds by recognising the shape, and the statements above are the costumes these five patterns almost always wear.',
  },
  {
    id: 't2-24',
    trackId: 't2',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'pattern-map',
    prompt:
      'Careful with this one. **"Find the shortest stretch of the array containing every distinct value at least once."** Which is it?',
    options: [
      {
        text: 'Sliding window *and* a frequency map. The window slides, the map tracks what is inside it',
        correct: true,
      },
      {
        text: 'Sliding window alone',
        whyWrong:
          'The window is right, but a bare window cannot answer "does this stretch contain everything?". You need counts of what is currently inside it.',
      },
      {
        text: 'Frequency map alone',
        whyWrong:
          'A map counts the whole array without any notion of a stretch. The question asks for a contiguous region, which is what the window supplies.',
      },
      {
        text: 'Two pointers from both ends',
        whyWrong:
          'Both-ends pointers shrink toward the middle and would skip over stretches in the interior. Here both pointers move forward, which is the sliding window.',
      },
    ],
    explanation:
      'Real problems combine patterns, and reading carefully is the skill being trained. "Shortest stretch" is a window; "containing every distinct value" needs counts, which is a frequency map. Grow the right edge until the window has everything, then pull the left edge in as far as it will go while it still does, and record the best.',
  },
  {
    id: 't2-25',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'hash-lookup',
    prompt:
      '**"You have 50,000 orders and a list of refund records. For each refund, find its order."** What do you reach for?',
    promptVariants: [
      '**"Every refund row names an order id. You need the matching order for each of them."** Which approach?',
      '**"Match each refund to its order. There are tens of thousands of both."** What is the shape of the answer?',
    ],
    options: [
      { text: 'Build a Map from order id to order once, then look each one up', correct: true },
      {
        text: 'For each refund, scan the orders array with `find`',
        whyWrong:
          'That is a loop inside a loop wearing a friendly name. Every refund walks all 50,000 orders, so the cost is refunds times orders.',
      },
      {
        text: 'Sort the orders by id, then binary search for each refund',
        whyWrong:
          'This works and is much better than scanning, but you pay O(n log n) to sort and O(log n) per lookup when a Map gives you one step for free.',
      },
      {
        text: 'Two pointers walking both lists together',
        whyWrong:
          'Two pointers needs both lists in the same order to be any use. Refunds do not arrive in order id order, so the pointers have nothing to march along.',
      },
    ],
    explanation:
      'Any time you find yourself saying "for each of these, find the matching one of those", that is a Map. You pay one pass to build it and one step per lookup after that. Naming it as a join in memory is the sentence interviewers are waiting for.',
  },
  {
    id: 't2-26',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'hash-lookup',
    prompt:
      '**"Given a flat list of chat messages, each carrying a conversation id, produce the messages grouped by conversation."** Pattern?',
    promptVariants: [
      '**"Turn one long list of messages into one list per conversation."** Which approach does an interviewer expect?',
    ],
    options: [
      {
        text: 'One pass, pushing each message into a Map keyed by conversation id',
        correct: true,
      },
      {
        text: 'Collect the distinct conversation ids, then filter the messages once per id',
        whyWrong:
          'It gives the right answer, but each filter walks every message, so with 200 conversations you walk the list 200 times instead of once.',
      },
      {
        text: 'Sort the messages by conversation id, then cut the list at each change',
        whyWrong:
          'This works and is what a database would do, but it costs O(n log n) for a sort you do not need. One pass with a Map is O(n) and clearer.',
      },
      {
        text: 'A frequency map of conversation ids',
        whyWrong:
          'A frequency map counts how many messages each conversation has. The question asks to keep the messages themselves, not just tally them.',
      },
    ],
    explanation:
      'Grouping is the same machinery as counting: a Map keyed by whatever you are grouping on. The only difference is what you keep in each slot, a running number for counting or an array for grouping. Say "group by, one pass, O(n)" and you have named it.',
  },
  {
    id: 't2-27',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'hash-lookup',
    prompt:
      '**"Each log line has a request id and a duration. Find two requests whose durations add up to exactly the timeout budget."** Pattern?',
    promptVariants: [
      '**"Two requests together used exactly the whole budget. Find them."** Which approach?',
    ],
    options: [
      {
        text: 'One pass with a Map of durations seen so far, checking for budget minus current',
        correct: true,
      },
      {
        text: 'Sort the durations, then two pointers from both ends',
        whyWrong:
          'A genuinely good answer, O(n log n), and worth saying out loud. It loses the request ids unless you sort pairs, and the Map does the job in one pass.',
      },
      {
        text: 'Check every pair of log lines',
        whyWrong:
          'The brute force, O(n²). Fine to name as a starting point, but the whole question is what you do instead of it.',
      },
      {
        text: 'A sliding window over the log lines',
        whyWrong:
          'A window covers a contiguous stretch. The two requests can be anywhere in the file, so there is nothing to slide.',
      },
    ],
    explanation:
      'The partner you need for the current duration is the budget minus that duration, which is a single subtraction. A Map answers "have I already seen that number, and which request was it?" in one step, so one pass over the file is enough.',
  },
  {
    id: 't2-28',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'hash-lookup',
    prompt:
      '**"A nightly backup gets a batch of file paths. Skip any path that is already in the archive."** What do you reach for?',
    promptVariants: [
      '**"Only back up the files that are not already stored."** Which approach?',
      '**"Given the archive contents and tonight\'s batch, which files are actually new?"** Pattern?',
    ],
    options: [
      { text: 'Put the archive paths in a Set, then test each incoming path', correct: true },
      {
        text: 'For each incoming path, call `includes` on the archive array',
        whyWrong:
          '`includes` scans from the start every time. It looks like one call but it is a loop, so a batch of 1,000 against an archive of 100,000 is 100 million comparisons.',
      },
      {
        text: 'Sort both lists, then compare them with two pointers',
        whyWrong:
          'This works and is what you would do if the lists were too big for memory. Here the Set is one line, one pass and no sort.',
      },
      {
        text: 'A frequency map of the archive paths',
        whyWrong:
          'Counting how many times each path appears answers a question nobody asked. You only need yes or no, which is exactly what a Set is for.',
      },
    ],
    explanation:
      '"Is this one already in that pile?" is the Set question. Building the Set costs one pass over the archive and a bit of memory; every test after that is one step. The trap is `includes`, which reads like a single operation and is really a hidden loop.',
  },
  {
    id: 't2-29',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'hash-lookup',
    prompt:
      'Read this one carefully. **"Given the sequence of squares a game piece landed on, report the first square it landed on twice."** Pattern?',
    promptVariants: [
      'Careful. **"Which square did the piece revisit first?"** You have the moves in order.',
    ],
    options: [
      {
        text: 'A Set of squares seen so far, returning the first one already in it',
        correct: true,
      },
      {
        text: 'A frequency map of squares, then find the ones with a count above 1',
        whyWrong:
          'This is the near miss. Counting works, but it has to read the whole sequence before it can answer, and then you have lost which repeat came *first*.',
      },
      {
        text: 'Sort the squares, then look for neighbours that are equal',
        whyWrong:
          'Sorting destroys the order the piece moved in, and "first" is a question about that order. The answer would be the smallest repeated square, not the earliest.',
      },
      {
        text: 'Two pointers, one at each end of the sequence',
        whyWrong:
          'Both-ends pointers work on sorted data or on a symmetric question like a palindrome. Here you need the earliest repeat in the original order.',
      },
    ],
    explanation:
      'Counting and membership look interchangeable and are not. The word "first" means you must answer while walking, and a Set lets you stop the moment you meet a square again. A frequency map is the right tool for "which square was landed on most", a different question.',
  },
  {
    id: 't2-30',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sliding-window',
    prompt:
      '**"You have one error count per minute for a whole day. Find the worst ten minutes."** Pattern?',
    promptVariants: [
      '**"Which ten consecutive minutes had the most errors?"** How do you approach it?',
      '**"Find the highest total over any ten minutes in a row."** Which pattern is this?',
    ],
    options: [
      {
        text: 'A fixed-size sliding window: add the minute entering, subtract the one leaving',
        correct: true,
      },
      {
        text: 'Sum every possible ten-minute block separately',
        whyWrong:
          'Correct but wasteful: each block re-adds nine numbers you already added. It is O(n × k) where the window does the same job in O(n).',
      },
      {
        text: 'Sort the minutes by error count and take the top ten',
        whyWrong:
          'Sorting scatters the minutes, and the question asks for ten *consecutive* ones. The worst ten minutes individually may be spread across the day.',
      },
      {
        text: 'Two pointers moving inward from both ends of the day',
        whyWrong:
          'Both-ends pointers converge on the middle and would never examine most of the ten-minute blocks. The window moves forward instead.',
      },
    ],
    explanation:
      'A fixed window is the cheapest of the family: the size never changes, so each step is one addition and one subtraction. The tell is "consecutive" or "in a row" plus a fixed count. Say "sliding window, O(n), one add and one subtract per step".',
  },
  {
    id: 't2-31',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sliding-window',
    prompt:
      '**"A customer\'s card is blocked after spending more than the daily limit. Find the longest run of transactions that stays under it."** Pattern?',
    promptVariants: [
      '**"What is the longest stretch of consecutive charges whose total stays under the limit?"** Which pattern?',
    ],
    options: [
      {
        text: 'A growing and shrinking window: extend right, pull the left edge in when the total goes over',
        correct: true,
      },
      {
        text: 'A fixed-size sliding window',
        whyWrong:
          'Close, but the length is what you are looking for, so it cannot be fixed in advance. The window has to be free to grow and shrink.',
      },
      {
        text: 'Sort the transactions smallest first, then take them until the limit is reached',
        whyWrong:
          'That is the greedy move, and it answers "how many charges fit", not "which consecutive run fits". Sorting destroys the run.',
      },
      {
        text: 'Binary search on the answer length',
        whyWrong:
          'It can be made to work, and it is a good thing to mention as a second approach, but it is a heavier tool than the window and needs a check pass per guess.',
      },
    ],
    explanation:
      'When the window length is the thing being asked for, the window is variable: the right edge always moves forward, and the left edge moves forward only while the rule is broken. Each transaction enters once and leaves once, so it is still one pass.',
  },
  {
    id: 't2-32',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'two-pointers',
    prompt:
      '**"Two people each have a calendar of busy blocks, already sorted by start time. Find every slot where both are free."** Pattern?',
    promptVariants: [
      '**"Given two sorted lists of busy times, find the gaps they share."** Which approach?',
    ],
    options: [
      {
        text: 'Two pointers, one per calendar, always advancing the one that ends earlier',
        correct: true,
      },
      {
        text: 'Merge both lists into one, sort it, then scan for gaps',
        whyWrong:
          'It works, but you are paying O(n log n) to re-sort data that arrived sorted. The whole point of "already sorted" in the statement is that you should not need to.',
      },
      {
        text: 'A Set of busy minutes from each calendar, then intersect them',
        whyWrong:
          'This turns a handful of blocks into thousands of minutes, so memory and time now depend on the length of the day rather than the number of meetings.',
      },
      {
        text: 'A sliding window over the merged blocks',
        whyWrong:
          'A window tracks one contiguous stretch of one list. Here you are stepping through two lists at once, which is what two pointers is for.',
      },
    ],
    explanation:
      '"Two sorted lists" is the loudest two-pointer signal there is. Keep an index into each, compare the fronts, and advance whichever finishes first. Both lists are consumed once, so it is O(n + m) with no extra memory.',
  },
  {
    id: 't2-33',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'two-pointers',
    prompt:
      '**"A replay is valid if the sequence of moves reads the same forwards and backwards, ignoring pauses."** Pattern?',
    promptVariants: [
      '**"Check whether the move sequence is a mirror of itself, skipping any pause entries."** How do you do it?',
    ],
    options: [
      {
        text: 'Two pointers from both ends, each skipping pauses before comparing',
        correct: true,
      },
      {
        text: 'Strip the pauses into a new array, reverse it, and compare the two arrays',
        whyWrong:
          'Correct, easy to read, and worth saying out loud. It costs an extra copy of the whole sequence, which the two-pointer version avoids entirely.',
      },
      {
        text: 'A frequency map of moves, checking that at most one has an odd count',
        whyWrong:
          'That tests whether the moves *could* be rearranged into a mirror. The question is whether this exact order already is one.',
      },
      {
        text: 'A sliding window growing from the middle',
        whyWrong:
          'Growing outward from the centre is the trick for finding the longest mirrored stretch. To check the whole sequence, walking inward from both ends is simpler.',
      },
    ],
    explanation:
      'Mirror questions are the classic both-ends two-pointer shape: compare the outermost pair, step inward, stop when they cross. The "ignoring pauses" clause is the only twist, and it is handled by moving each pointer past a pause before comparing. O(n) time, no extra memory.',
  },
  {
    id: 't2-34',
    trackId: 't2',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'frequency-map',
    prompt:
      '**"Which three emoji-free reaction words are used most often across a channel\'s messages?"** Pattern?',
    promptVariants: [
      '**"Report the three most common reaction words in the channel."** Which approach?',
    ],
    options: [
      { text: 'Count each word in a Map, then take the three highest counts', correct: true },
      {
        text: 'Sort all the words, then measure each run of equal words',
        whyWrong:
          'It works, and it is what you would do if the data did not fit in memory. In memory it costs O(n log n) for something counting does in O(n).',
      },
      {
        text: 'A Set of the words used',
        whyWrong:
          'A Set throws away exactly the information you need. It can tell you *which* words appeared, never how often.',
      },
      {
        text: 'A sliding window over the messages',
        whyWrong:
          'A window is for questions about a contiguous stretch. "Most often across the channel" is about the whole set, with no notion of position.',
      },
    ],
    explanation:
      '"Most common", "how many times", "top N by count": all of these are a frequency map. Count in one pass, then take the largest few. For a small N, scanning the counts beats sorting them, and saying so is a nice extra half-sentence.',
  },
  {
    id: 't2-35',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'frequency-map',
    prompt:
      'A near miss. **"Two folders hold the same files under different names. Decide whether the two folders hold the same *set of file sizes*."** Pattern?',
    promptVariants: [
      'Careful with this one. **"Do these two folders contain the same multiset of file sizes?"** Which approach?',
    ],
    options: [
      {
        text: 'Count the sizes in each folder with a Map, then compare the two counts',
        correct: true,
      },
      {
        text: 'Sort both size lists and compare them element by element',
        whyWrong:
          'This is the near miss, and it is correct. It costs O(n log n) where counting costs O(n), and it is the answer most candidates give without noticing the cheaper one.',
      },
      {
        text: "Put each folder's sizes in a Set and compare the Sets",
        whyWrong:
          'A Set forgets duplicates, so a folder with three 1KB files would look identical to one with a single 1KB file. Sizes repeat, so the counts matter.',
      },
      {
        text: 'Two pointers walking both folders at once',
        whyWrong:
          'Two pointers needs both lists sorted first, which puts you back at the O(n log n) answer with more moving parts.',
      },
    ],
    explanation:
      'Sorting and counting both answer "are these the same collection?", so the interesting part is the cost. Counting is one pass per folder and one comparison of the maps, so O(n). Recognising that sorting is the *reflex* rather than the *best* answer is what this item trains.',
  },
  {
    id: 't2-36',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'greedy',
    prompt:
      '**"You have one meeting room and a pile of requests. Turn away as few as possible."** Pattern?',
    promptVariants: [
      '**"One room, many requests. Accept as many as you can."** Which approach?',
      '**"Fit the largest number of bookings into a single room."** Pattern?',
    ],
    options: [
      {
        text: 'Greedy: sort by finishing time and take every request that still fits',
        correct: true,
      },
      {
        text: 'Greedy: take the shortest requests first',
        whyWrong:
          'Plausible and wrong. A short meeting sitting across the middle of the day can block two longer ones that would both have fitted around it.',
      },
      {
        text: 'Greedy: take the earliest-starting requests first',
        whyWrong:
          'Also plausible and also wrong. The earliest start can run until closing time, which costs you every request behind it.',
      },
      {
        text: 'Dynamic programming over every subset of requests',
        whyWrong:
          'It would give the right answer and it is enormously more expensive. Greedy by finishing time is provably optimal here, which is the point of the question.',
      },
    ],
    explanation:
      'This one is worth memorising because two natural greedy rules are wrong and one is right. Always take the meeting that frees the room earliest: it leaves the most room for everything after it. When an interviewer asks "why does that work?", that sentence is the proof in plain words.',
  },
  {
    id: 't2-37',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'greedy',
    prompt:
      '**"Pack a set of files onto as few fixed-size discs as possible."** What should you say about this one?',
    promptVariants: [
      '**"Spread these files across the fewest discs you can."** What is the honest answer?',
    ],
    options: [
      {
        text: 'It is bin packing. Greedy gets close but is not optimal, and the exact answer is expensive',
        correct: true,
      },
      {
        text: 'Greedy largest-first is optimal here, same as making change',
        whyWrong:
          'Largest-first is a good heuristic and often near the best, but it is not guaranteed optimal. Claiming that it is, is the mistake being tested.',
      },
      {
        text: 'Sort the files and use two pointers to pair large with small',
        whyWrong:
          'That pairing trick works when each disc holds exactly two files. With any number per disc it stops being an answer.',
      },
      {
        text: 'It is a sliding window over the sorted file sizes',
        whyWrong:
          'A window works on a contiguous stretch of one list. Files can go on any disc in any combination, so there is no stretch to slide.',
      },
    ],
    explanation:
      'Knowing when greedy is only *good enough* is worth as much as knowing when it is right. Bin packing is the standard example: largest-first typically lands within a small factor of the best answer, and the exact answer needs search. Saying "greedy heuristic, not provably optimal, here is the trade-off" is a strong answer.',
  },
  {
    id: 't2-38',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'log-n',
    prompt:
      '**"Log lines are stored sorted by timestamp. Find the first line at or after a given time."** Pattern?',
    promptVariants: [
      '**"Jump to where a given timestamp would start in a sorted log."** Which approach?',
    ],
    options: [
      {
        text: 'Binary search for the boundary, keeping the leftmost candidate as you narrow',
        correct: true,
      },
      {
        text: 'Scan forward until a timestamp is not smaller than the target',
        whyWrong:
          'Correct and O(n). With a sorted file the whole point is that you can throw away half the remaining lines at every step instead of reading them.',
      },
      {
        text: 'Build a Map from timestamp to line, then look the time up',
        whyWrong:
          'A Map only finds a timestamp that exists exactly. The question asks for the first line at or *after* a time, which may not be present at all.',
      },
      {
        text: 'Two pointers moving inward from both ends',
        whyWrong:
          'Two pointers converge based on a comparison between the two ends. Here each step compares against the target and discards a half, which is binary search.',
      },
    ],
    explanation:
      'Sorted data plus "find the first one that satisfies X" is a boundary search, the most useful binary search variant in real work. Instead of returning on a match, you record the candidate and keep searching left. Twenty steps covers a million lines.',
  },
  {
    id: 't2-39',
    trackId: 't2',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'log-n',
    prompt:
      'A tricky one. **"Players are dealt into rooms. Given a fixed number of rooms, what is the smallest possible size of the largest room?"** Pattern?',
    promptVariants: [
      'Tricky. **"Split the queue into a fixed number of rooms so the biggest room is as small as it can be."** Which approach?',
    ],
    options: [
      {
        text: 'Binary search on the answer: guess a maximum size, check whether it fits in the rooms',
        correct: true,
      },
      {
        text: 'Greedy: fill each room to the average size and move on',
        whyWrong:
          'The average is not always reachable, because players cannot be split. Greedy by average gets close and can be beaten, which is exactly why this needs a search.',
      },
      {
        text: 'Sort the players and deal them round-robin into the rooms',
        whyWrong:
          'Round-robin balances counts, not sizes, and the question is about size. It is a reasonable first answer to name before you improve on it.',
      },
      {
        text: 'A sliding window over the queue',
        whyWrong:
          'A window would give you one grouping at a time with no way to compare it against the best possible. The search here is over candidate answers, not over positions.',
      },
    ],
    explanation:
      'This is binary search wearing a costume: the thing being searched is not a position in a list, it is the answer itself. If a maximum room size of 40 works, so does 41, and that yes-or-no pattern is what makes the search valid. Spotting "smallest possible maximum" as a binary-search tell is a genuinely senior move.',
  },
  {
    id: 't2-40',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'bfs-mental-model',
    prompt:
      '**"How many forwards does it take for a message to reach one person from another, given who forwards to whom?"** Pattern?',
    promptVariants: [
      '**"Find the fewest hops between two people in the forwarding graph."** Which approach?',
    ],
    options: [
      { text: 'Breadth-first search from one person, counting levels', correct: true },
      {
        text: 'Depth-first search, keeping the shortest path found',
        whyWrong:
          'It will find *a* path quickly and may wander a long way round before finding the short one. It only gives the shortest after exploring everything.',
      },
      {
        text: 'Sort the people by how many contacts they have, then follow the busiest',
        whyWrong:
          'A popular contact is not necessarily on the shortest path. This is a heuristic with no guarantee, and the question asks for the actual fewest hops.',
      },
      {
        text: 'A frequency map of who forwards to whom',
        whyWrong:
          'Counting forwards tells you who is busy. It carries nothing about the distance between two particular people.',
      },
    ],
    explanation:
      '"Fewest steps", "shortest path", "minimum hops" on an unweighted graph is always breadth-first search. It expands one ring at a time, so the first time it reaches the target it has arrived by the shortest route. Depth-first goes deep first and gives no such guarantee.',
  },
  {
    id: 't2-41',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'bfs-mental-model',
    prompt:
      '**"Tapping a blank tile on the board should clear it and every blank tile connected to it."** Pattern?',
    promptVariants: [
      '**"Clear the whole connected region of blank tiles around the one that was tapped."** Which approach?',
    ],
    options: [
      {
        text: 'A flood fill: breadth-first or depth-first from the tapped tile, marking visited tiles',
        correct: true,
      },
      {
        text: 'Breadth-first, and depth-first would give a different region',
        whyWrong:
          'Both reach exactly the same set of tiles. They differ in the order they visit and in memory shape, not in what ends up cleared.',
      },
      {
        text: 'Scan the whole board row by row, clearing every blank tile',
        whyWrong:
          'That clears blank regions elsewhere on the board too. Only the region connected to the tapped tile should go.',
      },
      {
        text: 'Two pointers moving outward from the tapped tile',
        whyWrong:
          'Two pointers works along a line. A board region spreads in two dimensions and can wrap around obstacles, which pointers cannot follow.',
      },
    ],
    explanation:
      'Flood fill is the same search you use for shortest paths, minus the counting: start at one cell, visit every neighbour that qualifies, mark what you have seen so you never revisit. The visited marks are what stops it looping forever, and forgetting them is the classic bug.',
  },
  {
    id: 't2-42',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'memoization',
    prompt:
      '**"A pricing rule calls itself on smaller baskets, and the same basket keeps coming up."** Pattern?',
    promptVariants: [
      '**"The recursive price calculation recomputes the same sub-basket over and over."** What fixes it?',
    ],
    options: [
      { text: "Memoize: cache each basket's price the first time it is worked out", correct: true },
      {
        text: 'Rewrite it as a loop',
        whyWrong:
          'A loop removes the call stack, not the repeated work. If the same sub-basket is priced twice, an iterative version prices it twice too.',
      },
      {
        text: 'Add a Set of baskets already seen and skip them',
        whyWrong:
          'Skipping means returning nothing for a basket you have already priced, which breaks the total. You need its *value* back, so a Map, not a Set.',
      },
      {
        text: 'Sort the baskets so the repeats sit next to each other',
        whyWrong:
          'The repeats arrive from different branches of the recursion, not from a list you control the order of, so there is nothing to sort.',
      },
    ],
    explanation:
      '"The same input keeps coming back" is the memoization signal. Keep a Map from input to result, check it before doing the work, and store the answer on the way out. It trades memory for time, which is a trade you should say out loud rather than make silently.',
  },
  {
    id: 't2-43',
    trackId: 't2',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'memoization',
    prompt:
      '**"Rendering a folder tree calls an expensive size calculation for every folder, and parents recount their children."** Pattern?',
    promptVariants: [
      '**"Each folder recomputes the sizes of everything beneath it, and so does its parent."** What do you reach for?',
    ],
    options: [
      { text: "Cache each folder's computed size, keyed by folder id", correct: true },
      {
        text: 'Compute the sizes on a background thread',
        whyWrong:
          'That moves the cost off the main thread without removing it. The same subtree is still measured many times, so the machine still does the work.',
      },
      {
        text: 'A frequency map of how often each folder is visited',
        whyWrong:
          'It would prove the problem exists, which is useful for a bug report and useless as a fix. Counting visits does not remove them.',
      },
      {
        text: 'Debounce the size calculation',
        whyWrong:
          'Debouncing helps when the *same* call fires repeatedly in quick succession from an event. Here the repeats are different folders asking for overlapping work.',
      },
    ],
    explanation:
      'A tree where parents include their children is the textbook case for caching: every subtree is asked for once per ancestor. Store each folder size the first time and the work collapses from repeated passes to one. The follow-up question is always invalidation, so mention when the cache has to be cleared.',
  },
  {
    id: 't2-44',
    trackId: 't2',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'pattern-map',
    prompt:
      'Last near miss. **"Find the earliest meeting slot of at least 30 minutes that three named people are all free for."** Which is it?',
    promptVariants: [
      'Careful. **"Three calendars, one slot of 30 minutes or more, earliest wins."** Which pattern?',
    ],
    options: [
      {
        text: 'Merge the busy blocks with pointers across the three calendars, then take the first gap wide enough',
        correct: true,
      },
      {
        text: 'A sliding window over the day',
        whyWrong:
          'This is the near miss. "At least 30 minutes" sounds like a window, but the data is intervals rather than a list of positions, so there is nothing to slide over.',
      },
      {
        text: 'Greedy: take the first slot any one of them is free for',
        whyWrong:
          'Greedy is right about "earliest wins", but a slot has to clear all three calendars. Committing to the first gap in one of them ignores the other two.',
      },
      {
        text: 'Binary search over the times of day',
        whyWrong:
          'Binary search needs the answer to be monotone: if a time works, all later times work. Availability comes and goes through the day, so that does not hold.',
      },
    ],
    explanation:
      'Interval problems answer to pointers, not windows, and a duration in the statement is not automatically a window. Walk the three sorted busy lists together, keep the latest end seen so far, and the first gap that is 30 minutes or more is your answer. Reading the *shape of the data* before the keywords is the skill here.',
  },
];

export const t2: Track = {
  id: 't2',
  title: 'Algorithm patterns',
  icon: 'compass',
  tagline: 'Read the problem, name the pattern, inside a minute.',
  lessons: [
    {
      id: 't2-l1',
      title: 'Greedy, and where it breaks',
      exerciseIds: ['t2-01', 't2-02', 't2-03', 't2-04'],
    },
    {
      id: 't2-l2',
      title: 'Splitting a message',
      exerciseIds: ['t2-05', 't2-06', 't2-07', 't2-08'],
    },
    { id: 't2-l3', title: 'Windows & pointers', exerciseIds: ['t2-09', 't2-10', 't2-11', 't2-12'] },
    { id: 't2-l4', title: 'Counting things', exerciseIds: ['t2-13', 't2-14', 't2-15', 't2-16'] },
    {
      id: 't2-l5',
      title: 'Searching & saying it',
      exerciseIds: ['t2-17', 't2-18', 't2-19', 't2-20'],
    },
    {
      id: 't2-l6',
      title: 'Putting it together',
      exerciseIds: ['t2-21', 't2-22', 't2-23', 't2-24'],
    },
    {
      id: 't2-l7',
      title: 'Lookups and membership',
      exerciseIds: ['t2-25', 't2-26', 't2-27', 't2-28', 't2-29'],
    },
    {
      id: 't2-l8',
      title: 'Windows and pointers again',
      exerciseIds: ['t2-30', 't2-31', 't2-32', 't2-33', 't2-34'],
    },
    {
      id: 't2-l9',
      title: 'Counting, greed and its limits',
      exerciseIds: ['t2-35', 't2-36', 't2-37', 't2-38', 't2-39'],
    },
    {
      id: 't2-l10',
      title: 'Searching, spreading, remembering',
      exerciseIds: ['t2-40', 't2-41', 't2-42', 't2-43', 't2-44'],
    },
  ],
};
