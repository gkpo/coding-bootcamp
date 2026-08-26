/**
 * Keep the running app on the latest deployed build.
 *
 * Two halves, and the app needs both. Reacting to an update is not enough on
 * its own: the browser only checks for a new worker when the page registers
 * one, which happens on a full load. Resume the app from the home screen and
 * no load happens, so no check happens, and it can sit on an old build
 * indefinitely. So this also *asks*.
 */

/** While the app is open and visible, ask this often. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Reload once when a new worker takes over.
 *
 * The guard matters more than the reload. `clientsClaim` also fires
 * `controllerchange` on the very first install, when there was no controller
 * at all. Reloading on that would refresh every first-time visitor, and a bug
 * in the condition turns this into an infinite reload loop, so it checks for
 * an existing controller up front and only reacts to a genuine handover.
 */
export function reloadOnServiceWorkerUpdate(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // No controller yet means this page is the first install, not an update.
  if (navigator.serviceWorker.controller === null) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

/**
 * Ask the browser whether a newer worker exists: on start, whenever the app
 * becomes visible again, and periodically while it stays visible.
 *
 * The visibility check is the one that matters on a phone. Reopening an
 * installed PWA usually resumes the existing page rather than loading it
 * afresh, so without this there is no moment at which an update is noticed.
 */
export function checkForUpdates(): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  let timer: ReturnType<typeof setInterval> | undefined;

  const check = () => {
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.update())
      // Offline, or the worker is gone. Nothing to do and nothing to report.
      .catch(() => {});
  };

  const start = () => {
    if (timer !== undefined) return;
    timer = setInterval(check, CHECK_INTERVAL_MS);
  };
  const stop = () => {
    if (timer === undefined) return;
    clearInterval(timer);
    timer = undefined;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      check();
      start();
    } else {
      // No point polling a backgrounded tab; the visibility change on return
      // triggers a check anyway.
      stop();
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  check();
  if (document.visibilityState === 'visible') start();

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    stop();
  };
}
