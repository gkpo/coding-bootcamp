import type { Exercise, Track } from '../types';

/**
 * Track 5: System design foundations.
 *
 * Goal: the full stack design round at senior-generalist depth, the standard
 * vocabulary and the walkthrough script, not distributed-systems research.
 */

export const t5Exercises: Exercise[] = [
  {
    id: 't5-01',
    trackId: 't5',
    type: 'steps',
    difficulty: 1,
    conceptId: 'design-script',
    prompt: '**"Design me a URL shortener."** Put the first ten minutes in order.',
    steps: [
      'Clarify the requirements and what is explicitly out of scope',
      'Estimate the scale. Reads per second, writes per second, storage',
      'Sketch the high-level boxes and how a request flows through them',
      'Go deep on the one component that matters most here',
      'Talk through the trade-offs you made and what you would change at 10x',
    ],
    explanation:
      'Design rounds test structure as much as knowledge. Clarifying stops you designing the wrong system; the scale estimate is what justifies every later decision; the sketch gives you something to point at; the deep dive is where you show real depth. Skipping to boxes-and-arrows is the most common way to look junior.',
  },
  {
    id: 't5-02',
    trackId: 't5',
    type: 'match',
    difficulty: 1,
    conceptId: 'lb-cache-queue',
    prompt: 'Pair each component with the job it does.',
    pairs: [
      { left: 'Spreads requests across servers', right: 'Load balancer' },
      { left: 'Holds recent answers in fast storage', right: 'Cache' },
      { left: 'Holds work to be done later', right: 'Queue' },
      { left: 'Serves files from near the user', right: 'CDN' },
      { left: 'The source of truth', right: 'Database' },
    ],
    explanation:
      'Almost every design you will be asked for is assembled from these five. Knowing what each one is *for*, in one sentence and without jargon, is what lets you place them confidently rather than sprinkling boxes and hoping.',
  },
  {
    id: 't5-03',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'caching',
    prompt:
      'A feed page is slow. It is **read constantly and written rarely**. What is the first lever?',
    options: [
      {
        text: 'Cache the computed feed. Check the cache, and on a miss build it and store it',
        correct: true,
      },
      {
        text: 'Add more application servers',
        whyWrong:
          'More servers all making the same expensive query just move the bottleneck to the database. Scale out after you have stopped repeating the work.',
      },
      {
        text: 'Move to a NoSQL database',
        whyWrong:
          'A big migration that does not address the actual problem: you are recomputing the same answer over and over regardless of where it is stored.',
      },
      {
        text: 'Add an index to every column used in the query',
        whyWrong:
          'Indexes are worth checking and might help. But they speed up each repetition rather than removing the repetition, and every index slows writes.',
      },
    ],
    explanation:
      'Read-heavy plus rarely-changing is the textbook cache case. The usual pattern is cache-aside: look in the cache, and on a miss do the real work and put the result back. Saying the pattern by name, and that the application owns the logic rather than the cache. Is what is being scored.',
  },
  {
    id: 't5-04',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'caching',
    prompt:
      'Your cached feed can be **up to an hour stale**. TTL or write-through? **What is the trade-off?**',
    options: [
      {
        text: 'TTL is simpler and tolerates staleness; write-through is fresher but couples every write to the cache',
        correct: true,
      },
      {
        text: 'Write-through is always better, stale data is a bug',
        whyWrong:
          'Staleness is a product decision, not automatically a bug. Plenty of feeds are perfectly usable a minute behind, and write-through adds a failure mode on the write path.',
      },
      {
        text: 'TTL is always better because it is simpler',
        whyWrong:
          'Simplicity is a real advantage, but not unconditional. Where staleness is unacceptable (a balance, a permission check), a TTL is the wrong tool.',
      },
      {
        text: 'They do the same thing with different names',
        whyWrong:
          'They differ in when the cache is updated: a TTL lets entries expire on a clock, write-through updates them as part of the write itself.',
      },
    ],
    explanation:
      'A TTL says "this may be up to N minutes old", which is a knob you can turn and a failure mode you can explain. Write-through keeps the cache correct but ties writes to cache availability and complicates rollback. The senior move is asking how stale is acceptable *before* choosing.',
  },
  {
    id: 't5-05',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'queues',
    prompt:
      'An image-upload endpoint times out because it resizes images inline. **Why not just raise the timeout?**',
    options: [
      {
        text: 'It only moves the limit. Accept the upload, queue the resize, and return a job id straight away',
        correct: true,
      },
      {
        text: 'Because timeouts cannot be raised above 30 seconds',
        whyWrong:
          'They usually can be. The reason not to is that the user is left waiting and a request holds a connection and worker the whole time.',
      },
      {
        text: 'Because resizing should happen on the client',
        whyWrong:
          'Sometimes reasonable, but you cannot trust client output and older devices struggle. It also dodges the general lesson about slow work in a request.',
      },
      {
        text: 'Because the timeout is set by the load balancer, not the app',
        whyWrong:
          'Often true and worth knowing, but it is a detail about where the setting lives rather than a reason the design is wrong.',
      },
    ],
    explanation:
      'A long timeout keeps a connection and a worker occupied, holds the user on a spinner, and still fails on a big enough image. Accepting the upload, putting a job on a queue and returning an id makes the endpoint fast and the work retryable. The follow-up is always "how does the user find out it finished?". Polling, a webhook, or a push.',
  },
  {
    id: 't5-06',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sql-vs-nosql',
    prompt: '**"SQL or NoSQL?"** What is the balanced senior answer?',
    options: [
      {
        text: 'It depends on the data shape and the queries. Relational when things relate and you need transactions, document when records are self-contained',
        correct: true,
      },
      {
        text: 'NoSQL, because it scales better',
        whyWrong:
          'The scaling gap is much narrower than the marketing suggests, and a single Postgres instance handles far more than most products ever need. This answer reads as repeating a slogan.',
      },
      {
        text: 'SQL, because you can always add indexes',
        whyWrong:
          'Right instinct, wrong reason. Indexes are not the deciding factor. The shape of the data and the access patterns are.',
      },
      {
        text: 'Whichever the team already knows',
        whyWrong:
          'Genuinely a real-world factor and worth mentioning as a tiebreaker. On its own it dodges the technical question they asked.',
      },
    ],
    explanation:
      'The answer they want is "it depends, and here is what it depends on". Relational earns its keep when entities reference each other and you need transactions across them. Document stores shine when a record is read and written whole. Mentioning that Postgres handles JSON well shows you know the line has blurred.',
  },
  {
    id: 't5-07',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'scaling',
    prompt: 'Explain **horizontal versus vertical scaling**, and where each stops working.',
    options: [
      {
        text: 'Vertical is a bigger machine and runs out at the biggest machine; horizontal is more machines and needs them to be stateless',
        correct: true,
      },
      {
        text: 'Horizontal is always better, so vertical is a legacy idea',
        whyWrong:
          'Vertical is often the right first move: no distributed-systems complexity, and modern machines are enormous. Dismissing it signals theory over judgement.',
      },
      {
        text: 'Vertical means more CPU, horizontal means more memory',
        whyWrong:
          'Both add resources. The distinction is one bigger machine versus many machines, not which resource you are adding.',
      },
      {
        text: 'They are the same thing once you use a cloud provider',
        whyWrong:
          'The cloud makes both easier to buy but does not merge them. Horizontal still demands stateless services in a way vertical never does.',
      },
    ],
    explanation:
      'Vertical is simplest and works until you hit the largest instance available, or the price curve. Horizontal is effectively unbounded but requires that any machine can serve any request, which means no session state in memory. Naming the statelessness requirement is what separates a real answer from a definition.',
  },
  {
    id: 't5-08',
    trackId: 't5',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'scaling',
    prompt:
      'You scale to five servers and users start getting logged out at random. **What happened, and what is the fix?**',
    options: [
      {
        text: 'Sessions live in memory on one server; move them to shared storage or a signed token',
        correct: true,
      },
      {
        text: 'Turn on sticky sessions so each user always reaches the same server',
        whyWrong:
          'It does stop the logouts, which is why it is tempting. But it unbalances the load and every deploy or crash still logs those users out. It hides the statelessness problem rather than fixing it.',
      },
      {
        text: 'The load balancer is misconfigured',
        whyWrong:
          'The load balancer is doing exactly its job: spreading requests. The problem is that the servers are not interchangeable.',
      },
      {
        text: 'The database cannot handle five servers connecting',
        whyWrong:
          'Connection limits are a real concern at scale, but they cause errors and timeouts, not users being silently logged out.',
      },
    ],
    explanation:
      'The session was created on server 1 and stored in its memory. The next request lands on server 3, which has never heard of it. Move sessions into Redis or a shared store, or carry them in a signed token so no server needs to remember anything. Naming sticky sessions as the tempting-but-wrong answer is a strong signal.',
  },
  {
    id: 't5-09',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'idempotency',
    prompt:
      'A user double-taps **Pay** on a flaky connection. **What stops them being charged twice?**',
    options: [
      {
        text: 'An idempotency key sent with the request. The same key returns the original result instead of charging again',
        correct: true,
      },
      {
        text: 'Disable the button after the first tap',
        whyWrong:
          'Worth doing, and it handles the impatient user. It does nothing for a network retry, a refresh, or a client that never received the response.',
      },
      {
        text: 'Wrap the charge in a database transaction',
        whyWrong:
          'A transaction makes one charge atomic. Two requests are two separate transactions, and both will happily succeed.',
      },
      {
        text: 'Rate limit the payment endpoint per user',
        whyWrong:
          'It blunts rapid retries but is a crude fix: too tight and you block legitimate payments, too loose and the duplicate still gets through.',
      },
    ],
    explanation:
      'The client generates a key once per payment attempt and sends it with every retry. The server records the key with the result; if it sees that key again it returns the stored result rather than charging. The word to say is "idempotent". Doing it twice has the same effect as doing it once.',
  },
  {
    id: 't5-10',
    trackId: 't5',
    type: 'steps',
    difficulty: 2,
    conceptId: 'design-script',
    prompt: 'Walk through the URL shortener at senior-generalist depth. **Order the walkthrough.**',
    steps: [
      'Confirm the scope: shorten a URL, redirect, basic click counts',
      'Estimate it: heavily read-biased, redirects vastly outnumber creations',
      'Sketch it: API, a key-value store from short code to long URL, a cache in front',
      'Deep dive the short code: how it is generated and why collisions are handled',
      'Trade-offs: counting clicks asynchronously, and what changes at 10x traffic',
    ],
    explanation:
      'The shape generalises to almost any design question. The read-heavy observation is what justifies the cache; the deep dive is where you show depth by picking one thing and going properly into it; and the trade-off close is where you volunteer the weaknesses before being asked, which reads as confidence rather than doubt.',
  },
  {
    id: 't5-11',
    trackId: 't5',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'pagination',
    prompt:
      'The feed is fine on page 1 and crawls by page 100. **Why, and what do you use instead?**',
    options: [
      {
        text: 'OFFSET makes the database walk past every skipped row; a cursor jumps straight to the last item seen',
        correct: true,
      },
      {
        text: 'Page 100 has more data on it',
        whyWrong:
          'Every page returns the same number of items. What grows is the work done to *reach* them.',
      },
      {
        text: 'The cache only covers the first few pages',
        whyWrong:
          'Plausible and often partly true, but it is a symptom. The deep pages are slow at the database even with a cold cache on page 1 too.',
      },
      {
        text: 'The client is rendering too many items',
        whyWrong:
          'Rendering cost does not depend on page number, and the question says the slowness gets worse the deeper you go.',
      },
    ],
    explanation:
      '`OFFSET 2000` means the database produces and discards 2000 rows before returning anything, so cost grows with depth. A cursor says "give me the twenty after this id", which an index can seek to directly. Cursors also survive insertions, where offsets shift and can show or skip an item.',
  },
  {
    id: 't5-12',
    trackId: 't5',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'rate-limiting',
    prompt:
      'One client is hammering your API. **Where does rate limiting live, and how does a token bucket work?**',
    options: [
      {
        text: 'At the edge, before your code runs. A bucket refills at a steady rate and each request spends a token',
        correct: true,
      },
      {
        text: 'In the application, counting requests per user in memory',
        whyWrong:
          'In-memory counts are per server, so five servers means five times the allowance. It also means the abusive request has already reached your code.',
      },
      {
        text: 'In the database, with a counter row per user',
        whyWrong:
          'It makes every request write to the database. Turning your protection into an extra load source at exactly the wrong moment.',
      },
      {
        text: 'A token bucket blocks all requests once the limit is reached, until the next hour',
        whyWrong:
          'That is a fixed window. The point of a bucket is that it refills continuously, so a client recovers gradually rather than being locked out until the clock ticks over.',
      },
    ],
    explanation:
      'Limiting at the gateway means bad traffic never reaches your servers. The bucket holds a number of tokens and refills steadily; each request takes one, and a request with no token available gets a 429 with `Retry-After`. Because the bucket has depth, short bursts pass while sustained floods are capped.',
  },
  {
    id: 't5-13',
    trackId: 't5',
    type: 'match',
    difficulty: 2,
    conceptId: 'resilience',
    prompt: 'Pair each failure mode with its standard mitigation.',
    pairs: [
      { left: 'Everything retries at the same instant', right: 'Backoff with jitter' },
      { left: 'One key gets all the traffic', right: 'Sharding' },
      { left: 'A dead service is still being called', right: 'Circuit breaker' },
      { left: 'A background job fails and vanishes', right: 'Retry plus dead letter queue' },
    ],
    explanation:
      'These four pairs cover most of what a generalist design round asks about failure. Each name is doing real work: saying "thundering herd" and "jitter" in the same breath tells the interviewer you have seen the problem, not just read about retries.',
  },
  {
    id: 't5-14',
    trackId: 't5',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'scaling',
    prompt:
      '**"How would you scale this to 10x users?"** What is the first thing out of your mouth?',
    options: [
      { text: '"Measure first. I want to know what is actually the bottleneck"', correct: true },
      {
        text: '"Add caching and more servers"',
        whyWrong:
          'Probably part of the answer, but leading with it is guessing. If the bottleneck is a single slow query or a lock, more servers make it worse.',
      },
      {
        text: '"Move to microservices"',
        whyWrong:
          'A change in team structure and deployment complexity, not a performance fix. Offered as an opening move it signals cargo-culting.',
      },
      {
        text: '"Shard the database"',
        whyWrong:
          'One of the most invasive changes available, and rarely the first thing 10x needs. Reaching for it early suggests you have not considered what comes before.',
      },
    ],
    explanation:
      'Leading with measurement is the senior signal. The order of levers goes roughly: measure, cache the hot reads, add indexes and fix the slow queries, scale out the stateless tier, then move slow work to queues, and only then consider sharding or a rewrite. Naming the *order* matters more than naming any single lever.',
  },
];

export const t5: Track = {
  id: 't5',
  title: 'System design foundations',
  emoji: '🏗️',
  tagline: 'The vocabulary and the script for the design round.',
  lessons: [
    { id: 't5-l1', title: 'The script & the boxes', exerciseIds: ['t5-01', 't5-02', 't5-10'] },
    { id: 't5-l2', title: 'Caches & queues', exerciseIds: ['t5-03', 't5-04', 't5-05'] },
    { id: 't5-l3', title: 'Storing & scaling', exerciseIds: ['t5-06', 't5-07', 't5-08'] },
    {
      id: 't5-l4',
      title: 'Surviving load',
      exerciseIds: ['t5-09', 't5-11', 't5-12', 't5-13', 't5-14'],
    },
  ],
};
