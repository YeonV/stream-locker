import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiGrid, FiFilm, FiTv, FiCode, FiSettings, FiX, FiLogOut } from 'react-icons/fi';
import { FaTv, FaThList } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useApiStore } from '../../store/apiStore';
import { useHotkeys } from 'react-hotkeys-hook'
import type { Playlist, XtreamPlaylist } from '../../types/playlist';
import { useShallow } from 'zustand/react/shallow';
import { useDebugStore } from '../../store/debugStore';
import { CgDebug } from "react-icons/cg";
import { useEnvStore } from '../../store/envStore';
import { supabase } from '../../lib/supabase';
import { SmartStopButton } from '../../components/SmartStopButton';
import DownloadAndroid from '../../components/Download/DownloadAndroid';
import Footer from './components/Footer';
import { useFooterStore } from '../../store/footerStore';
import { useUiContextStore } from '../../store/uiContextStore';

// Type definition for a single nav item
type NavItem = { path: string; label: string; Icon: React.ElementType };

// Type definition for the structured nav items array
type NavStructure =
  | { type: 'group'; items: [NavItem, NavItem] }
  | { type: 'single'; item: NavItem };

const navItems: NavStructure[] = [
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

const flatNavItems: NavItem[] = navItems.flatMap(nav => {
  if (nav.type === 'group') {
    return nav.items;
  }
  return [nav.item];
});

// Flattened list for the mobile nav, which doesn't have the toggle logic
const mobileNavItems = [
  { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
  { path: '/playground/series', label: 'Series', Icon: FiTv },
  { path: '/playground/livetv', label: 'LiveTV', Icon: FaTv },
  { path: '/playground/general', label: 'General', Icon: FiGrid },
]

export const PlaygroundLayout = () => {
  const { session } = useAuthStore();
  const { toggleConsole } = useDebugStore();
  const { initializeApi, clearApi } = useApiStore(useShallow(state => ({
    initializeApi: state.initializeApi,
    clearApi: state.clearApi,
  })));

  const setPlay = useFooterStore(state => state.setPlay);
  const setRewind = useFooterStore(state => state.setRewind);
  const setForward = useFooterStore(state => state.setForward);
  const focusedCoordinate = useUiContextStore(state => state.focusedCoordinate);

  const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  useHotkeys(['ctrl+alt+y', 'ctrl+alt+z'], () => setDevMode(!devMode));

  useHotkeys('ArrowDown', (e) => {
    const isFocusInHeader = (document.activeElement?.closest('#main-nav') !== null);
    if (isFocusInHeader) {
      e.preventDefault();
      const mainContent = document.querySelector('main');

      // First, try to find stream-row elements
      const firstRow = mainContent?.querySelector('[data-testid="stream-row"]');
      const firstFocusableElementInRow = firstRow?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElementInRow) {
        firstFocusableElementInRow.focus();
      } else {
        // Fall back to general focusable elements
        const firstFocusableElement = mainContent?.querySelector(
          'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }
    }
  }, {
    enableOnFormTags: true,
    enabled: focusedCoordinate === null
  });

  // useHotkeys('MediaFastForward', (e) => {
  //       e.preventDefault();
  //       const mainContent = document.querySelector('main');
  //       const firstFocusableElement = mainContent?.querySelector(
  //         'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  //       ) as HTMLElement;

  //       if (firstFocusableElement) {
  //         firstFocusableElement.focus();
  //       }

  //   }, {
  //     enableOnFormTags: true
  // });

  // useHotkeys('MediaRewind', (e) => {
  //       e.preventDefault();
  //       const header = document.querySelector('#main-nav');
  //       const firstFocusableElement = header?.querySelector(
  //         'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  //       ) as HTMLElement;

  //       if (firstFocusableElement) {
  //         firstFocusableElement.focus();
  //       }

  //   }, {
  //     enableOnFormTags: true
  // });

  useEffect(() => {
    setPlay('Toggle Focus');
    setRewind('');
    setForward('');
  }, [setPlay, setRewind, setForward]);

  useHotkeys('MediaPlayPause', (e) => {
    e.preventDefault();
    const header = document.querySelector('#main-nav');
    const mainContent = document.querySelector('main');
    // Determine where the focus currently is
    const isFocusInHeader = (document.activeElement?.closest('#main-nav') !== null);

    if (isFocusInHeader) {
      // Move focus to main content
      const firstFocusableElement = mainContent?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    } else {
      // Move focus to header
      const firstFocusableElement = header?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, {
    enableOnFormTags: true
  });


  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const allPlaylists = session.user.user_metadata.playlists as Playlist[];
      const xtream = allPlaylists.filter(p => p.type === 'xtream') as XtreamPlaylist[];
      setXtreamPlaylists(xtream);
      if (xtream.length > 0) {
        setSelectedPlaylistId(xtream[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    }
  }, [session]);

  useEffect(() => {
    if (selectedPlaylistId) {
      const selected = xtreamPlaylists.find(p => p.id === selectedPlaylistId);
      if (selected) {
        initializeApi(selected);
      }
    }
  }, [selectedPlaylistId, xtreamPlaylists, initializeApi]);

  useEffect(() => {
    return () => {
      clearApi();
    };
  }, [clearApi]);

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylistId(e.target.value);
  };
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isSettings = pathname === '/playground/settings'
  const device = useEnvStore(state => state.device);
  const handleLogout = () => supabase.auth.signOut();
  const isMoviesSection = pathname.startsWith('/playground/movies');
  const isSeriesSection = pathname.startsWith('/playground/series');

  const handleViewSwitch = () => {
    if (device === 'firetv') return;
    if (isMoviesSection) {
      if (pathname === '/playground/movies') {
        navigate('/playground/movies-categories');
      } else {
        navigate('/playground/movies');
      }
    } else if (isSeriesSection) {
      if (pathname === '/playground/series') {
        navigate('/playground/series-categories');
      } else {
        navigate('/playground/series');
      }
    }
  }

  return (
    <div className="h-screen w-screen bg-background-primary text-text-primary flex flex-col">
      <header className={`flex items-center justify-between ${device === 'android' ? 'pt-8' : 'pt-2'} pb-2 px-4 border-b border-border-primary bg-background-secondary/80 backdrop-blur-sm flex-shrink-0 z-10`}>
        <div className="flex items-center space-x-8 w-full">
          <div id="main-nav" className="flex items-center space-x-1 w-full">
            {isSettings && <h1 className="text-xl font-bold">Settings</h1>}
            {!isSettings && device === 'firetv'
              ? flatNavItems.map((nav, index) => <NavLink
                key={index}
                to={nav.path}
                className={({ isActive }) =>
                  `max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                  }`
                }
              >
                <nav.Icon size={16} />
                <span>{nav.path === '/playground/movies-categories' ? 'M-Cat' : nav.path === '/playground/series-categories' ? 'S-Cat' : nav.label}</span>
              </NavLink>)
              : (isSettings || !(xtreamPlaylists.length > 0) ? [] : devMode ? navItems : navItems.filter(nav => nav.type !== 'single' || nav.item.path !== '/playground/dev')).map((nav, index) => {


                if (nav.type === 'group') {
                  const isMoviesGroup = nav.items[0].path.startsWith('/playground/movies');
                  const isSeriesGroup = nav.items[0].path.startsWith('/playground/series');
                  const linkToRender = pathname === nav.items[0].path ? nav.items[1] : nav.items[0];
                  const { path, label, Icon } = linkToRender;
                  const isGroupActive = (isMoviesSection && isMoviesGroup) || (isSeriesSection && isSeriesGroup);

                  return (
                    <NavLink
                      key={index}
                      to={path}
                      className={`max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isGroupActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                      {isGroupActive && <div className="ml-2 p-1 px-2 bg-background-primary rounded-md flex" title="Switch View">
                        <FiGrid size={16} className={`mr-1 ${pathname.includes('categories') ? 'text-text-secondary' : 'text-primary'}`} />
                        <FaThList size={16} className={`${pathname.includes('categories') ? 'text-primary' : 'text-text-secondary'}`} />
                      </div>}
                    </NavLink>
                  )
                }

                // TypeScript now knows nav.item is guaranteed to exist here
                const { path, label, Icon } = nav.item;
                return (
                  <NavLink
                    key={index}
                    to={path}
                    className={({ isActive }) =>
                      `max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${isActive ? 'text-text-primary border-b-1 border-primary rounded-none' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                );
              })}

            {(isMoviesSection || isSeriesSection) && <div className="ml-2 p-1 px-2 bg-background-primary rounded-md flex min-md:hidden landscape:hidden" title="Switch View" onClick={() => handleViewSwitch()}>
              <FiGrid size={16} className={`mr-1 ${pathname.includes('categories') ? 'text-text-secondary' : 'text-primary'}`} />
              <FaThList size={16} className={`${pathname.includes('categories') ? 'text-primary' : 'text-text-secondary'}`} />
            </div>}
            <div className="ml-auto flex items-center space-x-4">
              {xtreamPlaylists.length > 1 && !isSettings && (
                <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md">
                  {xtreamPlaylists.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              )}

              {(device === 'android' || device === 'firetv' || device === 'androidtv') && <DownloadAndroid />}
              {import.meta.env.PROD && <button onClick={toggleConsole} title="toggleConsole" className="cursor-pointer p-2 rounded-full hover:bg-background-glass"><CgDebug size={24} /></button>}
              <SmartStopButton />
              {!isSettings && <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-background-glass"><FiSettings size={24} /></Link>}
              {isSettings && <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-background-glass"><FiLogOut size={24} /></button>}
              {!isSettings && <Link to="/dashboard" className="p-2 rounded-full hover:bg-background-glass"><FiX size={24} /></Link>}
              {isSettings && <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-background-glass"><FiX size={24} /></button>}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      {device === 'firetv' && <Footer />}
      {device !== 'firetv' && <div className={`flex justify-around items-center py-1 ${device === 'android' ? 'pb-3' : ''} bg-background-secondary border-t border-border-primary min-md:hidden landscape:hidden`}>
        {mobileNavItems.map(({ path, label, Icon }) => {
          // This is the new logic. For 'Movies' and 'Series', we check if the pathname starts with their base path.
          // For all others, we use the default strict 'isActive' check.
          const isSectionActive = (path === '/playground/movies' && pathname.startsWith('/playground/movies')) ||
            (path === '/playground/series' && pathname.startsWith('/playground/series')) ||
            (pathname === path); // Fallback for LiveTV and General

          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-md font-semibold text-sm transition-colors ${isSectionActive ? 'text-primary' : 'text-text-secondary hover:bg-background-glass hover:text-text-primary'
                }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>}
    </div>
  );
};