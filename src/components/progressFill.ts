/**
 * The faint "seen" fill shared by the progress bar and the path's nodes.
 *
 * Its own module rather than an export from ProgressBar.tsx: the two live on
 * the same screen, and two mixes of the same colour that drift apart by a few
 * percent read as a rendering bug rather than a palette (docs/11 part C).
 */
export function seenFill(colour: string): string {
  return `color-mix(in srgb, ${colour} 28%, var(--surface-2))`;
}
