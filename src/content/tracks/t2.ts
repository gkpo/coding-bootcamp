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
  ],
};
