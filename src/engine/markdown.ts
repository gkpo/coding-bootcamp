/**
 * The tiny markdown subset content is authored in: **bold**, *italic*, `code`.
 *
 * Lives in engine/ because it is pure string work with no React or DOM — the
 * renderer in components/RichText.tsx is the only React-aware half.
 *
 * Italics were added to the bold+code pair documented in docs/05 because the
 * authored copy leans on them to carry meaning ("loops one *after* another add
 * up; only loops *inside* one another multiply"). Deleting that emphasis would
 * have lost the distinction being taught.
 */

// Order matters: ** is tried before * or bold would match as two italics.
export const MARKDOWN_TOKEN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

/** The plain text a markdown string renders as — used to guard content. */
export function stripMarkdown(text: string): string {
  let out = text;
  // Repeat to unwrap nesting; bounded so a pathological string cannot spin.
  for (let pass = 0; pass < 5; pass++) {
    const next = out.replace(MARKDOWN_TOKEN, (token) =>
      token.startsWith('**') ? token.slice(2, -2) : token.slice(1, -1),
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

const CODE_SPAN = /`[^`]+`/g;

/**
 * True when a string still contains markers the renderer will not consume, so
 * they would reach the reader literally.
 *
 * Code spans are removed first rather than unwrapped: their contents render
 * verbatim, so an asterisk inside one is multiplication, not emphasis
 * (`(pageNumber - 1) * size` is correct content, not a broken marker).
 */
export function hasUnrenderedMarkers(text: string): boolean {
  return /[*`]/.test(stripMarkdown(text.replace(CODE_SPAN, '')));
}
