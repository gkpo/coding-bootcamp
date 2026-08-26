import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkForUpdates, reloadOnServiceWorkerUpdate } from './swRefresh';

type Listener = () => void;

function stubEnvironment({ controller }: { controller: object | null }) {
  const listeners: Listener[] = [];
  const reload = vi.fn();
  vi.stubGlobal('navigator', {
    serviceWorker: {
      controller,
      addEventListener: (_type: string, fn: Listener) => listeners.push(fn),
    },
  });
  vi.stubGlobal('window', { location: { reload } });
  return { fireControllerChange: () => listeners.forEach((fn) => fn()), reload, listeners };
}

afterEach(() => vi.unstubAllGlobals());

describe('reloadOnServiceWorkerUpdate', () => {
  it('reloads when a new worker takes over from an existing one', () => {
    const { fireControllerChange, reload } = stubEnvironment({ controller: {} });
    reloadOnServiceWorkerUpdate();
    fireControllerChange();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores the first install, where there was no controller to replace', () => {
    // clientsClaim fires controllerchange on a first visit too. Reloading there
    // would refresh every new visitor for no reason.
    const { fireControllerChange, reload, listeners } = stubEnvironment({ controller: null });
    reloadOnServiceWorkerUpdate();
    expect(listeners).toHaveLength(0);
    fireControllerChange();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads at most once, so a repeated event cannot loop', () => {
    // The severe failure mode: a reload loop makes the app unusable.
    const { fireControllerChange, reload } = stubEnvironment({ controller: {} });
    reloadOnServiceWorkerUpdate();
    fireControllerChange();
    fireControllerChange();
    fireControllerChange();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does nothing where service workers are unsupported', () => {
    vi.stubGlobal('navigator', {});
    expect(() => reloadOnServiceWorkerUpdate()).not.toThrow();
  });
});

describe('checkForUpdates', () => {
  function stubRegistration() {
    const update = vi.fn().mockResolvedValue(undefined);
    const listeners: Record<string, (() => void)[]> = {};
    vi.stubGlobal('navigator', {
      serviceWorker: {
        controller: {},
        addEventListener: () => {},
        getRegistration: () => Promise.resolve({ update }),
      },
    });
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: (t: string, fn: () => void) => {
        (listeners[t] ??= []).push(fn);
      },
      removeEventListener: () => {},
    });
    return { update, fire: (t: string) => (listeners[t] ?? []).forEach((f) => f()) };
  }

  it('asks once as soon as the app starts', async () => {
    const { update } = stubRegistration();
    const stop = checkForUpdates();
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    stop();
  });

  it('asks again when the app becomes visible', async () => {
    // The case that matters on a phone: reopening an installed PWA resumes the
    // page instead of loading it, so nothing else would trigger a check.
    const { update, fire } = stubRegistration();
    const stop = checkForUpdates();
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    fire('visibilitychange');
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    stop();
  });

  it('keeps asking while the app stays open', async () => {
    vi.useFakeTimers();
    const { update } = stubRegistration();
    const stop = checkForUpdates();
    await vi.advanceTimersByTimeAsync(60_000 * 3);
    expect(update.mock.calls.length).toBeGreaterThanOrEqual(3);
    stop();
    vi.useRealTimers();
  });

  it('stops polling once torn down, so it cannot leak a timer', async () => {
    vi.useFakeTimers();
    const { update } = stubRegistration();
    const stop = checkForUpdates();
    await vi.advanceTimersByTimeAsync(60_000);
    const after = update.mock.calls.length;
    stop();
    await vi.advanceTimersByTimeAsync(60_000 * 5);
    expect(update.mock.calls.length).toBe(after);
    vi.useRealTimers();
  });

  it('does nothing where service workers are unsupported', () => {
    vi.stubGlobal('navigator', {});
    expect(() => checkForUpdates()()).not.toThrow();
  });
});
