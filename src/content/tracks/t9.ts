import type { Exercise, Track } from '../types';

/**
 * Track 9: Databases in practice.
 *
 * Goal: read SQL out loud, say why a query got slow, and diagnose N+1 without
 * being shown the query log. Track 5 covers databases at the architecture
 * level; this is the query-level literacy that sits under it.
 */

export const t9Exercises: Exercise[] = [
  {
    id: 't9-01',
    trackId: 't9',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'joins',
    prompt: 'There are 100 users, and 30 of them have ever ordered. **How many rows come back?**',
    code: {
      lang: 'js',
      source: `SELECT u.name, o.total
FROM users u
JOIN orders o ON o.user_id = u.id`,
    },
    options: [
      { text: 'One row per order, and users with no orders do not appear at all', correct: true },
      {
        text: '100, one per user, with nulls where there are no orders',
        whyWrong:
          'That is what `LEFT JOIN` does. A plain `JOIN` is an inner join, and it keeps only the rows that matched on both sides.',
      },
      {
        text: '30, one per user who has ordered',
        whyWrong:
          'Close, and it is the trap. A user with four orders produces four rows, not one. Collapsing them back to one user needs a `GROUP BY`.',
      },
      {
        text: '3000, every user against every order',
        whyWrong:
          'That is what you get with no `ON` clause: a cross join. The `ON` is what stops it pairing everything with everything.',
      },
    ],
    explanation:
      'An inner join keeps only rows that matched on both sides, and produces one row per match. So a user with four orders appears four times, and a user with none disappears. Both halves of that surprise people, and both come up.',
  },
  {
    id: 't9-02',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'joins',
    prompt: 'Read this out loud. **What does it return?**',
    code: {
      lang: 'js',
      source: `SELECT u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL`,
    },
    options: [
      { text: 'The users who have never ordered anything', correct: true },
      {
        text: 'The orders that are missing a user',
        whyWrong:
          'The other way round. `users` is on the left, so every user is kept and the order columns are the ones that come back empty.',
      },
      {
        text: 'Nothing, because a joined row always has an id',
        whyWrong:
          'True of an inner join. A `LEFT JOIN` invents a row of nulls when the right side has no match, which is precisely what this query then filters on.',
      },
      {
        text: 'Every user, with their orders where they have any',
        whyWrong:
          'That is the query without the `WHERE`. The `IS NULL` throws away everyone who matched, leaving only those who did not.',
      },
    ],
    explanation:
      'This is an idiom worth recognising on sight. Keep everything on the left, then keep only the rows where the right side came back empty. It answers "who has never done this?" without a subquery, and interviewers use it to check that you understand what a left join actually produces.',
  },
  {
    id: 't9-03',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'sql-reading',
    prompt: 'One row of this result: **what does it mean?**',
    code: {
      lang: 'js',
      source: `SELECT user_id, COUNT(*) AS n
FROM orders
WHERE status = 'shipped'
GROUP BY user_id
HAVING COUNT(*) > 3`,
    },
    options: [
      {
        text: 'A user, and how many shipped orders they have, given it is over three',
        correct: true,
      },
      {
        text: 'A user who has more than three orders, of which some shipped',
        whyWrong:
          'The `WHERE` runs first, so unshipped orders are gone before anything is counted. The count is of shipped orders only.',
      },
      {
        text: 'An order belonging to a user with more than three orders',
        whyWrong:
          'Once you `GROUP BY user_id`, one row is one user. The individual orders have been folded away.',
      },
      {
        text: 'A user, and the total value of their shipped orders',
        whyWrong:
          '`COUNT(*)` counts rows. Totalling money would be `SUM(total)`, which is a different question with a different answer.',
      },
    ],
    explanation:
      'Read it in execution order and it falls out: `WHERE` filters rows, `GROUP BY` folds them into one row per user, then `HAVING` filters those groups. So `WHERE` is about orders and `HAVING` is about users. Saying that distinction out loud is most of the mark.',
  },
  {
    id: 't9-04',
    trackId: 't9',
    type: 'blank',
    difficulty: 2,
    conceptId: 'sql-reading',
    prompt: 'Fill in the query: customers in the UK with more than five orders.',
    template: `SELECT u.name, COUNT(*) AS n
FROM users u
JOIN orders o ____ o.user_id = u.id
____ u.country = 'UK'
GROUP BY u.name
____ COUNT(*) > 5`,
    gaps: ['ON', 'WHERE', 'HAVING'],
    bank: ['ON', 'WHERE', 'HAVING', 'AS', 'ORDER BY', 'IN'],
    explanation:
      '`ON` says how the two tables line up. `WHERE` filters individual rows, before any grouping happens. `HAVING` filters the groups afterwards, which is why it is the only one of the two that can talk about a `COUNT`. Put the count in the `WHERE` and the database rejects it outright.',
  },
  {
    id: 't9-05',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'indexes',
    prompt:
      '**"This was fine in testing and it crawls at a million rows."** The query filters on `email`. First move?',
    options: [
      { text: 'Add an index on `email`, so the database stops reading every row', correct: true },
      {
        text: 'Add more memory to the database server',
        whyWrong:
          'It might buy you a little, and it does not change the shape of the problem: the work still grows with the table. An index changes the shape.',
      },
      {
        text: 'Cache the results in the application',
        whyWrong:
          'Reasonable once the query is fast, and a way of hiding the problem before then. A cache miss still pays the full cost, and this one is avoidable.',
      },
      {
        text: 'Split the table across several servers',
        whyWrong:
          'A large change to reach for before trying the small one. A million rows is comfortably within one ordinary database, given an index.',
      },
    ],
    explanation:
      'An index is the index at the back of a book. Without one, finding every mention means reading the whole book, and a longer book takes longer. With one, you look the word up and go straight to the page, and the book being longer barely matters. That is O(n) against roughly O(log n), which is the sentence to say.',
  },
  {
    id: 't9-06',
    trackId: 't9',
    type: 'mcq',
    difficulty: 3,
    conceptId: 'indexes',
    prompt: 'So why not index every column?',
    options: [
      {
        text: 'Every write has to update every index, so writes get slower and the table gets bigger',
        correct: true,
      },
      {
        text: 'The database can only use one index per table',
        whyWrong:
          'It can use several, and combine them. The limit is not the count, it is what each one costs you on the way in.',
      },
      {
        text: 'Indexes go stale and have to be rebuilt by hand',
        whyWrong:
          'The database keeps them current as part of each write. That maintenance is exactly the cost being described, but it is not something you do manually.',
      },
      {
        text: 'They take too much memory to be worth it',
        whyWrong:
          'Space is a genuine cost, and rarely the deciding one. The write penalty is what stops people indexing everything.',
      },
    ],
    explanation:
      'An index is a second copy of one column, kept sorted. Every insert, update and delete has to maintain every index, so ten indexes make writes meaningfully slower. Add the ones your real queries filter and sort on, and check the query plan actually uses them, because an unused index is pure cost.',
  },
  {
    id: 't9-07',
    trackId: 't9',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'n-plus-one',
    prompt: 'This makes 101 queries where one would do. **Tap the line responsible.**',
    code: {
      lang: 'js',
      source: `const posts = await db.posts.findMany({ take: 100 });

for (const post of posts) {
  post.author = await db.users.findById(post.authorId);
}

return posts;`,
    },
    buggyLineIndex: 3,
    lineHints: {
      0: 'One query for the posts is right, and it is the one query you wanted.',
      2: 'Looping over the posts is fine. It is what happens inside the loop that costs.',
      6: 'Returning them is fine. The queries have all been run by now.',
    },
    explanation:
      'One query for the list, then one more for every row it returned: 1 + N, which is where the name comes from. The database is not slow, it is being asked a hundred times. Collect the ids and fetch the authors in a single query with `IN`, or let the ORM join them for you.',
  },
  {
    id: 't9-08',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'n-plus-one',
    prompt: 'You have found the N+1. **How do you say the diagnosis, and the fix?**',
    options: [
      {
        text: '"One query per row. I would collect the ids and fetch them all in one query, or let the ORM include the relation."',
        correct: true,
      },
      {
        text: '"The database is too slow, I would add a cache in front of it."',
        whyWrong:
          'It is not slow, it is being asked a hundred separate questions. Caching a hundred round trips hides the shape of the bug and leaves it there.',
      },
      {
        text: '"I would run the queries in parallel with Promise.all."',
        whyWrong:
          'A real improvement in wall-clock time, and it is still a hundred queries. Interviewers listen for whether you cut the number down or merely overlap them.',
      },
      {
        text: '"I would paginate so fewer rows come back."',
        whyWrong:
          'Fewer rows means fewer queries, so the symptom eases. The per-row query is still there, waiting for the page size to grow.',
      },
    ],
    explanation:
      'Naming it is half the answer, and interviewers are listening for the phrase. "One query per row" is the diagnosis; batching them into one is the fix. Two queries in total, whatever the row count, and the cost stops growing with the size of the list.',
  },
  {
    id: 't9-09',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'transactions',
    prompt:
      'A transfer debits one account and credits another. **The server dies between the two. What saves you?**',
    options: [
      { text: 'A transaction: both statements land, or neither does', correct: true },
      {
        text: 'Retrying the whole transfer when the server comes back',
        whyWrong:
          'You cannot know how far it got. Retrying blind either loses the money or moves it twice, and there is no way to tell which from the outside.',
      },
      {
        text: 'Writing to a log first so the transfer can be replayed',
        whyWrong:
          'This is roughly how the database implements transactions internally. Building it yourself in application code is reinventing the thing you already have.',
      },
      {
        text: 'Doing the credit before the debit, so nobody loses out',
        whyWrong:
          'The window is still there, and now it favours the customer instead of the bank. Reordering a two-step operation never makes it one step.',
      },
    ],
    explanation:
      'Wrap the two statements in a transaction and the database guarantees all or nothing: crash halfway and the debit is rolled back as if it never happened. That is the A in ACID, atomicity. The others: consistency keeps your rules true, isolation stops concurrent transactions seeing each other half-done, durability means a commit survives the power going out.',
  },
  {
    id: 't9-10',
    trackId: 't9',
    type: 'match',
    difficulty: 2,
    conceptId: 'decoder',
    prompt: 'Pair each description with the term.',
    pairs: [
      {
        left: 'The index at the back of the book',
        right: 'Database index',
        why: 'A sorted lookup structure kept beside the table points straight at the matching rows, so the database skips reading the rest.',
      },
      {
        left: 'All of it, or none of it',
        right: 'Transaction',
        why: 'The writes are grouped so they commit together or roll back together, which is what stops a half finished change being visible.',
      },
      {
        left: 'One query per row',
        right: 'N+1',
        why: 'The list costs one query and then every row costs another, so a page of two hundred rows quietly becomes two hundred and one round trips.',
      },
      {
        left: 'Only the rows that matched on both sides',
        right: 'INNER JOIN',
        why: 'Rows with no partner on the other side are dropped, which is the difference from an outer join that keeps them and fills in nulls.',
      },
    ],
    explanation:
      'Four things you will be asked to name rather than explain. "One query per row" in particular is the phrase interviewers use to see whether you recognise N+1 from a description, without being shown a query log.',
  },
  {
    id: 't9-11',
    trackId: 't9',
    type: 'spot-bug',
    difficulty: 2,
    conceptId: 'n-plus-one',
    prompt:
      'The invoice export takes four minutes for 3,000 invoices. **Tap the line that makes it slow.**',
    code: {
      lang: 'js',
      source: `const invoices = await db.invoices.all();
const rows = [];
for (const invoice of invoices) {
  const customer = await db.customers.byId(invoice.customerId);
  rows.push(format(invoice, customer));
}
return rows;`,
    },
    buggyLineIndex: 3,
    lineHints: {
      0: 'One query for all the invoices is fine. That is the "1" in N+1.',
      2: 'Looping over the invoices is unavoidable; formatting each one is the job.',
      4: 'Building the output array in memory is not what is costing you minutes.',
      6: 'Returning the rows is free.',
    },
    explanation:
      'One query for the invoices, then one more per invoice, is 3,001 round trips to the database. Each is fast on its own and the network cost between them is what adds up. Fetch the customers in a single query keyed by id, or ask for invoices with their customers joined, and the four minutes become one round trip.',
  },
  {
    id: 't9-12',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'indexes',
    prompt: 'There is an index on `(country, city)`. Which query does **not** get to use it?',
    promptVariants: [
      'Given a composite index on `(country, city)`, which of these still scans the table?',
    ],
    options: [
      { text: "WHERE city = 'Lisbon'", correct: true },
      {
        text: "WHERE country = 'PT'",
        whyWrong:
          'This uses the index. A composite index can be used for a leading prefix of its columns, and `country` is the first one.',
      },
      {
        text: "WHERE country = 'PT' AND city = 'Lisbon'",
        whyWrong:
          'This is the case the index was built for. Both columns are given, in order, so the lookup goes straight to the matching rows.',
      },
      {
        text: "WHERE country = 'PT' ORDER BY city",
        whyWrong:
          'This uses it well. The index already holds cities in order within each country, so the sort comes free.',
      },
    ],
    explanation:
      'A composite index is sorted by the first column, then the second within it, like a phone book by surname then first name. Searching by first name alone is no help, because those entries are scattered throughout. Column order in an index is a decision, not a formality, and being able to say why is what this question is really asking.',
  },
  {
    id: 't9-13',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'transactions',
    prompt:
      'A transfer debits one account and credits another. The credit fails and the code catches the error and logs it. What is the state of the data?',
    promptVariants: [
      'The debit succeeded, the credit threw, and the error was caught and logged. What happened to the money?',
    ],
    options: [
      {
        text: 'The debit stands unless the whole thing was in a transaction that was rolled back',
        correct: true,
      },
      {
        text: 'Nothing was written, because the second statement failed',
        whyWrong:
          'Statements are independent unless you wrap them. The first one committed on its own the moment it succeeded, and nothing about the second undoes it.',
      },
      {
        text: 'The database rolls back automatically when a statement throws',
        whyWrong:
          'Some drivers roll back an *open* transaction on error, but only if you opened one. Two plain statements have no transaction to roll back.',
      },
      {
        text: 'Both are written, because the credit is retried',
        whyWrong:
          'Nothing here retries. The catch swallowed the error, which is worse than crashing: the money left one account and never arrived anywhere.',
      },
    ],
    explanation:
      'Money vanished, and the log line is the only trace. Two writes that must both happen belong in one transaction: begin, both statements, commit, and roll back on any error. The catch block is the second bug, because catching an error and carrying on turns a loud failure into a silent one.',
  },
  {
    id: 't9-14',
    trackId: 't9',
    type: 'mcq',
    difficulty: 2,
    conceptId: 'joins',
    prompt:
      'You join `orders` to `refunds` to list every order with its refund total. Orders with no refund vanish from the results. Why?',
    promptVariants: ['After joining orders to refunds, the order count dropped. What happened?'],
    options: [
      {
        text: 'It is an inner join, which keeps only rows that matched on both sides',
        correct: true,
      },
      {
        text: 'Orders with no refund have a null refund total, and nulls are filtered out',
        whyWrong:
          'A left join would give exactly those nulls and keep the rows. Nothing filters nulls on its own; the rows are gone before any null could appear.',
      },
      {
        text: 'The join needs an index on the refund side',
        whyWrong:
          'An index changes how fast the join runs, never which rows come back. A missing index is a performance bug, not a correctness one.',
      },
      {
        text: 'Aggregating with SUM drops rows that have nothing to sum',
        whyWrong:
          'SUM over no rows gives null rather than removing the group. The rows were already gone at the join step, before the aggregate ran.',
      },
    ],
    explanation:
      'An inner join is an intersection: no partner, no row. "Every order, with its refund total if any" is a left join, which keeps every row from the left side and fills nulls where there was no match. Wrapping the total in `COALESCE(SUM(amount), 0)` then turns those nulls into zeroes. Disappearing rows after a join is almost always this.',
  },
];

export const t9: Track = {
  id: 't9',
  title: 'Databases in practice',
  icon: 'rows',
  tagline: 'Read the query, say why it is slow.',
  lessons: [
    { id: 't9-l1', title: 'Reading SQL', exerciseIds: ['t9-01', 't9-02', 't9-03', 't9-04'] },
    { id: 't9-l2', title: 'Making it fast', exerciseIds: ['t9-05', 't9-06', 't9-07'] },
    { id: 't9-l3', title: 'N+1 and transactions', exerciseIds: ['t9-08', 't9-09', 't9-10'] },
    {
      id: 't9-l4',
      title: 'Slow queries and missing rows',
      exerciseIds: ['t9-11', 't9-12', 't9-13', 't9-14'],
    },
  ],
};
