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
import { CapstoneScreen } from '../screens/CapstoneScreen';

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
  // The session is a full-screen flow on top of the shell, no tab bar while
  // you are answering (docs/01 §Screen map).
  { path: '/onboarding', element: <OnboardingScreen /> },
  { path: '/session', element: <SessionScreen /> },
  // A capstone is the same kind of flow: full screen, no tab bar, and it asks
  // before it lets you walk away from a half-built system (docs/12 part C).
  { path: '/capstone/:capstoneId', element: <CapstoneScreen /> },
  { path: '/session/summary', element: <SessionSummaryScreen /> },
  // A studio for choosing cues by ear. Unlike the harness below it ships in
  // production on purpose, because the point is to hear candidates through a
  // phone speaker on the deployed site. Linked from nowhere and lazily
  // imported, so it costs the app nothing until the route is typed.
  //
  // Every cue is now chosen; this is kept to revisit them. It must come out
  // before any public release, and is a release blocker in docs/07-ROADMAP.md.
  {
    path: '/sound',
    lazy: async () => ({ Component: (await import('../dev/SoundStudio')).SoundStudio }),
  },
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
