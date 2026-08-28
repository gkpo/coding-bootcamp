import type { Exercise, Track } from '../types';

/**
 * Track 7: React and the frontend.
 *
 * Goal: the React round as a React shop runs it. Explain what causes a render,
 * why lists need identity, when effects run and what they must undo, and spot
 * the stale closure on sight.
 */

export const t7Exercises: Exercise[] = [
  {
    id: 't7-01',
    trackId: 't7',
    type: 'mcq',
    difficulty: 1,
    conceptId: 're-render',
    prompt: 'Which of these makes React draw the component again?',
    options: [
      { text: 'Calling a state setter with a new value', correct: true },
      {
        text: 'Changing a plain variable declared inside the component',
        whyWrong:
          'React never watches ordinary variables. The value really does change, but nothing tells React to run the component again, so the screen keeps showing the old one.',
      },
      {
        text: 'Editing the object a prop points at, without replacing it',
        whyWrong:
          'For the child to render again the parent has to render and hand down a new value. Reaching into the existing object changes the data and sends React no signal.',
      },
      {
        text: 'Reading state during the render',
        whyWrong:
          'Reading is free, and it already happens on every render. It is writing, through the setter, that schedules the next one.',
      },
    ],
    explanation:
      'Two things start a render: a state setter that lands on a new value, and a parent rendering again. Everything else, including any amount of assigning to ordinary variables, leaves React unaware. This is why the fix for "the UI does not update" is almost always to route the change through state.',
  },
  {
    id: 't7-02',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 're-render',
    prompt: 'The list on screen never grows, though `items` really does get longer. **Why?**',
    code: {
      lang: 'js',
      source: `function add(item) {
  items.push(item);
  setItems(items);
}`,
    },
    options: [
      {
        text: 'React compares the new state with the old, sees the same array, and skips the render',
        correct: true,
      },
      {
        text: 'The push happened before the setter, so React was handed a stale value',
        whyWrong:
          'Order is not the problem. The array is already longer by the time the setter runs. The trouble is that it is the same array it was before.',
      },
      {
        text: 'State updates are asynchronous, so the new item shows up one render late',
        whyWrong:
          'Updates are batched, which is real, but a batched update still lands eventually. Here no update lands at all, on this render or any later one.',
      },
      {
        text: '`push` returns the new length rather than the array',
        whyWrong:
          'True of `push`, and beside the point here, because the return value is thrown away. What matters is which array the setter received.',
      },
    ],
    explanation:
      '`push` changes the contents and hands back the very same array, so React compares it with the old state, finds them identical, and schedules nothing. `setItems([...items, item])` builds a new array, the comparison fails, and the screen updates. Replace state, never edit it.',
  },
  {
    id: 't7-03',
    trackId: 't7',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 're-render',
    prompt: 'Tapping "sort by date" reorders nothing on screen. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `function sortByDate() {
  const sorted = posts.sort(byDate);
  setPosts(sorted);
}`,
    },
    buggyLineIndex: 1,
    lineHints: {
      0: 'The function itself is fine. Nothing is decided yet.',
      2: 'Handing the result to the setter is the right shape. The problem is what `sorted` actually is.',
      3: 'A closing brace cannot be the bug.',
    },
    explanation:
      '`sort` rearranges the array it was given and returns that same array, so `sorted` and `posts` are one object under two names. React compares the new state with the old, sees no change, and skips the render. `[...posts].sort(...)` sorts a copy, which is genuinely new, and the screen updates.',
  },
  {
    id: 't7-04',
    trackId: 't7',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'keys',
    prompt: 'React asks for a `key` on every item in a list. **What does it use the key for?**',
    options: [
      {
        text: 'To tell which item is which across renders, so it can move an item rather than rebuild it',
        correct: true,
      },
      {
        text: 'To keep the list in the right order as it renders',
        whyWrong:
          'Order comes from the array itself. React renders items in the order you hand them over, key or no key.',
      },
      {
        text: 'To make lookups faster, the way a database index does',
        whyWrong:
          'A fair guess from the word, but keys are about identity, not speed. React is matching old items to new ones, not searching for anything.',
      },
      {
        text: 'To give each item a unique id in the HTML that reaches the page',
        whyWrong:
          'Keys never reach the DOM. They exist only inside React, for the comparison between one render and the next.',
      },
    ],
    explanation:
      'Between two renders React holds an old list and a new one, and has to work out which item is which. The key is your answer to that question. With no key it falls back to position and assumes the third item is still the third item, which is fine right up until the list reorders.',
  },
  {
    id: 't7-05',
    trackId: 't7',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'keys',
    prompt:
      'Each row holds a text box. Move a row up and the typed text stays behind on the old row. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `{items.map((item, i) => (
  <Row
    key={i}
    label={item.label}
    onMoveUp={() => move(i, i - 1)}
  />
))}`,
    },
    buggyLineIndex: 2,
    lineHints: {
      0: 'Mapping over the list and taking the index is fine. The index is a useful thing to have here.',
      3: 'Passing the label through is fine. It follows the item wherever the item goes.',
      4: 'Using the index to work out the move is correct: moving really is about position.',
    },
    explanation:
      'The index says where an item sits, not which item it is. Move the third row up and React sees that key 1 is still key 1, so it leaves that DOM node, and whatever the user typed into it, exactly where it was. `key={item.id}` follows the item instead, so the box travels with its row.',
  },
  {
    id: 't7-06',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'use-effect',
    prompt: 'This effect has no dependency array at all. **When does it run?**',
    code: {
      lang: 'js',
      source: `useEffect(() => {
  document.title = 'Inbox (' + count + ')';
});`,
    },
    options: [
      { text: 'After every render, including ones where `count` did not change', correct: true },
      {
        text: 'Once, after the first render',
        whyWrong:
          'That is what `[]` gives you. Leaving the array out entirely is the opposite: it opts in to every render there is.',
      },
      {
        text: 'Only when `count` changes',
        whyWrong:
          'That needs `[count]`. React cannot work out the dependency by reading the body of the effect, so you have to list it.',
      },
      {
        text: 'Before each render, so the title is ready when the screen paints',
        whyWrong:
          'Effects always run after the render is on screen. That is the whole point of them: they hold the work that should not block painting.',
      },
    ],
    explanation:
      'Three shapes, worth knowing cold. No array means after every render. `[]` means once, after the first. `[count]` means after any render where `count` changed. Leaving the array off is rarely what anyone wants, and it is the usual cause of an effect firing far more often than expected.',
  },
  {
    id: 't7-07',
    trackId: 't7',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'use-effect',
    prompt:
      'Leave this screen and come back a few times, and the counter starts jumping by two, then three. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `useEffect(() => {
  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);
}, []);`,
    },
    buggyLineIndex: 1,
    lineHints: {
      0: 'Running this once on mount is the right idea for a timer.',
      2: 'The functional update is correct, and it is what keeps this counter off a stale value.',
      3: 'A one second interval is exactly what was asked for.',
      4: 'The empty array is the right choice here. The timer should start once.',
    },
    explanation:
      'The effect starts an interval and never gives React a way to stop it, so leaving the screen unmounts the component while the timer runs on. Come back and a second one starts alongside the first. Returning `() => clearInterval(id)` fixes it: React calls that function on unmount, and before every re-run.',
  },
  {
    id: 't7-08',
    trackId: 't7',
    type: 'blank',
    difficulty: 2,
    conceptId: 'use-effect',
    prompt: 'Fill in the effect that joins a chat room and leaves it again.',
    template: `useEffect(() => {
  const socket = connect(roomId);
  socket.on('message', onMessage);
  ____ () => socket.close();
}, [____, onMessage]);`,
    gaps: ['return', 'roomId'],
    bank: ['return', 'roomId', 'await', 'socket', 'connect', 'onMessage'],
    explanation:
      'The function you return is the cleanup, and React runs it twice over: before re-running the effect, and once more on unmount. Every value the effect reads from outside belongs in the array, so switching room closes the old socket before opening the new one. Leave `roomId` out and you stay in the first room forever.',
  },
  {
    id: 't7-09',
    trackId: 't7',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'stale-closure',
    prompt: 'This is meant to count up once a second. **What actually happens?**',
    code: {
      lang: 'js',
      source: `const [count, setCount] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
    },
    options: [
      { text: 'It reaches 1 and stops there', correct: true },
      {
        text: 'It counts up normally, one per second',
        whyWrong:
          'That is what the code reads like, which is exactly why this bug is so common. The interval was built during the first render, so `count` inside it is 0 on every single tick.',
      },
      {
        text: 'It counts up but skips numbers when the page is busy',
        whyWrong:
          'Timers really do drift under load, but that is not this. Here every tick sets the state to the same number.',
      },
      {
        text: 'It throws once the component unmounts',
        whyWrong:
          'The cleanup clears the interval, so nothing runs after unmount. The bug is visible long before that, on the second tick.',
      },
    ],
    explanation:
      'Every tick runs the same function, the one built during the first render, and inside that function `count` is 0. So every tick calls `setCount(0 + 1)`. React sets the state to 1, then sees 1 again a second later and has nothing to do. The effect never re-ran, so it never saw a newer `count`.',
  },
  {
    id: 't7-10',
    trackId: 't7',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'stale-closure',
    prompt:
      'This counter is meant to tick up once a second. **Which fix works without restarting the timer?**',
    code: {
      lang: 'js',
      source: `const [count, setCount] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
    },
    options: [
      {
        text: 'Call `setCount((c) => c + 1)` instead',
        correct: true,
      },
      {
        text: 'Add `count` to the dependency array',
        whyWrong:
          'The counting does start working, so this is a real fix, just not the one asked for: the effect tears down and rebuilds the interval every time the count changes, so the timer restarts a second at a time and never runs one out.',
      },
      {
        text: 'Keep the count in a ref and read `ref.current` inside the tick',
        whyWrong:
          'That reads the live value, but writing to a ref never triggers a render, so the number on screen would sit still. Refs are for values the screen does not show.',
      },
      {
        text: 'Drop the dependency array so the effect runs after every render',
        whyWrong:
          'Same cost as adding `count`, and worse: now any render at all restarts the interval, not just the ones where the count changed.',
      },
    ],
    explanation:
      'The functional form is the right tool whenever the next state is worked out from the current one. It hands React a recipe rather than a value, so nothing needs capturing and the effect can stay on `[]`, which is what leaves the timer alone. Say it that way out loud: "I do not want to capture the count, I want to ask for the latest one".',
  },
  {
    id: 't7-11',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'controlled',
    prompt: 'An interviewer calls the search box **"a controlled input"**. What do they mean?',
    options: [
      {
        text: 'React state holds the value, and the input shows whatever state says',
        correct: true,
      },
      {
        text: 'The input checks what the user types before accepting it',
        whyWrong:
          'Validation is something you might do in a controlled input, but the word is about where the value lives, not about rules.',
      },
      {
        text: 'The input is disabled until some other condition is met',
        whyWrong:
          'That is `disabled`. Controlled describes the ordinary editable case, where React owns the value.',
      },
      {
        text: 'The browser keeps the value and React reads it when it needs to',
        whyWrong:
          'That is the uncontrolled input, usually read through a ref. It is the other half of the pair.',
      },
    ],
    explanation:
      'Controlled means the value on screen comes from state: `value={query}` plus an `onChange` that sets it. Uncontrolled means the DOM node keeps the value and you go and fetch it, normally through a ref, when the form is submitted. Controlled is the default because anything else in the app can then read or change the field.',
  },
  {
    id: 't7-12',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'memo-hooks',
    prompt: 'Where does `useMemo` actually earn its place?',
    options: [
      {
        text: 'Around genuinely expensive work, or to keep a value stable for something downstream that compares it',
        correct: true,
      },
      {
        text: 'Around any value computed during render, as cheap insurance',
        whyWrong:
          'This is the common trap. Every `useMemo` costs a comparison and some memory on every render, so wrapping cheap work makes the component slower rather than faster.',
      },
      {
        text: 'Around anything that would otherwise be rebuilt, since making new objects is expensive',
        whyWrong:
          'Making an object is close to free. What can cost you is what a new object causes: a child that compares props and renders again because the reference changed.',
      },
      {
        text: 'Around values that arrive as props, to stop the parent re-rendering them',
        whyWrong:
          'Nothing a child does can stop a parent rendering. The flow only runs the other way.',
      },
    ],
    explanation:
      'Two honest reasons to reach for it: the work is heavy enough to feel, or something downstream compares by reference and a fresh object every render defeats it. Sorting ten thousand rows qualifies. Adding two numbers does not. "I would profile it first" is the answer interviewers are listening for.',
  },
  {
    id: 't7-13',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'memo-hooks',
    prompt: '`Row` is wrapped in `memo`, and still renders every time the parent does. **Why?**',
    code: {
      lang: 'js',
      source: `const Row = memo(function Row({ label, onPick }) {
  return <li onClick={onPick}>{label}</li>;
});

function List({ items }) {
  return items.map((item) => (
    <Row
      key={item.id}
      label={item.label}
      onPick={() => pick(item.id)}
    />
  ));
}`,
    },
    options: [
      {
        text: 'A fresh arrow function is built on every render, so `onPick` is a different value each time',
        correct: true,
      },
      {
        text: '`memo` only compares the first prop',
        whyWrong:
          'It compares all of them, one level deep. The trouble is that one of them genuinely is new every time.',
      },
      {
        text: '`memo` does not work on components declared with `function`',
        whyWrong:
          'It works on any component. How the component is declared has nothing to do with the comparison.',
      },
      {
        text: 'The `label` string is rebuilt too, so both props are new',
        whyWrong:
          'Strings compare by value, so an identical label is an identical prop. It is the function whose identity changes.',
      },
    ],
    explanation:
      '`memo` compares each prop with `===`. Two arrow functions written the same way are still two different objects, so the check fails on `onPick` and the memo buys nothing. Wrapping the handler in `useCallback` with the right dependencies gives it a stable identity, and only then does the memo start paying for itself.',
  },
  {
    id: 't7-14',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'lifting-context',
    prompt:
      'A filter box and a results list are siblings, and both need the filter text. **Now what?**',
    options: [
      {
        text: 'Move the filter into their closest shared parent and pass it to both',
        correct: true,
      },
      {
        text: 'Put it in context, so neither parent has to know about it',
        whyWrong:
          'Context is for data a whole subtree needs, like the signed-in user or the theme. Two siblings under one parent is one prop each, and context here hides where the value actually lives.',
      },
      {
        text: 'Keep a copy in each component and keep the two in sync with an effect',
        whyWrong:
          'Two sources of truth that have to be kept equal is the bug you will be fixing next week. One value, one owner.',
      },
      {
        text: 'Store it outside React in a module variable both can import',
        whyWrong:
          'Nothing would render when it changed. React only knows about the values it holds itself.',
      },
    ],
    explanation:
      'Lifting state is the default move: find the closest component that contains both, put the value there, pass it down. Reach for context when passing it down means threading it through several components that do not care about it, roughly four levels or more. This question is asked to see whether you grab the big tool first.',
  },
  {
    id: 't7-15',
    trackId: 't7',
    type: 'ladder',
    difficulty: 2,
    conceptId: 'single-responsibility',
    prompt: 'This component fetches, formats and renders. **What would you change first?**',
    code: {
      lang: 'js',
      source: `function UserCard({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/users/' + id)
      .then((r) => r.json())
      .then(setUser);
  }, [id]);
  if (!user) return <Spinner />;
  const year = new Date(user.since).getFullYear();
  return <p>{user.name} joined {year}</p>;
}`,
    },
    options: [
      {
        text: 'Pull the loading into a `useUser(id)` hook, leaving the component to render',
        correct: true,
      },
      {
        text: 'Move the date formatting into a helper function',
        whyWrong:
          'Worth doing, and a much smaller win. One line of formatting is not what makes this component hard to reuse or test. The data loading is.',
      },
      {
        text: 'Split the markup into a smaller presentational component',
        whyWrong:
          'There is barely any markup to split, and doing it leaves both halves still tangled up with the fetch.',
      },
      {
        text: 'Add error handling to the fetch',
        whyWrong:
          'A real gap, and fair to mention. But they asked about structure, and error handling makes this component do one more thing rather than one less.',
      },
    ],
    explanation:
      'The reusable, testable part is the loading, and a custom hook is how React lets you lift it out. `const user = useUser(id)` leaves the component doing exactly one job, and anything else that needs a user can call the same hook. Name the move out loud: "I would extract the data loading into a hook".',
  },
  {
    id: 't7-16',
    trackId: 't7',
    type: 'match',
    difficulty: 2,
    conceptId: 'memo-hooks',
    prompt: 'Pair each riddle with the tool it describes.',
    pairs: [
      { left: 'Remembers without re-rendering', right: 'useRef' },
      { left: 'Runs after the render is on screen', right: 'useEffect' },
      { left: 'Skips the child if the props are unchanged', right: 'memo' },
      { left: 'Keeps the same function between renders', right: 'useCallback' },
    ],
    explanation:
      'These four get mixed up constantly, usually `useRef` with state and `useMemo` with `useCallback`. The split that sticks: `useRef` and `useMemo` hold a value, `useCallback` holds a function, `memo` wraps a component. Say the riddle back with the tool name attached and the question is answered.',
  },
  {
    id: 't7-17',
    trackId: 't7',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'stale-closure',
    prompt:
      'The search box works, but the results are always one keystroke behind. What does this log?',
    code: {
      lang: 'js',
      source: `const [query, setQuery] = useState('');
const search = useCallback(() => {
  console.log(query);
}, []);
// user types "ab", then taps Search`,
    },
    options: [
      { text: 'An empty string', correct: true },
      {
        text: '"ab", the current value',
        whyWrong:
          'That is what you would get with no dependency array at all, because the callback would be rebuilt on every render and always hold the latest `query`.',
      },
      {
        text: '"a", the previous value',
        whyWrong:
          'There is nothing here that remembers the previous value. The frozen callback holds whatever `query` was on the render that created it, which was the first one.',
      },
      {
        text: 'undefined',
        whyWrong:
          '`useState` was given an initial value, so `query` is never undefined. It is an empty string on the first render and that is what got captured.',
      },
    ],
    explanation:
      'An empty dependency array tells React to keep the function from the first render forever, and that function closed over the `query` from that render. This is the stale closure again, wearing a different costume from the interval version. Either list `query` as a dependency, or read the value from a ref.',
  },
  {
    id: 't7-18',
    trackId: 't7',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'use-effect',
    prompt:
      'Switch between two chat rooms a few times and messages from old rooms start arriving. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `useEffect(() => {
  const socket = connect(roomId);
  socket.on('message', addMessage);
  return () => socket.off('message', addMessage);
}, [roomId]);`,
    },
    buggyLineIndex: 3,
    lineHints: {
      0: 'Re-running when the room changes is exactly right.',
      1: 'Opening a connection for the current room is the job of this effect.',
      2: 'Subscribing to messages is the point of the effect, not the bug.',
      4: 'Listing `roomId` is correct: a new room genuinely needs a new connection.',
    },
    explanation:
      'The cleanup removes the message listener but never closes the socket, so every room switch leaves another live connection behind. They all keep receiving. Cleanup has to undo everything the effect set up, in this case `socket.off(...)` and `socket.close()`. An effect that opens something owns closing it.',
  },
  {
    id: 't7-19',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 're-render',
    prompt: 'The child is wrapped in `memo` and still re-renders every time. Why?',
    code: {
      lang: 'js',
      source: `function Parent() {
  const [count, setCount] = useState(0);
  return <Child options={{ compact: true }} />;
}`,
    },
    options: [
      {
        text: 'The object literal is a new object on every render, so the props are never equal',
        correct: true,
      },
      {
        text: '`memo` does not work on components that take object props',
        whyWrong:
          '`memo` compares any props it is given. The problem is not the type of the prop, it is that a fresh object is created each render and compares unequal.',
      },
      {
        text: 'The parent re-renders, so the child must too',
        whyWrong:
          'That is the default and it is exactly what `memo` exists to stop. A memoized child skips re-rendering when its props are unchanged, whatever the parent does.',
      },
      {
        text: '`compact: true` never changes, so React re-renders to be safe',
        whyWrong:
          'React does not inspect the contents. It compares the prop values, and two objects holding identical contents are still two different objects.',
      },
    ],
    explanation:
      '`memo` compares props with the same equality rule as `===`, and `{ compact: true } === { compact: true }` is false: same contents, different objects. Hoist the object out of the component, or wrap it in `useMemo`, and the comparison starts passing. This is the single most common reason `memo` appears to do nothing.',
  },
  {
    id: 't7-20',
    trackId: 't7',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'controlled',
    prompt: 'The input renders, but typing in it does nothing. What is wrong?',
    code: {
      lang: 'js',
      source: `const [name, setName] = useState('');
return <input value={name} />;`,
    },
    options: [
      {
        text: 'It is controlled with no `onChange`, so React puts `name` back after every keystroke',
        correct: true,
      },
      {
        text: 'The initial state should be `undefined` rather than an empty string',
        whyWrong:
          'That would make it uncontrolled and typing would work, but only by accident. React also warns when an input switches from uncontrolled to controlled later.',
      },
      {
        text: '`useState` needs to be called with a function',
        whyWrong:
          'A function initialiser only matters when computing the initial value is expensive. An empty string is fine and is not what stops the typing.',
      },
      {
        text: 'The input needs a `name` attribute to accept input',
        whyWrong:
          'The `name` attribute is for form submission and labelling. A plain input with no `name` accepts typing perfectly well.',
      },
    ],
    explanation:
      'Passing `value` makes the input controlled: React now insists the displayed value matches the state. Without an `onChange` to update that state, every keystroke is immediately overwritten by the old value. Add `onChange={(e) => setName(e.target.value)}`, or use `defaultValue` if you actually wanted an uncontrolled input.',
  },
];

export const t7: Track = {
  id: 't7',
  title: 'React and the frontend',
  icon: 'component',
  tagline: 'Renders, keys, effects, and the stale closure.',
  lessons: [
    {
      id: 't7-l1',
      title: 'Why it renders again',
      exerciseIds: ['t7-01', 't7-02', 't7-03', 't7-04', 't7-05'],
    },
    { id: 't7-l2', title: 'Effects and cleanup', exerciseIds: ['t7-06', 't7-07', 't7-08'] },
    {
      id: 't7-l3',
      title: 'Stale closures and memo',
      exerciseIds: ['t7-09', 't7-10', 't7-12', 't7-13', 't7-16'],
    },
    { id: 't7-l4', title: 'Where state lives', exerciseIds: ['t7-11', 't7-14', 't7-15'] },
    {
      id: 't7-l5',
      title: 'Second look at effects and renders',
      exerciseIds: ['t7-17', 't7-18', 't7-19', 't7-20'],
    },
  ],
};
