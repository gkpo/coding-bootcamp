import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TabBar } from './TabBar';
import { useStore } from '../store/useStore';

export function AppShell() {
  const { pathname } = useLocation();
  const onboarded = useStore((s) => s.onboarded);
  const reduceMotion = useStore((s) => s.settings.reduceMotion);

  // The in-app toggle sits alongside prefers-reduced-motion; the stylesheet
  // honours either (docs/06 §Motion).
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
  }, [reduceMotion]);

  // Each tab is its own screen, so start it at the top rather than mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!onboarded) return <Navigate to="/onboarding" replace />;

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
