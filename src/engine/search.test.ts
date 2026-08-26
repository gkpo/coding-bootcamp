import { describe, expect, it } from 'vitest';
import { scoreCard, searchCards, type Searchable } from './search';

const closure: Searchable = {
  id: 'closure',
  title: 'Closure (the backpack)',
  plainWords: 'A function that keeps access to the variables where it was created.',
  interviewerSays: ['a function that remembers', 'how would you keep this private?'],
};
const bigO: Searchable = {
  id: 'big-o',
  title: 'Big-O (how work grows)',
  plainWords: 'How much more work a function does with more input.',
  interviewerSays: ["what's the complexity?", 'it grows linearly'],
};
const cards = [closure, bigO];

describe('searchCards', () => {
  it('returns everything for an empty query', () => {
    expect(searchCards(cards, '')).toHaveLength(2);
    expect(searchCards(cards, '   ')).toHaveLength(2);
  });

  it('finds a card by title', () => {
    expect(searchCards(cards, 'closure')[0].id).toBe('closure');
  });

  it('finds a card by the interviewer phrase. The whole point of the tab', () => {
    expect(searchCards(cards, 'a function that remembers')[0].id).toBe('closure');
    expect(searchCards(cards, 'grows linearly')[0].id).toBe('big-o');
  });

  it('is case and punctuation insensitive', () => {
    expect(searchCards(cards, "WHAT'S THE COMPLEXITY?")[0].id).toBe('big-o');
  });

  it('requires every term to appear somewhere', () => {
    expect(searchCards(cards, 'closure zebra')).toHaveLength(0);
  });

  it('returns nothing for a term in no card', () => {
    expect(searchCards(cards, 'kubernetes')).toHaveLength(0);
  });

  it('ranks a title match above a prose-only match', () => {
    expect(scoreCard(closure, 'closure')).toBeGreaterThan(scoreCard(bigO, 'function'));
  });

  it('ranks a whole-phrase match above scattered words', () => {
    const whole = scoreCard(closure, 'a function that remembers');
    const scattered = scoreCard(closure, 'function variables');
    expect(whole).toBeGreaterThan(scattered);
  });

  it('finds by a single distinctive word from a phrase', () => {
    expect(searchCards(cards, 'private')[0].id).toBe('closure');
  });
});
