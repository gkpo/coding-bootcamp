import { NavLink } from 'react-router-dom';
import type { ComponentType } from 'react';
import { HomeIcon, TracksIcon, ReviewIcon, SheetsIcon, MeIcon } from '../components/icons';
import './TabBar.css';

type Tab = { to: string; label: string; Icon: ComponentType<{ size?: number }> };

const TABS: Tab[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/tracks', label: 'Tracks', Icon: TracksIcon },
  { to: '/review', label: 'Review', Icon: ReviewIcon },
  { to: '/sheets', label: 'Sheets', Icon: SheetsIcon },
  { to: '/me', label: 'Me', Icon: MeIcon },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => (isActive ? 'tabbar__item is-active' : 'tabbar__item')}
        >
          <Icon />
          <span className="tabbar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
