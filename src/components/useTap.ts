import { useCallback } from 'react';
import { playTone } from '../engine/feedback';
import { useStore } from '../store/useStore';

/**
 * The button tap, behind the same Sound setting as everything else.
 *
 * A hook rather than a bare call so the setting is read reactively: turning
 * Sound off has to silence presses immediately, not on the next mount.
 */
export function useTap() {
  const sound = useStore((s) => s.settings.sound);
  return useCallback(() => playTone('tap', sound), [sound]);
}
