import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeScreen } from '../screens/HomeScreen';
import { TracksScreen } from '../screens/TracksScreen';
import { TrackDetailScreen } from '../screens/TrackDetailScreen';
import { SheetDetailScreen } from '../screens/SheetDetailScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SheetsScreen } from '../screens/SheetsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SessionScreen } from '../screens/SessionScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';

/**
 * Hash routing on purpose: GitHub Pages has no SPA rewrite, and hash routes
 * survive a hard refresh with zero server-side hacks (docs/05-ARCHITECTURE.md).
 */
const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'tracks', element: <TracksScreen /> },
      { path: 'tracks/:trackId', element: <TrackDetailScreen /> },
      { path: 'review', element: <ReviewScreen /> },
      { path: 'sheets', element: <SheetsScreen /> },
      { path: 'sheets/:cardId', element: <SheetDetailScreen /> },
      { path: 'me', element: <ProfileScreen /> },
    ],
  },
  // The session is a full-screen flow on top of the shell — no tab bar while
  // you are answering (docs/01 §Screen map).
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/session', element: <SessionScreen /> },
  { path: '/session/summary', element: <SessionSummaryScreen /> },
  // Dev-only harness for driving each renderer in isolation. The dynamic
  // import keeps it out of the production bundle entirely.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/renderers',
          lazy: async () => ({
            Component: (await import('../dev/RendererHarness')).RendererHarness,
          }),
        },
      ]
    : []),
]);

export function App() {
  return <RouterProvider router={router} />;
}
