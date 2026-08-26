import { describe, expect, it } from 'vitest';
import { hasUnrenderedMarkers, stripMarkdown } from '../engine/markdown';
import { cards, exercises } from './index';

/**
 * Content is authored with a tiny markdown subset (**bold**, *italic*, `code`).
 * Anything the renderer does not understand ships to the user as literal
 * asterisks or backticks — which is exactly what happened with "*more*" on the
 * Big-O card. This guard makes that a failing test rather than a screenshot.
 */

function userVisibleStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];

  for (const exercise of exercises) {
    out.push({ where: `${exercise.id}.prompt`, text: exercise.prompt });
    out.push({ where: `${exercise.id}.explanation`, text: exercise.explanation });
    if (exercise.type === 'mcq' || exercise.type === 'ladder') {
      exercise.options.forEach((o, i) => {
        out.push({ where: `${exercise.id}.options[${i}]`, text: o.text });
        if (o.whyWrong)
          out.push({ where: `${exercise.id}.options[${i}].whyWrong`, text: o.whyWrong });
      });
    }
    if (exercise.type === 'complexity') {
      out.push({ where: `${exercise.id}.sayIt`, text: exercise.sayIt });
    }
    if (exercise.type === 'steps') {
      exercise.steps.forEach((s, i) => out.push({ where: `${exercise.id}.steps[${i}]`, text: s }));
    }
    if (exercise.type === 'match') {
      exercise.pairs.forEach((p, i) => {
        out.push({ where: `${exercise.id}.pairs[${i}].left`, text: p.left });
        out.push({ where: `${exercise.id}.pairs[${i}].right`, text: p.right });
      });
    }
  }

  for (const card of cards) {
    out.push({ where: `${card.id}.plainWords`, text: card.plainWords });
    out.push({ where: `${card.id}.analogy`, text: card.analogy });
    if (card.exampleCaption)
      out.push({ where: `${card.id}.exampleCaption`, text: card.exampleCaption });
    card.sayThis.forEach((line, i) => out.push({ where: `${card.id}.sayThis[${i}]`, text: line }));
    card.interviewerSays.forEach((line, i) =>
      out.push({ where: `${card.id}.interviewerSays[${i}]`, text: line }),
    );
  }

  return out;
}

describe('authored markdown', () => {
  it('leaves no unrendered markers in any user-visible string', () => {
    const offenders = userVisibleStrings()
      .filter(({ text }) => hasUnrenderedMarkers(text))
      .map(({ where, text }) => `${where}: ${text.slice(0, 70)}`);
    // Joined rather than compared as an array: the failure output has to name
    // the offending string, and a diff of arrays truncates it.
    expect(offenders.join('\n')).toBe('');
  });

  it('actually renders the emphasis the copy relies on', () => {
    // Regression guard for the "*more*" bug — these must not survive stripping.
    expect(stripMarkdown('grows with the *square* of the list')).toBe(
      'grows with the square of the list',
    );
    expect(stripMarkdown('how much **more** work')).toBe('how much more work');
    expect(stripMarkdown('the `includes` call')).toBe('the includes call');
    // Nesting: inline code inside bold, which t1-15's prompt actually uses.
    expect(stripMarkdown('**why is `push` still called O(1)?**')).toBe(
      'why is push still called O(1)?',
    );
  });

  it('leaves ordinary prose untouched', () => {
    expect(stripMarkdown('no markup here at all')).toBe('no markup here at all');
  });

  it('allows an asterisk inside a code span — that is multiplication, not emphasis', () => {
    expect(hasUnrenderedMarkers('the start is `(page - 1) * size` here')).toBe(false);
  });

  it('still catches a marker outside a code span', () => {
    expect(hasUnrenderedMarkers('this *never closes')).toBe(true);
    expect(hasUnrenderedMarkers('a stray ` backtick')).toBe(true);
  });
});
