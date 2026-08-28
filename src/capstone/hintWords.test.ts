import { describe, expect, it } from 'vitest';
import { hintWords } from './hintWords';
import { capstones } from '../content';

describe('hintWords', () => {
  it('says a single placement', () => {
    expect(hintWords([{ place: 'server' }])).toBe('Place the API server.');
  });

  it('joins two placements before the wiring', () => {
    expect(
      hintWords([
        { place: 'queue' },
        { place: 'worker' },
        { connect: ['server', 'queue'] },
        { connect: ['queue', 'worker'] },
      ]),
    ).toBe(
      'Place the queue and the worker, then connect the API server to the queue and the queue to the worker.',
    );
  });

  it('names an edge that has to go, which is the move people miss', () => {
    expect(
      hintWords([
        { place: 'lb' },
        { connect: ['client', 'lb'] },
        { connect: ['lb', 'server'] },
        { disconnect: ['client', 'server'] },
      ]),
    ).toBe(
      'Place the load balancer, then connect the client to the load balancer and the load balancer to the API server, then take away the line between the client and the API server.',
    );
  });

  it('says how to undo a decoy', () => {
    expect(hintWords([{ remove: 'replica' }])).toBe('Take the read replica off the board.');
  });

  it('says nothing for a check with no moves, so the caller falls back', () => {
    expect(hintWords([])).toBe('');
  });

  it('reads as a sentence for every check the app ships', () => {
    for (const capstone of capstones) {
      for (const stage of capstone.stages) {
        for (const check of stage.checks) {
          const words = hintWords(check.hintMoves);
          if (check.hintMoves.length === 0) {
            expect(words, check.id).toBe('');
            continue;
          }
          expect(words.endsWith('.'), check.id).toBe(true);
          expect(words[0], check.id).toBe(words[0].toUpperCase());
          expect(words, check.id).not.toContain('undefined');
        }
      }
    }
  });
});
