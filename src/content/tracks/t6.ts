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
      {
        left: 'It keeps access to its variables after the outer function is gone',
        right: 'Closure',
        why: 'The inner function holds on to the scope it was created in, so those variables outlive the call that made them.',
      },
      {
        left: 'Double the input, double the time',
        right: 'O(n)',
        why: 'One pass over every item makes the cost track the count in a straight line, with no extra work per item.',
      },
      {
        left: 'You pay memory to make lookups instant',
        right: 'Hash map',
        why: 'Keys are stored in a table built for fast access, which buys a one-step lookup at the cost of holding that table in memory.',
      },
      {
        left: 'Handled in the order they arrived',
        right: 'Queue',
        why: 'Items leave from the front while new ones join the back, so nothing overtakes and the oldest waiting item goes first.',
      },
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
    prompt: 'Everyday habits under their formal names. Pair each phrase with the term.',
    pairs: [
      {
        left: 'The second call is free',
        right: 'Memoization',
        why: 'The result is stored under the arguments that produced it, so the same call hands back the saved answer instead of computing again.',
      },
      {
        left: 'Cap how often the handler is allowed to fire',
        right: 'Throttle',
        why: 'It lets the handler run at most once per time window and drops the rest, turning a flood of events into a steady trickle.',
      },
      {
        left: 'What runs first, and what waits its turn',
        right: 'Event loop',
        why: 'One thread runs the current code to the end, then picks up the next waiting callback, which is why nothing interrupts halfway.',
      },
      {
        left: 'Never change what you were handed',
        right: 'Immutability',
        why: 'Making a new value instead of editing the old one means nobody else holding that value is surprised by a change they did not make.',
      },
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
    prompt: 'Full stack phrases. Pair each one with the term.',
    pairs: [
      {
        left: 'One place that owns the value',
        right: 'State management',
        why: 'When one store owns the value and everything else reads from it, two copies cannot drift apart and start disagreeing.',
      },
      {
        left: 'Keep the long job off the main thread',
        right: 'Async or worker',
        why: 'The thread that draws the screen has to stay free, so slow work either waits on a callback or runs in a separate worker.',
      },
      {
        left: 'What shape does the response come back in',
        right: 'API schema',
        why: 'An agreed shape for the fields and their types lets both sides build against it, and makes a mismatch fail loudly instead of quietly.',
      },
      {
        left: 'It keeps working with no network',
        right: 'Cache or PWA',
        why: 'Storing the files and the last known data on the device lets the app render from that copy when the network is gone.',
      },
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
  {
    id: 't6-13',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'The usual patterns, in wordings you have not been shown. Pair each one up.',
    pairs: [
      {
        left: 'A stretch that grows on one side and shrinks on the other',
        right: 'Sliding window',
        why: 'One edge moves forward to take more in and the other moves up to drop what no longer fits, so each item is visited about once.',
      },
      {
        left: 'Walk in from both ends until they meet',
        right: 'Two pointers',
        why: 'Starting at both ends and moving inward, each step rules out one end, so the whole array is settled in a single pass.',
      },
      {
        left: 'A tally kept as you go',
        right: 'Frequency map',
        why: 'A count per item, updated as you walk, so every total is ready at the end without going back over anything.',
      },
      {
        left: 'Throw away half of what is left, every step',
        right: 'Binary search',
        why: 'Each look at the middle tells you which half cannot hold the answer, so what is left to search halves every step.',
      },
    ],
    explanation:
      'The pattern never changes; the sentence does. If you learned "longest stretch with no repeats" as the only way a window is described, a colleague saying "grows on one side, shrinks on the other" will not land. Recognising the shape from any description is the whole skill.',
  },
  {
    id: 't6-14',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Timing and async. Pair the phrase with the term.',
    pairs: [
      {
        left: 'Wait until they stop typing, then do it once',
        right: 'Debounce',
        why: 'Every new event restarts the timer, so the work runs once after the burst has stopped rather than once per keystroke.',
      },
      {
        left: 'It reads like normal code but pauses at each await',
        right: 'Async and await',
        why: 'The function hands the thread back at each await and resumes where it left off when the promise settles, so the page stays responsive.',
      },
      {
        left: 'Wait a bit longer after each failure',
        right: 'Backoff',
        why: 'Each retry waits longer than the last, which gives a struggling service time to recover instead of piling more load onto it.',
      },
      {
        left: 'Doing it twice changes nothing',
        right: 'Idempotency',
        why: 'The handler keys off something stable, like a request id, so a repeat call finds the work already done and changes nothing.',
      },
    ],
    explanation:
      'These four come up in almost every full stack round, usually as an aside rather than a question. The one people miss is idempotency: interviewers rarely say the word, they say "what if the user taps pay twice?", and the word is what they are scoring.',
  },
  {
    id: 't6-15',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Frontend phrases. Pair each one with what they are asking about.',
    pairs: [
      {
        left: 'It drew again when nothing it shows had changed',
        right: 'Unnecessary re-render',
        why: 'A parent redrew, or a prop arrived as a fresh object, so the child ran again even though the data it shows was identical.',
      },
      {
        left: 'The list got reordered and the wrong row kept its text',
        right: 'Missing keys',
        why: 'With no stable key per row, the framework matches old rows to new ones by position, so state sticks to the slot instead of the item.',
      },
      {
        left: 'Tear it down when the component goes away',
        right: 'Effect cleanup',
        why: 'The timer or subscription an effect started keeps running unless the effect returns a function that stops it when the component goes.',
      },
      {
        left: 'Two components need the same value',
        right: 'Lifting state up',
        why: 'Moving the value to the nearest common parent gives both children one source to read from, instead of two copies to keep in step.',
      },
    ],
    explanation:
      'Frontend interviewers describe symptoms rather than naming causes, because naming the cause is your job. Each phrase here is a bug report; the term is the diagnosis, and saying the diagnosis before the fix is what separates a strong answer from a lucky one.',
  },
  {
    id: 't6-16',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Data phrases. Pair each one with the term.',
    pairs: [
      {
        left: 'It got slower as the table grew',
        right: 'Missing index',
        why: 'With no index the database reads every row to find the matching ones, so the cost climbs as the table grows.',
      },
      {
        left: 'Half the update landed and half did not',
        right: 'No transaction',
        why: 'Writes sent one at a time can be interrupted between them; grouped in a transaction they either all land or none do.',
      },
      {
        left: 'The page loads 200 rows and fires 201 queries',
        right: 'N+1',
        why: 'One query fetches the list and then a query per row fetches its detail, where a single join or one batched query would do.',
      },
      {
        left: 'Do not send the whole table down the wire',
        right: 'Pagination',
        why: 'Asking for a page at a time keeps the response small and predictable, however large the table behind it grows.',
      },
    ],
    explanation:
      'Backend rounds lean on symptoms too, and these four cover most of what goes wrong with a database in practice. Notice that each phrase describes something a user or a graph would notice, which is usually how you will first hear about it in a real job as well.',
  },
  {
    id: 't6-17',
    trackId: 't6',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Code quality phrases. Pair each one with what they want.',
    pairs: [
      {
        left: 'Handle the odd cases first and get out',
        right: 'Guard clause',
        why: 'Returning early on the empty and invalid cases leaves the rest of the function dealing with one situation, at one level of indentation.',
      },
      {
        left: 'This function is doing three jobs',
        right: 'Single responsibility',
        why: 'A function with one reason to change can be named, tested and reused; three jobs in one means every change risks the other two.',
      },
      {
        left: 'Same answer every time, nothing else touched',
        right: 'Pure function',
        why: 'It depends only on its arguments and writes to nothing outside itself, which is what makes it safe to call anywhere and easy to test.',
      },
      {
        left: 'What does this variable actually hold?',
        right: 'Better naming',
        why: 'A name that says what the value holds removes the need to read the code above it to find out.',
      },
    ],
    explanation:
      'Review-style questions almost never use the formal term, so the term is the part being tested. "This function is doing three jobs" is an invitation to say "single responsibility" and then split it, in that order. The word first, the change second.',
  },
  {
    id: 't6-18',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'decoder',
    prompt:
      'The interviewer says **"if I gave you a sorted copy of this list, would that help?"**. Decode it.',
    promptVariants: [
      'The interviewer says **"suppose the input arrived already sorted, does anything change?"**. Decode it.',
    ],
    options: [
      {
        text: 'A hint that a sorted input unlocks binary search or two pointers, and an invitation to say which',
        correct: true,
      },
      {
        text: 'A request to add a sort at the top of your function',
        whyWrong:
          'They said "if I gave you", which means the sort is free. Adding one yourself costs O(n log n) and answers a different question from the one asked.',
      },
      {
        text: 'A hint that your current answer is wrong',
        whyWrong:
          'Hints about correctness sound like "walk me through it with an empty list". This one is about cost, and it usually means your answer is right but improvable.',
      },
      {
        text: 'Small talk while they read your code',
        whyWrong:
          'Interviewers rarely ask hypotheticals for no reason, and a question about the *shape of the input* is nearly always steering you toward a specific technique.',
      },
    ],
    explanation:
      'This is one of the most common hints in the whole interview, and most candidates answer it with a shrug. The full answer names both options: sorted data makes lookups O(log n) with binary search, and it makes pair-finding O(n) with two pointers from both ends. Then say which one fits this problem and why.',
  },
  {
    id: 't6-19',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'decoder',
    prompt:
      'The interviewer says **"what happens if this runs on a hundred million rows?"**. What are they asking?',
    promptVariants: [
      'The interviewer says **"now imagine the input is a hundred times bigger"**. Decode it.',
    ],
    options: [
      {
        text: 'Which line breaks first at scale, and whether memory or time gives out',
        correct: true,
      },
      {
        text: 'Whether you would add more servers',
        whyWrong:
          'That is the answer in a system design round. Asked about the function in front of you, they want the bottleneck inside it, not the infrastructure around it.',
      },
      {
        text: 'A request to rewrite it in a faster language',
        whyWrong:
          'A faster language changes the constant, not the shape. Something quadratic stays quadratic, so this answers a question about seconds rather than about growth.',
      },
      {
        text: 'Whether the code has been load tested',
        whyWrong:
          'They are asking you to reason from the code, which you can do right now. Reporting measurements you could not have taken sidesteps the question.',
      },
    ],
    explanation:
      'This is "how does this scale?" with a number attached, and the number is a hint about which resource runs out first. The strong answer has two halves: the growth in plain words, and the specific thing that breaks, usually a copy of the whole input held in memory or a nested loop. Naming a concrete first fix afterwards is what finishes it.',
  },
  {
    id: 't6-20',
    trackId: 't6',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'decoder',
    prompt:
      'The interviewer says **"is there anything you would want to check before shipping this?"**. Decode it.',
    promptVariants: [
      'The interviewer says **"would you be happy to put this in front of users tomorrow?"**. Decode it.',
    ],
    options: [
      {
        text: 'Edge cases and tests: empty input, duplicates, sizes at the boundary, and what you would assert',
        correct: true,
      },
      {
        text: 'A hint that there is a bug on a specific line',
        whyWrong:
          'A pointed hint names the area: "what happens with an empty list?". This one is open, which means they are testing whether you volunteer the checks unprompted.',
      },
      {
        text: 'A question about your deployment process',
        whyWrong:
          'In a coding round the subject is the code in front of you. Talking about pipelines here reads as avoiding the question rather than answering it.',
      },
      {
        text: 'They are wrapping up and being polite',
        whyWrong:
          'It is a scored question, and "no, I think it is fine" is a weak answer to it. Even solid code has inputs worth naming out loud.',
      },
    ],
    explanation:
      'The wrong move is "no, I think it is fine". Reach for the standard list every time: empty input, one item, duplicates, the largest realistic size, and anything the type system does not stop. Then name one test you would write first. Volunteering these before being asked is what makes you look like someone who has shipped things.',
  },
];

export const t6: Track = {
  id: 't6',
  title: 'Interview decoder',
  icon: 'speech',
  tagline: 'The riddles, and what to say when you are stuck.',
  lessons: [
    { id: 't6-l1', title: 'The phrasebook', exerciseIds: ['t6-01', 't6-02', 't6-11'] },
    { id: 't6-l2', title: 'What they mean', exerciseIds: ['t6-03', 't6-04', 't6-08'] },
    { id: 't6-l3', title: 'When you are stuck', exerciseIds: ['t6-05', 't6-06', 't6-07'] },
    { id: 't6-l4', title: 'Thinking out loud', exerciseIds: ['t6-09', 't6-10', 't6-12'] },
    {
      id: 't6-l5',
      title: 'The phrasebook, second pass',
      exerciseIds: ['t6-13', 't6-14', 't6-15', 't6-16'],
    },
    {
      id: 't6-l6',
      title: 'Longer questions, decoded',
      exerciseIds: ['t6-17', 't6-18', 't6-19', 't6-20'],
    },
  ],
};
