import { useMemo } from 'react';
import { tokenize, type Token } from '../engine/highlight';
import type { CodeBlock as CodeBlockData } from '../content/types';
import './CodeBlock.css';

interface Props {
  code: CodeBlockData;
  /** Makes each line tappable — used by the `spot-bug` renderer. */
  onLineTap?: (index: number) => void;
  lineState?: (index: number) => 'idle' | 'wrong' | 'correct';
}

function Highlighted({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, i) =>
        token.kind === 'plain' ? (
          <span key={i}>{token.text}</span>
        ) : (
          <span key={i} className={`tok tok--${token.kind}`}>
            {token.text}
          </span>
        ),
      )}
    </>
  );
}

/**
 * Mobile-legible code. Scrolls horizontally *inside the block* rather than
 * letting the page scroll sideways (docs/02).
 *
 * Highlighting is per-line so the tappable and plain modes share one source of
 * truth — a whole-block highlighter would have to be cut apart at every line
 * boundary for spot-bug, which is where nested spans break.
 */
export function CodeBlock({ code, onLineTap, lineState }: Props) {
  const lines = useMemo(() => tokenize(code.source), [code.source]);

  if (!onLineTap) {
    return (
      <pre className="code" aria-label={`${code.lang} code`}>
        <code>
          {lines.map((tokens, i) => (
            <span className="code__row" key={i}>
              <Highlighted tokens={tokens} />
              {i < lines.length - 1 ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    );
  }

  return (
    <div className="code code--interactive" role="group" aria-label="Tap the line with the bug">
      {lines.map((tokens, i) => (
        <button
          key={i}
          type="button"
          className={`code__line code__line--${lineState?.(i) ?? 'idle'}`}
          onClick={() => onLineTap(i)}
        >
          <span className="code__gutter" aria-hidden>
            {i + 1}
          </span>
          <span className="code__text">
            {tokens.length === 0 ? ' ' : <Highlighted tokens={tokens} />}
          </span>
        </button>
      ))}
    </div>
  );
}
