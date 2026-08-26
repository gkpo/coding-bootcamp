import type { Exercise, Track } from '../types';

/**
 * Track 6: Interview decoder & communication.
 *
 * Goal: the meta-game itself. Interviewer riddles map to canonical answers,
 * and there is a script for being stuck that beats going quiet.
 */

export const t6Exercises: Exercise[] = [
  {
    id: 't6-01',
    trackId: 't6',
    type: 'match',
    difficulty: 1,
    conceptId: 'decoder',
    prompt: 'Pair each interviewer phrase with the term they are waiting to hear.',
    pairs: [
      { left: 'A function that remembers', right: 'Closure' },
      { left: 'It grows linearly', right: 'O(n)' },
      { left: 'Instant lookup', right: 'Hash map' },
      { left: 'First in, first out', right: 'Queue' },
    ],
    explanation:
      'Interviewers frequently score the word, not the understanding. You can describe exactly how a counter keeps its value between calls and still lose the point by never saying "closure". Learn the mapping in both directions. Riddle to term, and term to plain words.',
  },
  {
    id: 't6-02',
    trackId: 't6',
    type: 'match',
    difficulty: 1,
    conceptId: 'decoder',
    prompt: 'Round two. Pair the phrase with the term.',
    pairs: [
      { left: 'Only computed once', right: 'Memoization' },
      { left: 'At most once per second', right: 'Throttle' },
      { left: "The browser's to-do list", right: 'Event loop' },
      { left: 'Copy it, do not touch the original', right: 'Immutability' },
    ],
    explanation:
      'Each of these is a concept you already use daily under a name you might not reach for under pressure. The gap being closed here is vocabulary, not knowledge, which is precisely why it is trainable in five-minute sessions.',
  },
  {
    id: 't6-03',
    trackId: 't6',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'decoder',
    prompt: 'The interviewer asks **"how does this scale?"**. What are they actually asking for?',
    options: [
      {
        text: 'The complexity in plain words, plus which line is the bottleneck',
        correct: true,
      },
      {
        text: 'Whether it would work with more servers',
        whyWrong:
          'That is what the phrase means in a system design round. Asked about a function you have just written, it is about how the work grows with the input.',
      },
      {
        text: 'Whether you have load tested it',
        whyWrong:
          'They are asking you to reason about the code in front of you, not to report measurements you could not have taken during the interview.',
      },
      {
        text: 'Whether the code is readable enough for a team to maintain',
        whyWrong:
          'That is "can you make this cleaner?", a different question with a different answer. Scaling is about cost as the input grows.',
      },
    ],
    explanation:
      'Asked about a function, "how does this scale?" means "what is the Big-O, and where is the cost?". The full-marks answer is two sentences: name the growth in plain words, then point at the specific line responsible. That second half is what most candidates leave out.',
  },
  {
    id: 't6-04',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'The interviewer asks **"can you make this cleaner?"**. Decode it.',
    options: [
      {
        text: 'Readability. Naming, nesting, functions doing too much. Not performance.',
        correct: true,
      },
      {
        text: 'Performance, they want it faster',
        whyWrong:
          'They would say "can you make this faster?" or "how does this scale?". Optimising when asked for clarity answers a question nobody asked.',
      },
      {
        text: 'They want fewer lines of code',
        whyWrong:
          'Shorter is not cleaner. Collapsing readable code into a dense one-liner usually makes it worse, and doing it on request suggests you conflate the two.',
      },
      {
        text: 'They have spotted a bug and are hinting at it',
        whyWrong:
          'A bug hint sounds like "what happens if the array is empty?". "Cleaner" is about how it reads, not whether it is right.',
      },
    ],
    explanation:
      '"Cleaner" is the readability question: name the magic numbers, flatten the nesting with guard clauses, split a function that does three things. Answering with a performance optimisation is a classic decode failure. You may do good work and still score zero for the question asked.',
  },
  {
    id: 't6-05',
    trackId: 't6',
    type: 'steps',
    difficulty: 1,
    conceptId: 'stuck-script',
    prompt: 'You are stuck and the silence is stretching. **Order the unstick script.**',
    steps: [
      'Say what you do know about the problem so far',
      'Restate what you are trying to produce',
      'Offer the brute-force approach out loud, even if it is slow',
      'Ask one specific question about the part you are unsure of',
    ],
    explanation:
      'Being stuck is normal; going silent is what actually loses interviews, because the interviewer cannot tell thinking from panic. Every step here gives them something to work with, and the specific question turns an examiner into a collaborator, which is exactly the dynamic you want.',
  },
  {
    id: 't6-06',
    trackId: 't6',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'stuck-script',
    prompt: 'You want to start with the brute force. **Which phrasing lands best?**',
    options: [
      {
        text: '"I\'ll start simple so we have something working, then optimise from there."',
        correct: true,
      },
      {
        text: '"I can only think of the slow way right now."',
        whyWrong:
          'Same plan, framed as a failure. You have volunteered a weakness that was not there. The brute force is a legitimate first step, not an admission.',
      },
      {
        text: '"This is probably not what you\'re looking for, but…"',
        whyWrong:
          'Pre-apologising invites doubt. If it turns out to be right you have already undercut it; if it is wrong you have added nothing.',
      },
      {
        text: '"Should I do the brute force or the optimal one?"',
        whyWrong:
          'Hands a decision back that you should make. Interviewers want to see you choose a path and explain it, not seek permission.',
      },
    ],
    explanation:
      'Same approach, completely different signal. "Start simple, then optimise" is how experienced engineers actually work, and stating it as a plan reads as method. It also buys you a working solution on the board early, which takes the pressure off the rest of the interview.',
  },
  {
    id: 't6-07',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'hints',
    prompt:
      'Mid-problem, the interviewer says **"what if the array were sorted?"**. What is happening?',
    options: [
      {
        text: 'A hint. They are steering you toward binary search or two pointers, take it and say so.',
        correct: true,
      },
      {
        text: 'A trick question checking whether you assume sorted input',
        whyWrong:
          'Interviewers do sometimes test assumptions, but that comes as "what do you know about the input?". An unprompted extra condition is help, not a trap.',
      },
      {
        text: 'Small talk while you think',
        whyWrong:
          'They are not filling silence. A specific property of the data, offered unprompted, is always pointing somewhere.',
      },
      {
        text: 'They want you to write the sort first',
        whyWrong:
          'Backwards. Sorting costs O(n log n), which usually undoes the gain. They are telling you it is *already* sorted so you can exploit it.',
      },
    ],
    explanation:
      'Hints are gifts, and taking one is rewarded rather than penalised. Say it back: "if it is sorted, I can use two pointers and drop the nested loop". That shows you heard it, understood what it unlocks, and can act on feedback. All things they are explicitly assessing.',
  },
  {
    id: 't6-08',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'edge-cases',
    prompt: '**"Any edge cases?"** What is the canonical checklist answer?',
    options: [
      {
        text: 'Empty, one item, very large, duplicates, and negatives or unusual characters',
        correct: true,
      },
      {
        text: '"I think it handles everything."',
        whyWrong:
          'Closes down the conversation and shows no method. Even when true, it gives them nothing to score.',
      },
      {
        text: 'Null and undefined inputs',
        whyWrong:
          'A real case and worth naming, but on its own it is a fragment. They are looking for a systematic sweep, not one example.',
      },
      {
        text: '"I would write tests to find out."',
        whyWrong:
          'Right instinct in a codebase, evasive in an interview. They are asking you to reason about the awkward inputs now, out loud.',
      },
    ],
    explanation:
      'Having a memorised sweep (nothing, one, huge, repeats, weird) means you can answer this instantly and completely, which reads as experience. Run the list against the actual problem: for a chunker, "one word longer than the limit" falls straight out of "unusual input".',
  },
  {
    id: 't6-09',
    trackId: 't6',
    type: 'steps',
    difficulty: 2,
    conceptId: 'perf-script',
    prompt: 'They asked about complexity. **Order the four sentences of a full-marks answer.**',
    steps: [
      'Name it: "this is O(n²)"',
      'Say it in plain words: "for every item we scan the whole list again"',
      'Point at the bottleneck: "the cost is the includes inside the loop"',
      'Say the improvement: "a Set makes those lookups O(1), so the whole thing becomes O(n)"',
    ],
    explanation:
      'Most candidates deliver only the first sentence and stop. The plain-words line proves you understand rather than pattern-matched; the bottleneck line proves you can locate cost in real code; the improvement line proves you can act on it. Four short sentences, and it is trainable to the point of reflex.',
  },
  {
    id: 't6-10',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'stuck-script',
    prompt: 'Three minutes into an approach, it is not coming together. **What do you do?**',
    options: [
      {
        text: 'Say out loud that it is not working, and propose trying a different angle',
        correct: true,
      },
      {
        text: 'Push on. Switching now wastes the work already done',
        whyWrong:
          'This is the sunk cost trap, and it is how a single wrong idea consumes a whole interview. The minutes already spent are gone either way.',
      },
      {
        text: 'Quietly start over and hope they do not notice',
        whyWrong:
          'They always notice. Narrating the switch turns it into visible judgement; hiding it turns it into visible floundering.',
      },
      {
        text: 'Ask them whether your approach is right',
        whyWrong:
          'Close, but it hands them the decision. "This is not converging, I am going to try X" is stronger than "is this right?", and often prompts a hint anyway.',
      },
    ],
    explanation:
      'This is the single most valuable habit in the track. Abandoning an approach out loud costs you nothing and reads as self-awareness; silently sinking the interview into it costs you everything. Give an idea about three minutes to show progress, then say "this is not working, let me try another angle" and move.',
  },
  {
    id: 't6-11',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Round three, the full stack phrases.',
    pairs: [
      { left: 'Single source of truth', right: 'State management' },
      { left: 'Do not block the main thread', right: 'Async or worker' },
      { left: 'The contract between front and back', right: 'API schema' },
      { left: 'It still works offline', right: 'Cache or PWA' },
    ],
    explanation:
      'These come up in full stack rounds constantly, usually as an aside rather than a question. Recognising the phrase lets you answer the real question behind it: "does it work offline?" is asking about caching strategy, not about whether you have tried aeroplane mode.',
  },
  {
    id: 't6-12',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'whiteboard-script',
    prompt: '**"Walk me through your thinking."** Which transcript sounds like a strong candidate?',
    options: [
      {
        text: '"It is asking for the longest stretch with no repeats. Brute force is every substring, so O(n²). Stretch suggests a sliding window. Let me try growing right and shrinking left."',
        correct: true,
      },
      {
        text: '"I would use a sliding window with a Set, tracking start and end, updating the max as I go."',
        whyWrong:
          'Correct and efficient, but it is the destination with no journey. They asked for the thinking, and a jump straight to the answer looks memorised rather than derived.',
      },
      {
        text: '"Let me code it up and then explain what I did."',
        whyWrong:
          'This defers exactly what they asked for. Silent coding followed by a summary is the pattern the question exists to interrupt.',
      },
      {
        text: '"I have seen this one before. It is the classic sliding window problem."',
        whyWrong:
          'Honest, and fine as an aside. But on its own it answers "do you recognise this?" rather than "how do you think?", and it invites a harder variant.',
      },
    ],
    explanation:
      'Good thinking-out-loud has a visible shape: restate, name the naive approach with its cost, identify the clue in the wording, then propose the pattern. It shows you can derive an approach rather than recall one, which matters, because the next problem will be one you have not seen.',
  },
];

export const t6: Track = {
  id: 't6',
  title: 'Interview decoder',
  emoji: '🗣️',
  tagline: 'The riddles, and what to say when you are stuck.',
  lessons: [
    { id: 't6-l1', title: 'The phrasebook', exerciseIds: ['t6-01', 't6-02', 't6-11'] },
    { id: 't6-l2', title: 'What they mean', exerciseIds: ['t6-03', 't6-04', 't6-08'] },
    { id: 't6-l3', title: 'When you are stuck', exerciseIds: ['t6-05', 't6-06', 't6-07'] },
    { id: 't6-l4', title: 'Thinking out loud', exerciseIds: ['t6-09', 't6-10', 't6-12'] },
  ],
};
