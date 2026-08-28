import type { Capstone } from './types';

/**
 * Build-mode capstones (docs/12 part E).
 *
 * A capstone is a boss level at the end of a track's path: the user assembles
 * a system from a tray of parts and the build is graded by running the checks
 * against it. There is no answer key, so any build the checks accept is right.
 *
 * Two deviations from the check sets in docs/12 part E, both forced by the
 * predicate semantics in part A:
 *
 * 1. `pathVia(server, worker, queue)` cannot pass in either capstone. Both
 *    builds legitimately give the server and the worker a shared neighbour
 *    (file storage in c5-01, the database in c9-01), and the kind graph is
 *    undirected, so cutting the queue still leaves a route between them. The
 *    hand-off is graded as `edge(server, queue)` instead, which is the half
 *    of the lesson the user can get wrong. The queue-to-worker link is left
 *    to the hint moves rather than to a fifth check, because a stage is
 *    capped at four.
 * 2. c9-01's stage 1 keeps `pathVia(client, server, lb)`, which is sound: the
 *    client's only edge is the pre-wired one to the load balancer.
 *
 * The wave that added c8-01 and c9-02 (docs/12 part F3) hit the same rock once
 * more and dodged it once:
 *
 * 3. c9-02's `a1-queue` is graded as `edge(server, queue)` rather than the
 *    `pathVia(server, worker, queue)` the spec asks for, for the reason above:
 *    stage 2 wires the API server to the read replica and the worker to the
 *    primary, so cutting the queue still leaves a route between the two.
 *    `a1-inline` covers the other half, that the request thread never writes
 *    to the database itself.
 * 4. c9-02's `a1-inline` ships with no hint moves. The spec gives it
 *    `disconnect server-db`, but the canonical run never draws that line, and
 *    a move that changes nothing is a validation failure. Its level-3 hint
 *    renders from `hintPoint.text` instead, which names the action in words.
 * 5. c8-01 keeps both of its `pathVia` checks, which are sound: nothing but
 *    the queue joins its API server to its worker, and nothing but the worker
 *    reaches the payment provider.
 */

const photoSharing: Capstone = {
  id: 'c5-01',
  trackId: 't5',
  title: 'The photo-sharing app',
  icon: 'blocks',
  conceptIds: ['design-script', 'caching', 'queues'],
  scenario:
    'We are building a photo-sharing app. People upload photos from their phone and browse what everyone else has posted. Start with the simplest thing that works, and I will grow it as we go.',
  stages: [
    {
      requirement:
        'Get the basics working. Someone opens the app, browses photos and uploads a new one. The photo records have to survive a restart, and the image files have to live somewhere.',
      prePlaced: ['client'],
      tray: [
        { kind: 'server', count: 1 },
        { kind: 'db', count: 1 },
        { kind: 'blob', count: 1 },
      ],
      checks: [
        {
          id: 's1-api',
          label: 'The app reaches an API',
          when: { op: 'path', from: 'client', to: 'server' },
          hintNudge:
            'The phone cannot be trusted to write to your data on its own. What should it be talking to instead?',
          hintPoint: {
            highlight: ['server'],
            text: 'Nothing is answering requests yet. The compute lane is empty.',
          },
          hintMoves: [{ place: 'server' }, { connect: ['client', 'server'] }],
          sayIt: 'The app talks to an API server, and only the API server touches the data.',
        },
        {
          id: 's1-data',
          label: 'Photo records sit behind the API',
          when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
          hintNudge:
            'If a phone could query the database itself, who would check that this person is allowed to see the photo?',
          hintPoint: {
            highlight: ['db', 'server'],
            text: 'The database belongs behind the server, not beside it.',
          },
          hintMoves: [{ place: 'db' }, { connect: ['server', 'db'] }],
          sayIt:
            'The database sits behind the API, so every read and write goes through code I control.',
        },
        {
          id: 's1-files',
          label: 'Image files go in file storage',
          when: { op: 'edge', a: 'server', b: 'blob' },
          hintNudge:
            'A photo is a few megabytes of binary. Do you want that sitting inside a database row?',
          hintPoint: {
            highlight: ['blob'],
            text: 'Nothing is holding the image files. The database is for records, not pixels.',
          },
          hintMoves: [{ place: 'blob' }, { connect: ['server', 'blob'] }],
          sayIt:
            'Files go in object storage and the database keeps the path to them, so rows stay small.',
        },
      ],
      clearLine:
        'That is the shape of most apps: something to talk to, somewhere to keep the records, somewhere to put the big files.',
      debrief:
        'Almost every app starts as these four boxes. The API sits in the middle so there is one place that checks who is asking for what, and the photos themselves stay out of the database, which keeps the rows small and the reads quick.',
    },
    {
      requirement:
        'We got written up somewhere and a hundred thousand people are browsing. One server cannot keep up, and the same few popular photos are being fetched over and over.',
      tray: [
        { kind: 'lb', count: 1 },
        { kind: 'server', count: 1 },
        { kind: 'cache', count: 1 },
      ],
      checks: [
        {
          id: 's2-two',
          label: 'More than one server',
          when: { op: 'placed', kind: 'server', atLeast: 2 },
          hintNudge:
            'One machine is at its limit. Is buying a bigger machine the move you want to defend here?',
          hintPoint: {
            highlight: ['server'],
            text: 'The compute lane has room for another server beside the first.',
          },
          hintMoves: [{ place: 'server' }],
          sayIt:
            'I would scale out rather than up: more servers, none of them holding anything the others need.',
        },
        {
          id: 's2-lb',
          label: 'All traffic comes in one door',
          when: { op: 'pathVia', from: 'client', to: 'server', via: 'lb' },
          hintNudge:
            'There are two servers now. How does a request coming from a phone decide which one it goes to?',
          hintPoint: {
            highlight: ['lb', 'client'],
            text: 'The app is still wired straight to one server. That direct line has to go.',
          },
          hintMoves: [
            { place: 'lb' },
            { connect: ['client', 'lb'] },
            { connect: ['lb', 'server'] },
            { disconnect: ['client', 'server'] },
          ],
          sayIt:
            'A load balancer takes every request and spreads it across the servers, so adding a server is all it takes to add capacity.',
        },
        {
          id: 's2-cache',
          label: 'Every server reads from the cache',
          when: { op: 'eachConnected', each: 'server', to: 'cache' },
          hintNudge:
            'The same twenty photos are being asked for thousands of times a minute. If only one of your servers can see the cache, what happens to the requests that land on the other one?',
          hintPoint: {
            highlight: ['cache', 'server'],
            text: 'The data lane has room for something faster than the database, and every server needs its own line to it.',
          },
          hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }],
          sayIt:
            'Every server checks the cache first and only reads the database on a miss, so it does not matter which server a request lands on.',
        },
      ],
      clearLine:
        'That is the standard read-heavy answer, and you got there before I had to ask for it.',
      debrief:
        'Two servers behind one door is what scaling out looks like: the load balancer hands each request to whichever server is free, so more traffic means one more server rather than a rewrite. The cache answers the popular photos from memory, and both servers are wired to it, because a request that lands on the server without it would still be waiting on the database.',
    },
    {
      requirement:
        'Uploads take eight seconds and people are giving up halfway. The upload itself is quick; what takes the time is making thumbnails in three sizes while the user waits.',
      tray: [
        { kind: 'queue', count: 1 },
        { kind: 'worker', count: 1 },
        { kind: 'replica', count: 1, decoy: true },
      ],
      checks: [
        {
          id: 's3-queue',
          label: 'Slow work is handed to a queue',
          when: { op: 'edge', a: 'server', b: 'queue' },
          hintNudge:
            'Does the person who just uploaded need to sit and watch the thumbnails being made?',
          hintPoint: {
            highlight: ['queue', 'worker'],
            text: 'The async lane is empty. Something has to hold the job, and something else has to do it.',
          },
          hintMoves: [
            { place: 'queue' },
            { place: 'worker' },
            { connect: ['server', 'queue'] },
            { connect: ['queue', 'worker'] },
          ],
          sayIt:
            'The API writes a job on a queue and answers straight away. A worker picks the job up and does the slow part.',
        },
        {
          id: 's3-thumbs',
          label: 'The worker writes thumbnails back',
          when: { op: 'edge', a: 'worker', b: 'blob' },
          hintNudge: 'The thumbnails get made. Where do they end up?',
          hintPoint: {
            highlight: ['worker', 'blob'],
            text: 'The worker has nowhere to put what it produces.',
          },
          hintMoves: [{ connect: ['worker', 'blob'] }],
          sayIt: 'The worker writes the thumbnails to the same storage the originals are in.',
        },
        {
          id: 's3-decoy',
          label: 'No database copy in this story',
          when: { op: 'notPlaced', kind: 'replica' },
          hintNudge: 'Before you copy the database, what was actually slow in what I described?',
          hintPoint: {
            highlight: ['replica'],
            text: 'The complaint was about uploads. The database was never in that path.',
          },
          hintMoves: [{ remove: 'replica' }],
          sayIt:
            'I would not add a read replica here. The slow part was the thumbnail work, not the reads.',
        },
        {
          id: 's3-budget',
          label: 'Nine parts, nothing spare',
          when: { op: 'maxParts', n: 9 },
          hintNudge:
            'Every box on that board is a thing to run, pay for and get paged about. Is anything up there doing nothing?',
          hintPoint: {
            highlight: [],
            text: 'The board is over budget. Something on it is not earning its place.',
          },
          hintMoves: [],
          sayIt: 'I would rather defend nine parts I need than draw fifteen I half-need.',
        },
        {
          id: 's3-tidy',
          label: 'Storage and database never talk',
          when: { op: 'noEdge', a: 'db', b: 'blob' },
          hintNudge:
            'A photo has a row in the database and a file in storage. Which of the two goes and fetches the other?',
          hintPoint: {
            highlight: ['db', 'blob'],
            text: 'Neither of those two calls the other. The code you wrote is what keeps them in step.',
          },
          hintMoves: [],
          sayIt:
            'The database and the file storage never talk to each other. The app writes the file, then writes the row that points at it.',
          bonus: true,
        },
      ],
      clearLine:
        'That is the whole system, and every piece of it went on the board because something made you put it there.',
      debrief:
        'The queue and the worker cut the upload in two. The API takes the file, writes down a job and answers straight away, and the worker makes the thumbnails in its own time. Nothing else on the board changed shape, which is the lesson: slow work moves off the path the user is waiting on, rather than the design being redrawn around it.',
    },
  ],
};

const flashSale: Capstone = {
  id: 'c9-01',
  trackId: 't9',
  title: 'The flash-sale checkout',
  icon: 'coins',
  conceptIds: ['queues', 'caching', 'replication', 'indexes'],
  scenario:
    'This shop sells concert tickets. At ten on a Friday morning, forty thousand people hit the checkout inside the same minute, and for the rest of the week it is quiet. The load balancer is already there. Design me the order path.',
  stages: [
    {
      requirement:
        'Take the orders. At the peak they arrive faster than a database will accept them, and losing one is the single thing we cannot do. Product pages still have to be readable while it happens.',
      prePlaced: ['client', 'lb'],
      preWired: [['client', 'lb']],
      tray: [
        { kind: 'server', count: 1 },
        { kind: 'db', count: 1 },
        { kind: 'queue', count: 1 },
        { kind: 'worker', count: 1 },
      ],
      checks: [
        {
          id: 'f1-api',
          label: 'Requests reach an API through the balancer',
          when: { op: 'pathVia', from: 'client', to: 'server', via: 'lb' },
          hintNudge:
            'The load balancer is already on the board with nothing behind it. What is it meant to be spreading requests across?',
          hintPoint: {
            highlight: ['server'],
            text: 'The compute lane is empty, so the load balancer has nowhere to send anything.',
          },
          hintMoves: [{ place: 'server' }, { connect: ['lb', 'server'] }],
          sayIt: 'Traffic lands on the load balancer, which spreads it across the API servers.',
        },
        {
          id: 'f1-orders',
          label: 'Orders are accepted onto a queue',
          when: { op: 'edge', a: 'server', b: 'queue' },
          hintNudge:
            'Forty thousand orders arrive in a minute. Does each one have to be written to the database before you can answer the customer?',
          hintPoint: {
            highlight: ['queue', 'worker'],
            text: 'The async lane is empty. The spike needs somewhere to land that is not the database.',
          },
          hintMoves: [
            { place: 'queue' },
            { place: 'worker' },
            { connect: ['server', 'queue'] },
            { connect: ['queue', 'worker'] },
          ],
          sayIt:
            'I accept the order onto a queue and hand back an order id. A spike cannot knock over what it never touches.',
        },
        {
          id: 'f1-write',
          label: 'A worker writes the orders down',
          when: { op: 'edge', a: 'worker', b: 'db' },
          hintNudge:
            'The queue is holding the orders for now. What makes them permanent once the rush is over?',
          hintPoint: {
            highlight: ['worker', 'db'],
            text: 'Something is draining the queue, but nothing is receiving what it drains.',
          },
          hintMoves: [{ place: 'db' }, { connect: ['worker', 'db'] }],
          sayIt:
            'The worker drains the queue into the database at whatever pace the database can take.',
        },
        {
          id: 'f1-read',
          label: 'The API still reads product pages',
          when: { op: 'edge', a: 'server', b: 'db' },
          hintNudge:
            'The order path is sorted. Where does the product page get its price and its stock count from?',
          hintPoint: {
            highlight: ['server', 'db'],
            text: 'Reads have no reason to go through the queue, and right now they have no route at all.',
          },
          hintMoves: [{ connect: ['server', 'db'] }],
          sayIt: 'Writes go the slow way round through the queue; reads come straight back.',
        },
      ],
      clearLine:
        'Good. The spike lands on the queue instead of the database, and nothing gets dropped on the floor.',
      debrief:
        'The queue is what makes the rush survivable. Accepting an order onto it takes a moment, so the customer gets an order id straight away, and the worker writes the orders down at whatever pace the database can take. Reads stay direct, because a product page has nothing to wait for.',
    },
    {
      requirement:
        'The orders hold up now, but the product page is melting the database. It is the same twenty items being read forty thousand times a minute, and the database still has the order writes to get through.',
      tray: [
        { kind: 'cache', count: 1 },
        { kind: 'replica', count: 1 },
        { kind: 'blob', count: 1, decoy: true },
      ],
      checks: [
        {
          id: 'f2-cache',
          label: 'Most reads never reach the database',
          when: { op: 'edge', a: 'server', b: 'cache' },
          hintNudge:
            'Twenty items, forty thousand reads. How many times does the database actually need to answer that question?',
          hintPoint: {
            highlight: ['cache'],
            text: 'Nothing is holding the popular pages anywhere faster than the database.',
          },
          hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }],
          sayIt:
            'A cache in front of the reads, with a short expiry, takes almost all of that traffic off the database.',
        },
        {
          id: 'f2-replica',
          label: 'Reads can come off a copy',
          when: { op: 'edge', a: 'db', b: 'replica' },
          hintNudge:
            'Some reads will still miss the cache. Do those have to be answered by the same machine the orders are being written to?',
          hintPoint: {
            highlight: ['replica', 'db'],
            text: 'One database is doing both jobs, and only one of them can be paused.',
          },
          hintMoves: [
            { place: 'replica' },
            { connect: ['db', 'replica'] },
            { connect: ['server', 'replica'] },
          ],
          sayIt:
            'A read replica is a copy that keeps up with the primary. Reads go to the copy, writes stay on the primary.',
        },
        {
          id: 'f2-decoy',
          label: 'No file storage in this one',
          when: { op: 'notPlaced', kind: 'blob' },
          hintNudge: 'What in a ticket order is a file?',
          hintPoint: {
            highlight: ['blob'],
            text: 'Nothing here is an image or a document. Orders, prices and stock counts are rows.',
          },
          hintMoves: [{ remove: 'blob' }],
          sayIt:
            'There are no files in this flow, so object storage would be a box on the diagram I could not defend.',
        },
        {
          id: 'f2-bonus',
          label: 'Nothing reaches the database directly',
          when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
          hintNudge: 'Trace it from the phone. How many different ways can it reach your data?',
          hintPoint: {
            highlight: ['server', 'db'],
            text: 'Every route from the outside to the data should pass through code you own.',
          },
          hintMoves: [],
          sayIt:
            'The database is never exposed to the client. Every read and write goes through the API.',
          bonus: true,
        },
      ],
      clearLine:
        'The reads are off the primary and the writes are paced. That is a checkout that survives ten on a Friday.',
      debrief:
        'Two fixes for two different reads. The cache answers the same few popular pages from memory, and the replica, a copy of the database that keeps itself up to date, takes the reads that still get through, which leaves the main database free to work through the orders.',
    },
  ],
};

const globalStorefront: Capstone = {
  id: 'c8-01',
  trackId: 't8',
  title: 'The global storefront',
  icon: 'globe',
  conceptIds: ['http-verbs', 'caching-headers', 'idempotency'],
  scenario:
    'This shop sells one very good pair of boots to the whole planet. People browse the catalogue, then place an order and pay by card. Build me the simplest thing that works, and I will keep telling you where it stops working.',
  stages: [
    {
      requirement:
        'Get a shop running. Someone opens the site, looks through the products and places an order. Prices, stock counts and orders all have to still be there tomorrow morning.',
      prePlaced: ['client'],
      tray: [
        { kind: 'server', count: 1 },
        { kind: 'db', count: 1 },
      ],
      checks: [
        {
          id: 'g1-api',
          label: 'The browser reaches an API',
          when: { op: 'path', from: 'client', to: 'server' },
          hintNudge:
            'The page has to get its prices and its stock counts from somewhere. What is it going to ask?',
          hintPoint: {
            highlight: ['server'],
            text: 'The compute lane is empty, so there is nobody on your side to answer the browser.',
          },
          hintMoves: [{ place: 'server' }, { connect: ['client', 'server'] }],
          sayIt:
            'The browser talks to an API server, and the API server is the only thing that touches the shop data.',
        },
        {
          id: 'g1-data',
          label: 'Products and orders sit behind the API',
          when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
          hintNudge:
            'If the page could read the products table for itself, what would stop it reading the orders table too?',
          hintPoint: {
            highlight: ['db', 'server'],
            text: 'The database belongs on the far side of the server, not out where a browser can reach it.',
          },
          hintMoves: [{ place: 'db' }, { connect: ['server', 'db'] }],
          sayIt:
            'Prices, stock and orders live in the database, and every read and write of them goes through the API.',
        },
      ],
      clearLine:
        'That is a shop. It works, it remembers things, and there is exactly one door into the data.',
      debrief:
        'Three boxes is an honest answer to a shop that only has to work. Putting the API in the middle is what makes everything later possible: one place decides who may read a price, who may place an order and what a valid order even looks like.',
    },
    {
      requirement:
        'Customers in Australia say a page takes three seconds to appear. The images and the stylesheets are identical for everybody, and right now every one of them is fetched from a machine in London.',
      tray: [
        { kind: 'cdn', count: 1 },
        { kind: 'cache', count: 1 },
      ],
      checks: [
        {
          id: 'g2-cdn',
          label: 'Static files come from the edge',
          when: { op: 'edge', a: 'client', b: 'cdn' },
          hintNudge:
            'The logo has not changed in a year, and it crosses an ocean every time somebody looks at it. Does it have to start in London?',
          hintPoint: {
            highlight: ['cdn'],
            text: 'The edge lane has room beside the client for something that sits near the customer instead of near you.',
          },
          hintMoves: [{ place: 'cdn' }, { connect: ['client', 'cdn'] }],
          sayIt:
            'Images, stylesheets and scripts come from a CDN, which is a network of caches sitting close to the customer.',
        },
        {
          id: 'g2-origin',
          label: 'The CDN refills from your origin',
          when: { op: 'edge', a: 'cdn', b: 'server' },
          hintNudge:
            'A cache near Sydney has to get the file from somewhere the very first time it is asked. Where does it go?',
          hintPoint: {
            highlight: ['cdn', 'server'],
            text: 'The CDN is hanging off the client with nothing behind it, so it has nothing to hand out.',
          },
          hintMoves: [{ connect: ['cdn', 'server'] }],
          sayIt:
            'On a miss the CDN fetches once from my origin, then serves that copy to everyone else nearby until it expires.',
        },
        {
          id: 'g2-cache',
          label: 'Popular pages are held in memory',
          when: { op: 'edge', a: 'server', b: 'cache' },
          hintNudge:
            'A product page shows a live stock count, so the CDN cannot hold it. What can hold it for the few seconds it stays true?',
          hintPoint: {
            highlight: ['cache', 'server'],
            text: 'The data lane holds only the database, and the database is being asked the same question all day long.',
          },
          hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }],
          sayIt:
            'The API keeps the assembled product page in a cache for a few seconds, so a thousand views cost the database one read.',
        },
      ],
      clearLine:
        'Australia gets its files from Australia now, and the database has stopped answering the same question a thousand times a minute.',
      debrief:
        'Two caches, because there are two different problems. The CDN fixes distance: those files are identical everywhere, so they may as well be sitting in the customer country already. The cache fixes repetition: the stock count does change, but not a thousand times a second, so holding it briefly costs almost nothing and saves almost everything.',
    },
    {
      requirement:
        "Now take card payments. The provider is somebody else's machine: it is slow, it times out a few times a day, and a customer who taps pay twice must never be charged twice.",
      tray: [
        { kind: 'queue', count: 1 },
        { kind: 'worker', count: 1 },
        { kind: 'ext-api', count: 1 },
        { kind: 'lb', count: 1, decoy: true },
      ],
      checks: [
        {
          id: 'g3-jobs',
          label: 'Charge attempts are queued jobs',
          when: { op: 'pathVia', from: 'server', to: 'worker', via: 'queue' },
          hintNudge:
            'The payment provider takes four seconds on a good day and never answers on a bad one. Should the customer request be sitting there waiting on it?',
          hintPoint: {
            highlight: ['queue', 'worker'],
            text: 'The async lane is empty, so nothing is holding the charge and nothing is free to keep trying it.',
          },
          hintMoves: [
            { place: 'queue' },
            { place: 'worker' },
            { connect: ['server', 'queue'] },
            { connect: ['queue', 'worker'] },
          ],
          sayIt:
            'Checkout writes a charge job on the queue and answers straight away. A worker takes the job and does the waiting.',
        },
        {
          id: 'g3-provider',
          label: 'Only the worker calls the provider',
          when: { op: 'pathVia', from: 'server', to: 'ext-api', via: 'worker' },
          hintNudge:
            'Two things on that board could call the payment provider. Which one of them is allowed to sit there for ten seconds?',
          hintPoint: {
            highlight: ['ext-api', 'worker'],
            text: "The payment provider is somebody else's machine, and nothing on your board is talking to it yet.",
          },
          hintMoves: [{ place: 'ext-api' }, { connect: ['worker', 'ext-api'] }],
          sayIt:
            'Only the worker calls the payment provider, and it sends the same reference on every retry so a repeat never charges twice.',
        },
        {
          id: 'g3-decoy',
          label: 'No load balancer in this one',
          when: { op: 'notPlaced', kind: 'lb' },
          hintNudge:
            'Nothing I described was about running out of servers. What was actually slow?',
          hintPoint: {
            highlight: ['lb'],
            text: 'The complaint was a slow payment provider, not more customers than your servers can keep up with.',
          },
          hintMoves: [{ remove: 'lb' }],
          sayIt:
            'I would not add a load balancer for this. Traffic was never the problem, waiting on someone else was.',
        },
        {
          id: 'g3-budget',
          label: 'Eight parts, and a reason for each',
          when: { op: 'maxParts', n: 8 },
          hintNudge:
            'Point at each box and say what goes wrong without it. Is there one you cannot finish the sentence for?',
          hintPoint: {
            highlight: [],
            text: 'There is more on the board than this story asked for. Something up there has no line in the brief.',
          },
          hintMoves: [],
          sayIt:
            'Every box on this diagram went up because something in the brief put it there, and I can say which.',
        },
        {
          id: 'g3-bonus',
          label: 'Nothing reaches the data but the API',
          when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
          hintNudge:
            'Start at the browser and count the routes to the database. How many did you find?',
          hintPoint: {
            highlight: ['server', 'db'],
            text: 'Every route from the outside world to the data should have to pass through code you wrote.',
          },
          hintMoves: [],
          sayIt:
            'The database has one neighbour, the API, so there is no second way into the orders table to forget about.',
          bonus: true,
        },
      ],
      clearLine:
        'That is a storefront that survives distance, repetition, and a payment provider having a bad afternoon.',
      debrief:
        'The queue is what makes a slow outside service survivable: checkout hands the charge over and answers, and the worker is the only thing that ever waits. Retries come free with that, and sending the same reference on every attempt, an idempotency key, is what keeps a second try from becoming a second charge.',
    },
  ],
};

const analyticsPipeline: Capstone = {
  id: 'c9-02',
  trackId: 't9',
  title: 'The analytics pipeline',
  icon: 'gauge',
  conceptIds: ['queues', 'replication', 'indexes'],
  scenario:
    'Every page view, click and add-to-basket in this shop is meant to end up on a dashboard the marketing team stares at all day. The tracking already goes through the API, and it is making checkout slower. The client and the API server are on the board; sort out what happens after that.',
  stages: [
    {
      requirement:
        'Record every event without making the app slower. Twenty thousand of them arrive a minute, and not one is worth making a customer wait for.',
      prePlaced: ['client', 'server'],
      preWired: [['client', 'server']],
      tray: [
        { kind: 'queue', count: 1 },
        { kind: 'worker', count: 1 },
        { kind: 'db', count: 1 },
      ],
      checks: [
        {
          id: 'a1-queue',
          label: 'Events are fired onto a queue',
          when: { op: 'edge', a: 'server', b: 'queue' },
          hintNudge:
            'One click event is worth almost nothing on its own, and a customer is waiting on the response. Should the request stop and write it down?',
          hintPoint: {
            highlight: ['queue', 'worker'],
            text: 'The async lane is empty, so an event has nowhere to go except straight into the database.',
          },
          hintMoves: [
            { place: 'queue' },
            { place: 'worker' },
            { connect: ['server', 'queue'] },
            { connect: ['queue', 'worker'] },
          ],
          sayIt:
            'The API drops the event on a queue and carries on. Something else picks it up later, and nobody waited for it.',
        },
        {
          id: 'a1-write',
          label: 'A worker writes the events down',
          when: { op: 'edge', a: 'worker', b: 'db' },
          hintNudge:
            'A queue is somewhere to put things down, not somewhere to keep them. What turns those events into something you can query?',
          hintPoint: {
            highlight: ['worker', 'db'],
            text: 'The worker is draining the queue and dropping everything it drains on the floor.',
          },
          hintMoves: [{ place: 'db' }, { connect: ['worker', 'db'] }],
          sayIt:
            'The worker reads the queue in batches and writes each batch in one go, at whatever pace the database can take.',
        },
        {
          id: 'a1-inline',
          label: 'The API never writes events itself',
          when: { op: 'noEdge', a: 'server', b: 'db' },
          hintNudge:
            'The queue is doing the recording now. So what is a straight line from the API to the database still for?',
          hintPoint: {
            highlight: ['server', 'db'],
            text: 'Take the line between the API server and the database off the board. Every event should reach it the long way round, through the queue.',
          },
          hintMoves: [],
          sayIt:
            'The request thread never touches the events database. Everything it records goes on the queue, and it waits for none of it.',
        },
      ],
      clearLine:
        'Twenty thousand events a minute and checkout did not notice. That is what handing work off actually looks like.',
      debrief:
        'The queue turns a write the customer is waiting on into a note the API leaves behind. The worker then writes in batches, which a database likes far more than twenty thousand separate inserts, and when the worker falls behind the queue simply gets longer while the shop stays fast.',
    },
    {
      requirement:
        'The dashboard is the problem now. Marketing runs a query across three months of events every time they open a chart, and while it runs the worker cannot get its writes in.',
      tray: [
        { kind: 'replica', count: 1 },
        { kind: 'ext-api', count: 1, decoy: true },
      ],
      checks: [
        {
          id: 'a2-copy',
          label: 'A copy takes the read load',
          when: { op: 'edge', a: 'db', b: 'replica' },
          hintNudge:
            'One machine is being asked a three-month question and twenty thousand writes a minute at the same time. Does it have to be the same machine?',
          hintPoint: {
            highlight: ['replica', 'db'],
            text: 'There is one database doing two jobs, and the slow job keeps getting in the way of the busy one.',
          },
          hintMoves: [{ place: 'replica' }, { connect: ['db', 'replica'] }],
          sayIt:
            'A read replica is a second database that copies the first a moment behind, so heavy reads stop competing with the writes.',
        },
        {
          id: 'a2-read',
          label: 'Dashboards read from the copy',
          when: { op: 'edge', a: 'server', b: 'replica' },
          hintNudge: 'The copy is on the board and up to date. Who is actually reading from it?',
          hintPoint: {
            highlight: ['server', 'replica'],
            text: 'The replica is copying away with nobody querying it, so the primary is still answering the dashboard.',
          },
          hintMoves: [{ connect: ['server', 'replica'] }],
          sayIt:
            'Dashboard queries go to the replica. Being a few seconds behind changes nothing in a chart of last quarter.',
        },
        {
          id: 'a2-decoy',
          label: 'No outside analytics service here',
          when: { op: 'notPlaced', kind: 'ext-api' },
          hintNudge:
            "Before you hand this to somebody else's product, what did I actually ask you to fix?",
          hintPoint: {
            highlight: ['ext-api'],
            text: 'Sending the events somewhere else does not answer the question, and the reads that hurt are still your own.',
          },
          hintMoves: [{ remove: 'ext-api' }],
          sayIt:
            'I would not reach for a third-party analytics service here. The ask was to stop your own reads fighting your own writes.',
        },
        {
          id: 'a2-budget',
          label: 'Six parts, and no spare ones',
          when: { op: 'maxParts', n: 6 },
          hintNudge:
            'Read the board back as a sentence: events come in, get written down, get read. Is anything up there not in that sentence?',
          hintPoint: {
            highlight: [],
            text: 'The board has more on it than this pipeline needs. Something up there is not carrying an event anywhere.',
          },
          hintMoves: [],
          sayIt:
            'Six parts, and each has a job in one sentence: the queue absorbs, the worker writes, the replica answers the dashboard.',
        },
      ],
      clearLine:
        'The reads and the writes have stopped fighting each other. That is most of the answer whenever somebody tells you the database is slow.',
      debrief:
        'Two machines, two jobs. The primary takes a steady trickle of batched writes from the worker, and the replica, a copy that keeps itself a moment behind, answers the long dashboard queries, where being a few seconds out of date costs nothing. The one thing the board cannot draw for you is the index on the event timestamp, and without it neither machine would survive a three-month chart.',
    },
  ],
};

export const capstones: Capstone[] = [photoSharing, flashSale, globalStorefront, analyticsPipeline];
