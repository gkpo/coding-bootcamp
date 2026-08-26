import { Fragment, type ReactNode } from 'react';
import { MARKDOWN_TOKEN } from '../engine/markdown';

/**
 * The tiny markdown subset content may use: **bold**, *italic* and `code`.
 *
 * Hand-rolled on purpose: docs/05 rules out pulling in a markdown library for
 * three constructs, and this keeps the React Native port trivial.
 *
 * Italics were added to the documented bold+code pair because the authored
 * copy leans on them to carry meaning ("loops one *after* another add up; only
 * loops *inside* one another multiply"). The alternative was deleting the
 * emphasis from the teaching text, which loses the distinction being taught.
 */

export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MARKDOWN_TOKEN.lastIndex = 0;
  while ((match = MARKDOWN_TOKEN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={nodes.length}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const token = match[0];
    // Bold and italic recurse, so `code` nested inside them still renders: // the authored copy does exactly that ("**why is `push` still O(1)?**").
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={nodes.length}>
          <RichText text={token.slice(2, -2)} />
        </strong>,
      );
    } else if (token.startsWith('*')) {
      nodes.push(
        <em key={nodes.length}>
          <RichText text={token.slice(1, -1)} />
        </em>,
      );
    } else {
      nodes.push(
        <code className="inline-code" key={nodes.length}>
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={nodes.length}>{text.slice(lastIndex)}</Fragment>);
  }
  return <>{nodes}</>;
}
