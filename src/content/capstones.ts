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
    },
  ],
};

export const capstones: Capstone[] = [photoSharing, flashSale];
