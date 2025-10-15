import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { FiGrid, FiFilm, FiTv, FiCode, FiSettings, FiLogOut, FiX } from 'react-icons/fi';
import { FaTv } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useApiStore } from '../../store/apiStore';
import { useHotkeys } from 'react-hotkeys-hook'
import type { Playlist, XtreamPlaylist } from '../../types/playlist';

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
  const { initializeApi } = useApiStore();

  const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  useHotkeys(['ctrl+alt+y', 'ctrl+alt+z'], () => setDevMode(!devMode));

  // 1. Fetch and filter for ONLY Xtream playlists
  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const allPlaylists = session.user.user_metadata.playlists as Playlist[];
      const xtream = allPlaylists.filter(p => p.type === 'xtream') as XtreamPlaylist[];
      setXtreamPlaylists(xtream);

      if (xtream.length > 0) {
        // You could use localStorage here too to remember the last selected
        setSelectedPlaylistId(xtream[0].id);
      }
    }
  }, [session]);

  // 2. Initialize the API whenever the selected playlist changes
  useEffect(() => {
    if (selectedPlaylistId) {
      const selected = xtreamPlaylists.find(p => p.id === selectedPlaylistId);
      if (selected) {
        initializeApi(selected);
      }
    }
  }, [selectedPlaylistId, xtreamPlaylists, initializeApi]);

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylistId(e.target.value);
  };

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex items-center space-x-8 w-full">
          <nav className="flex items-center space-x-4 w-full">
            {(devMode ? navItems : navItems.filter(item => item.path !== '/playground/dev')).map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3 py-2 rounded-md font-semibold text-sm transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
            
            {/* --- The New Playlist Dropdown --- */}
            <div className="ml-auto flex items-center space-x-4">
              {xtreamPlaylists.length > 1 && (
                <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">
                  {xtreamPlaylists.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              )}
              <Link to="/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700"><FiSettings size={24} /></Link>
              <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-700"><FiLogOut size={24} /></button>
              <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700"><FiX size={24} /></Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};