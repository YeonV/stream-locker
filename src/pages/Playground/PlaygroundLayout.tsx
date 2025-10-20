import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
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

// Type definition for a single nav item
type NavItem = { path: string; label: string; Icon: React.ElementType };

// Type definition for the structured nav items array
type NavStructure = 
  | { type: 'group'; items: [NavItem, NavItem] }
  | { type: 'single'; item: NavItem };

const navItems: NavStructure[] = [
  { type: 'group', items: [
      { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
      { path: '/playground/movies-categories', label: 'Movies', Icon: FiFilm },
  ]},
  { type: 'group', items: [
      { path: '/playground/series', label: 'Series', Icon: FiTv },
      { path: '/playground/series-categories', label: 'Series', Icon: FiTv },
  ]},
  { type: 'single', item: { path: '/playground/livetv', label: 'LiveTV', Icon: FaTv }},
  { type: 'single', item: { path: '/playground/general', label: 'General', Icon: FiGrid }},
  { type: 'single', item: { path: '/playground/dev', label: 'Dev', Icon: FiCode }},
];

// Flattened list for the mobile nav, which doesn't have the toggle logic
const mobileNavItems = [
  { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
  { path: '/playground/series', label: 'Series', Icon: FiTv },
  { path: '/playground/livetv', label: 'LiveTV', Icon: FaTv },
  { path: '/playground/general', label: 'General', Icon: FiGrid },
]

export const PlaygroundLayout = () => {
  const { session } = useAuthStore();
  const { initializeApi, clearApi } = useApiStore(useShallow(state => ({
    initializeApi: state.initializeApi,
    clearApi: state.clearApi,
  })));

  const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const apk = !!import.meta.env.VITE_APK;

  const { toggleConsole } = useDebugStore();
  useHotkeys(['ctrl+alt+y', 'ctrl+alt+z'], () => setDevMode(!devMode));

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
  const isSettings = pathname === '/playground/settings'
  const device = useEnvStore(state => state.device);
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col">
      <header className={`flex items-center justify-between ${apk ? 'pt-8' : 'pt-2'} pb-2 px-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm flex-shrink-0 z-10`}>
        <div className="flex items-center space-x-8 w-full">
          <nav className="flex items-center space-x-1 w-full ">
            {isSettings && <h1 className="text-xl font-bold">Settings</h1>}
            
            {(isSettings || !(xtreamPlaylists.length > 0) ? [] : devMode ? navItems : navItems.filter(nav => nav.type !== 'single' || nav.item.path !== '/playground/dev')).map((nav, index) => {
              const isMoviesSection = pathname.startsWith('/playground/movies');
              const isSeriesSection = pathname.startsWith('/playground/series');
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
                    className={`max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                        isGroupActive ? 'text-white border-b-1 border-white rounded-none' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                    {isGroupActive && <div className="ml-2 p-1 bg-gray-600 rounded-md flex" title="Switch View">
                      <FiGrid size={16} className={`mr-1 ${pathname.includes('categories') ? 'text-gray-400' : 'text-white' }`} />
                      <FaThList size={16} className={`${pathname.includes('categories') ? 'text-white' : 'text-gray-400' }`} />
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
                      `max-md:portrait:hidden flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                        isActive ? 'text-white border-b-1 border-white rounded-none' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
              );
            })}
            
            <div className="ml-auto flex items-center space-x-4">
              {xtreamPlaylists.length > 1 && !isSettings && (
                <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">
                  {xtreamPlaylists.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              )}
              {import.meta.env.PROD && <button onClick={toggleConsole} title="toggleConsole" className="cursor-pointer p-2 rounded-full hover:bg-gray-700"><CgDebug size={24} /></button>}
              {!isSettings && <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700"><FiSettings size={24} /></Link>}
              {isSettings && <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-700"><FiLogOut size={24} /></button>}
              {!isSettings && <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700"><FiX size={24} /></Link>}
              {isSettings && <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-700"><FiX size={24} /></button>}
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <div className={`flex justify-around items-center py-1 ${device === 'android' ? 'pb-3' : ''} bg-gray-800 border-t border-gray-700 min-md:hidden landscape:hidden`}>
        {mobileNavItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-md font-semibold text-sm transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};