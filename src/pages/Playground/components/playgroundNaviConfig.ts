
import { FiGrid, FiFilm, FiTv, FiCode } from 'react-icons/fi';
import { FaTv } from 'react-icons/fa';

// Type definition for a single nav item
export type NavItem = { path: string; label: string; Icon: React.ElementType };

// Type definition for the structured nav items array
export type NavStructure =
  | { type: 'group'; items: [NavItem, NavItem] }
  | { type: 'single'; item: NavItem };

export const navItems: NavStructure[] = [
  {
    type: 'group', items: [
      { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
      { path: '/playground/movies-categories', label: 'Movies', Icon: FiFilm },
    ]
  },
  {
    type: 'group', items: [
      { path: '/playground/series', label: 'Series', Icon: FiTv },
      { path: '/playground/series-categories', label: 'Series', Icon: FiTv },
    ]
  },
  { type: 'single', item: { path: '/playground/livetv', label: 'LiveTV', Icon: FaTv } },
  { type: 'single', item: { path: '/playground/general', label: 'General', Icon: FiGrid } },
  { type: 'single', item: { path: '/playground/dev', label: 'Dev', Icon: FiCode } },
];

export const flatNavItems: NavItem[] = navItems.flatMap(nav => {
  if (nav.type === 'group') {
    return nav.items;
  }
  return [nav.item];
});

// Flattened list for the mobile nav, which doesn't have the toggle logic
export const mobileNavItems = [
  { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
  { path: '/playground/series', label: 'Series', Icon: FiTv },
  { path: '/playground/livetv', label: 'LiveTV', Icon: FaTv },
  { path: '/playground/general', label: 'General', Icon: FiGrid },
]