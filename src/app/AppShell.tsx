import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TabBar } from './TabBar';

export function AppShell() {
  const { pathname } = useLocation();

  // Each tab is its own screen, so start it at the top rather than mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
