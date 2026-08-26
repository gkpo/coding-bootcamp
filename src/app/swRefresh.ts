/**
 * Reload once when a new service worker takes over.
 *
 * The worker is cache-first, so a visit paints the cached bundle immediately
 * and only then fetches the new one. Without this, every deploy showed you the
 * previous version once and you had to refresh by hand to see the change.
 *
 * The guard matters more than the reload. `clientsClaim` also fires
 * `controllerchange` on the very first install, when there was no controller
 * at all. Reloading on that one would refresh every first-time visitor, and a
 * bug in the condition turns this into an infinite reload loop, so it checks
 * for an existing controller up front and only reacts to a genuine handover.
 */
export function reloadOnServiceWorkerUpdate(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // No controller yet means this page is the first install, not an update.
  const hadController = navigator.serviceWorker.controller !== null;
  if (!hadController) return;

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}
