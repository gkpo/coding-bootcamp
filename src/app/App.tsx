import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeScreen } from '../screens/HomeScreen';
import { TracksScreen } from '../screens/TracksScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SheetsScreen } from '../screens/SheetsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

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
      { path: 'review', element: <ReviewScreen /> },
      { path: 'sheets', element: <SheetsScreen /> },
      { path: 'me', element: <ProfileScreen /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
