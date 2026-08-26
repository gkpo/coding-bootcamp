/**
 * Cheat-sheet search.
 *
 * Searches the "interviewer says" phrases as well as titles and plain words,
 * because the whole point of the Sheets tab is looking up the riddle you just
 * heard — "a function that remembers" has to find the closure card.
 */

export interface Searchable {
  id: string;
  title: string;
  plainWords: string;
  interviewerSays: string[];
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

/** Higher is better; 0 means no match. Title beats phrase beats prose. */
export function scoreCard(card: Searchable, query: string): number {
  const q = normalise(query).trim();
  if (q === '') return 1;

  const terms = q.split(/\s+/);
  const title = normalise(card.title);
  const phrases = normalise(card.interviewerSays.join(' '));
  const prose = normalise(card.plainWords);

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 8;
    else if (phrases.includes(term)) score += 4;
    else if (prose.includes(term)) score += 1;
    else return 0; // every term must appear somewhere
  }
  // A phrase matched whole ranks above the same words scattered around.
  if (phrases.includes(q) || title.includes(q)) score += 6;
  return score;
}

export function searchCards<T extends Searchable>(cards: readonly T[], query: string): T[] {
  return cards
    .map((card) => ({ card, score: scoreCard(card, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) =>
      b.score === a.score ? a.card.title.localeCompare(b.card.title) : b.score - a.score,
    )
    .map((r) => r.card);
}
