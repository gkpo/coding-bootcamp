import { describe, expect, it, vi } from 'vitest';
import { debounce } from './persistence';

describe('debounce', () => {
  it('collapses a burst into a single trailing call', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 500);

    debounced('a');
    debounced('b');
    debounced('c');
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('c');
    vi.useRealTimers();
  });

  it('runs again after the window has passed', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 500);

    debounced('first');
    vi.advanceTimersByTime(500);
    debounced('second');
    vi.advanceTimersByTime(500);

    expect(spy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
