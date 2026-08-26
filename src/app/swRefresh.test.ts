import { afterEach, describe, expect, it, vi } from 'vitest';
import { reloadOnServiceWorkerUpdate } from './swRefresh';

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
