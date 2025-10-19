import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiGrid, FiFilm, FiTv, FiCode, FiSettings, FiX } from 'react-icons/fi';
import { FaTv } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useApiStore } from '../../store/apiStore';
import { useHotkeys } from 'react-hotkeys-hook'
import type { Playlist, XtreamPlaylist } from '../../types/playlist';
import { useShallow } from 'zustand/react/shallow';
import { useDebugStore } from '../../store/debugStore';
import { CgDebug } from "react-icons/cg";

const navItems = [
  { path: '/playground/movies', label: 'Movies', Icon: FiFilm },
  { path: '/playground/series', label: 'Series', Icon: FiTv },
  { path: '/playground/livetv', label: 'Live TV', Icon: FaTv },
  { path: '/playground/movies-categories', label: 'Movie Cat', Icon: FiFilm },
  { path: '/playground/series-categories', label: 'Series Cat', Icon: FiTv },
  { path: '/playground/general', label: 'General', Icon: FiGrid },
  { path: '/playground/dev', label: 'Dev', Icon: FiCode }
];

export const PlaygroundLayout = () => {
  const { session } = useAuthStore();
  // We only get the functions from the store, as they are stable.
  const { initializeApi, clearApi } = useApiStore(useShallow(state => ({
    initializeApi: state.initializeApi,
    clearApi: state.clearApi,
  })));

  // Your local state for driving the UI. This is the correct pattern.
  const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  
  const [devMode, setDevMode] = useState(false);
  const apk = !!import.meta.env.VITE_APK;

  const { toggleConsole } = useDebugStore();
  useHotkeys(['ctrl+alt+y', 'ctrl+alt+z'], () => setDevMode(!devMode));

  
  // --- HOOK 1: Sync Session to Local State (Your Code - Unchanged) ---
  // Derives this component's local state from the global session.
  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const allPlaylists = session.user.user_metadata.playlists as Playlist[];
      const xtream = allPlaylists.filter(p => p.type === 'xtream') as XtreamPlaylist[];
      setXtreamPlaylists(xtream);

      // Your Rule: Always default to the first playlist found.
      if (xtream.length > 0) {
        setSelectedPlaylistId(xtream[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    }
  }, [session]);

  // --- HOOK 2: React to Local State Changes (Your Code, but without cleanup) ---
  // Calls the API when the selected playlist changes.
  useEffect(() => {
    if (selectedPlaylistId) {
      const selected = xtreamPlaylists.find(p => p.id === selectedPlaylistId);
      if (selected) {
        initializeApi(selected);
      }
    }
    // NO cleanup function here. This prevents the "API flicker" when state changes.
  }, [selectedPlaylistId, xtreamPlaylists, initializeApi]);

  // --- HOOK 3: The Unmount Cleanup (The small but critical fix) ---
  // This hook's only purpose is to clean up when the user leaves the Playground.
  // Its cleanup function will run only ONCE when the component unmounts.
  useEffect(() => {
    return () => {
      clearApi();
    };
  }, [clearApi]);

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // This correctly updates the local state, which triggers Hook 2.
    setSelectedPlaylistId(e.target.value);
  };
  const { pathname} = useLocation();
  const isSettings = pathname === '/playground/settings'

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col">
      <header className={`flex items-center justify-between ${apk ? 'pt-8' : 'pt-2'} pb-2 px-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm flex-shrink-0 z-10`}>
        <div className="flex items-center space-x-8 w-full">
          <nav className="flex items-center space-x-1 w-full">
            {(isSettings || !(xtreamPlaylists.length > 0) ? [] : devMode ? navItems : navItems.filter(item => item.path !== '/playground/dev')).map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 pl-3 pr-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    isActive ? 'text-white border-b-1 border-white rounded-none' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
            
            <div className="ml-auto flex items-center space-x-4">
              {xtreamPlaylists.length > 1 && (
                <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">
                  {xtreamPlaylists.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              )}

              {import.meta.env.PROD && <button onClick={toggleConsole} title="toggleConsole" className="cursor-pointer p-2 rounded-full hover:bg-gray-700"><CgDebug size={24} /></button>}
              {!isSettings && <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700"><FiSettings size={24} /></Link>}
              <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700"><FiX size={24} /></Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};