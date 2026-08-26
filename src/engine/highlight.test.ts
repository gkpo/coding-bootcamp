import { describe, expect, it } from 'vitest';
import { initialState, tokenize, tokenizeLine, type Token } from './highlight';
import { cards, exercises } from '../content';

const kindsOf = (tokens: Token[]) => tokens.map((t) => `${t.kind}:${t.text}`);
const one = (line: string) => tokenizeLine(line, initialState());
const textOf = (lines: Token[][]) => lines.map((l) => l.map((t) => t.text).join('')).join('\n');

describe('lossless tokenizing', () => {
  it('reassembles to exactly the input', () => {
    const src = `const x = 1; // note\nfoo("bar");`;
    expect(textOf(tokenize(src))).toBe(src);
  });

  it('preserves indentation and blank lines', () => {
    const src = 'function f() {\n\n    return 1;\n}';
    expect(textOf(tokenize(src))).toBe(src);
  });

  it('keeps one token array per line', () => {
    expect(tokenize('a\nb\nc')).toHaveLength(3);
  });
});

describe('classification', () => {
  it('marks keywords', () => {
    expect(kindsOf(one('const'))).toEqual(['keyword:const']);
    expect(kindsOf(one('return'))).toEqual(['keyword:return']);
  });

  it('separates literals from keywords, so data reads differently', () => {
    expect(one('true')[0].kind).toBe('literal');
    expect(one('null')[0].kind).toBe('literal');
    expect(one('undefined')[0].kind).toBe('literal');
  });

  it('marks a call as a function', () => {
    expect(one('push(x)')[0]).toEqual({ text: 'push', kind: 'function' });
  });

  it('marks a call with a space before the paren', () => {
    expect(one('foo ()')[0].kind).toBe('function');
  });

  it('marks a property access', () => {
    const tokens = one('items.length');
    expect(tokens.find((t) => t.text === 'length')?.kind).toBe('property');
  });

  it('marks built-in types', () => {
    expect(one('Math')[0].kind).toBe('type');
    expect(one('string')[0].kind).toBe('type');
  });

  it('marks numbers, including numeric separators', () => {
    expect(one('86_400_000')[0]).toEqual({ text: '86_400_000', kind: 'number' });
    expect(one('3.14')[0].kind).toBe('number');
  });

  it('leaves ordinary identifiers plain', () => {
    expect(one('amount')[0].kind).toBe('plain');
  });
});

describe('strings', () => {
  it('handles all three quote styles', () => {
    expect(one(`'a'`)[0].kind).toBe('string');
    expect(one(`"a"`)[0].kind).toBe('string');
    expect(one('`a`')[0].kind).toBe('string');
  });

  it('does not colour keywords hiding inside a string', () => {
    // A naive regex highlighter gets this wrong; it is the whole reason for
    // scanning character by character.
    const tokens = one(`const s = "return const";`);
    expect(tokens.filter((t) => t.kind === 'keyword').map((t) => t.text)).toEqual(['const']);
    expect(tokens.some((t) => t.kind === 'string' && t.text === '"return const"')).toBe(true);
  });

  it('respects escaped quotes', () => {
    const tokens = one(`'it\\'s'`);
    expect(tokens[0].kind).toBe('string');
    expect(tokens[0].text).toBe(`'it\\'s'`);
  });

  it('does not treat an apostrophe in a comment as opening a string', () => {
    const tokens = one(`// it's fine`);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].kind).toBe('comment');
  });
});

describe('comments', () => {
  it('takes a line comment to end of line', () => {
    const tokens = one('x = 1; // set it');
    expect(tokens[tokens.length - 1]).toEqual({ text: '// set it', kind: 'comment' });
  });

  it('does not treat a URL inside a string as a comment', () => {
    const tokens = one(`fetch("https://example.com");`);
    expect(tokens.some((t) => t.kind === 'comment')).toBe(false);
  });

  it('carries a block comment across lines', () => {
    const lines = tokenize('/* one\n two */ const x = 1;');
    expect(lines[0].every((t) => t.kind === 'comment')).toBe(true);
    expect(lines[1][0].kind).toBe('comment');
    expect(lines[1].some((t) => t.kind === 'keyword' && t.text === 'const')).toBe(true);
  });

  it('resumes normal colouring after the block closes on the same line', () => {
    const tokens = one('/* hi */ return 1;');
    expect(tokens.some((t) => t.kind === 'keyword' && t.text === 'return')).toBe(true);
  });
});

describe('against the real authored content', () => {
  const snippets = [
    ...exercises.map((e) => e.code?.source).filter((s): s is string => s !== undefined),
    ...cards.map((c) => c.example?.source).filter((s): s is string => s !== undefined),
  ];

  it('covers every snippet in the app', () => {
    expect(snippets.length).toBeGreaterThan(20);
  });

  it('never loses or reorders a character', () => {
    for (const src of snippets) {
      expect(textOf(tokenize(src)), src.slice(0, 40)).toBe(src);
    }
  });

  it('finds something to colour in every snippet', () => {
    for (const src of snippets) {
      const kinds = new Set(tokenize(src).flat().map((t) => t.kind));
      kinds.delete('plain');
      kinds.delete('punctuation');
      expect(kinds.size, src.slice(0, 40)).toBeGreaterThan(0);
    }
  });

  it('never emits an empty token', () => {
    for (const src of snippets) {
      for (const token of tokenize(src).flat()) expect(token.text).not.toBe('');
    }
  });
});
