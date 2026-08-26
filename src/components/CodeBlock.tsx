import type { CodeBlock as CodeBlockData } from '../content/types';
import './CodeBlock.css';

interface Props {
  code: CodeBlockData;
  /** Makes each line tappable — used by the `spot-bug` renderer. */
  onLineTap?: (index: number) => void;
  lineState?: (index: number) => 'idle' | 'wrong' | 'correct';
}

/**
 * Mobile-legible code. Scrolls horizontally *inside the block* rather than
 * letting the page scroll sideways (docs/02).
 *
 * Syntax highlighting arrives in M3 with the remaining renderers; the palette
 * hook is already in the stylesheet.
 */
export function CodeBlock({ code, onLineTap, lineState }: Props) {
  const lines = code.source.split('\n');

  if (!onLineTap) {
    return (
      <pre className="code" aria-label={`${code.lang} code`}>
        <code>{code.source}</code>
      </pre>
    );
  }

  return (
    <div className="code code--interactive" role="group" aria-label="Tap the line with the bug">
      {lines.map((line, i) => (
        <button
          key={i}
          type="button"
          className={`code__line code__line--${lineState?.(i) ?? 'idle'}`}
          onClick={() => onLineTap(i)}
        >
          <span className="code__gutter" aria-hidden>
            {i + 1}
          </span>
          <span className="code__text">{line || ' '}</span>
        </button>
      ))}
    </div>
  );
}
