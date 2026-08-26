/**
 * A small JS/TS tokenizer for the code blocks.
 *
 * Emits tokens **per line**, carrying block-comment state across lines. That
 * shape is the reason this exists rather than a library: `spot-bug` renders
 * every line as its own tappable <button>, and a highlighter that returns one
 * blob of nested spans has to be cut apart at line boundaries, where a span
 * opened on line 2 and closed on line 5 leaves broken markup on both sides.
 *
 * It also keeps the promise docs/05 actually makes: "keep bundle small, no
 * full Prism/hljs bundles". highlight.js core plus js/ts is roughly 15 kB
 * gzipped; this is about 1 kB, and the content it has to colour is deliberately
 * plain modern JS/TS (docs/03: const, arrow functions, template literals,
 * <= 18 lines, self-contained).
 *
 * Pure: no React, no DOM.
 */

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'literal'
  | 'function'
  | 'property'
  | 'type'
  | 'punctuation';

export interface Token {
  text: string;
  kind: TokenKind;
}

const KEYWORDS = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'of',
  'return',
  'static',
  'switch',
  'throw',
  'try',
  'type',
  'typeof',
  'var',
  'void',
  'while',
  'yield',
]);

/** Values, not control flow. Coloured apart from keywords so they read as data. */
const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'this', 'NaN', 'Infinity']);

/** Built-in types and constructors that read as types in these snippets. */
const TYPES = new Set([
  'Array',
  'Boolean',
  'Date',
  'Error',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'RangeError',
  'Set',
  'String',
  'Symbol',
  'boolean',
  'number',
  'string',
  'unknown',
  'any',
  'never',
]);

const ID_START = /[A-Za-z_$]/;
const ID_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;

/** Carried between lines so a multi-line block comment survives the break. */
export interface ScanState {
  inBlockComment: boolean;
}

export function initialState(): ScanState {
  return { inBlockComment: false };
}

function push(tokens: Token[], text: string, kind: TokenKind): void {
  if (text === '') return;
  // Merge runs of the same kind so the DOM stays small.
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) last.text += text;
  else tokens.push({ text, kind });
}

/**
 * Tokenize one line, mutating `state` for the next. Returns tokens whose text
 * concatenates back to exactly the input. Nothing is dropped or reordered.
 */
export function tokenizeLine(line: string, state: ScanState): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // ---- inside a block comment ----
    if (state.inBlockComment) {
      const end = line.indexOf('*/', i);
      if (end === -1) {
        push(tokens, line.slice(i), 'comment');
        return tokens;
      }
      push(tokens, line.slice(i, end + 2), 'comment');
      state.inBlockComment = false;
      i = end + 2;
      continue;
    }

    const ch = line[i];
    const next = line[i + 1];

    // ---- comments ----
    if (ch === '/' && next === '/') {
      push(tokens, line.slice(i), 'comment');
      return tokens;
    }
    if (ch === '/' && next === '*') {
      state.inBlockComment = true;
      i += 2;
      push(tokens, '/*', 'comment');
      continue;
    }

    // ---- strings and template literals ----
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      // An unterminated string runs to end of line; these snippets never
      // legitimately span lines with a quote, so this stays contained.
      push(tokens, line.slice(i, j), 'string');
      i = j;
      continue;
    }

    // ---- numbers, including 86_400_000 ----
    if (DIGIT.test(ch)) {
      let j = i;
      while (j < line.length && /[0-9_.xXa-fA-F]/.test(line[j])) j++;
      push(tokens, line.slice(i, j), 'number');
      i = j;
      continue;
    }

    // ---- identifiers ----
    if (ID_START.test(ch)) {
      let j = i;
      while (j < line.length && ID_PART.test(line[j])) j++;
      const word = line.slice(i, j);

      // What follows decides whether this reads as a call or a property.
      let k = j;
      while (k < line.length && line[k] === ' ') k++;
      const isCall = line[k] === '(';
      const isProperty = i > 0 && line[i - 1] === '.';

      let kind: TokenKind = 'plain';
      if (KEYWORDS.has(word)) kind = 'keyword';
      else if (LITERALS.has(word)) kind = 'literal';
      else if (TYPES.has(word)) kind = 'type';
      else if (isCall) kind = 'function';
      else if (isProperty) kind = 'property';

      push(tokens, word, kind);
      i = j;
      continue;
    }

    // ---- punctuation and operators ----
    if (/[{}()[\];,.:?=<>+\-*/%!&|^~]/.test(ch)) {
      push(tokens, ch, 'punctuation');
      i++;
      continue;
    }

    push(tokens, ch, 'plain');
    i++;
  }

  return tokens;
}

/** Tokenize a whole snippet, one token array per line. */
export function tokenize(source: string): Token[][] {
  const state = initialState();
  return source.split('\n').map((line) => tokenizeLine(line, state));
}
