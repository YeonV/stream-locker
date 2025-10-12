/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useStreamLock } from '../hooks/useStreamLock';
import { Link } from 'react-router-dom';
import parser from 'iptv-playlist-parser';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FiLogOut, FiMenu, FiRefreshCcw, FiSettings, FiStopCircle, FiX } from 'react-icons/fi';

// Import our new native video player plugin
import { playVideo } from 'tauri-plugin-videoplayer-api';

import Player from '../components/Player';
import ChannelList from '../components/ChannelList';
import logo from '../assets/logo.png';
import type { Playlist, XtreamPlaylist, Channel, GroupedChannels } from '../types/playlist';

// Helper function and hook to detect device orientation
const getOrientation = () => window.screen.orientation.type.split('-')[0];
const useOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return orientation;
};

function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

// --- START OF NEW SUB-COMPONENTS for layout splitting ---

// This component renders the new, TV-first landscape layout for the APK
const ApkLandscapeLayout = (props: any) => {
  const {
    availablePlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleLogout, handleReload, stopAndRelease, lockStatus
  } = props;

  const getPlayerStatusMessage = () => {
    switch (lockStatus) {
      case 'LOCKED_BY_OTHER':
        return 'Streaming on another device.';
      case 'AVAILABLE':
        return 'Select a channel to play.';
      case 'REQUESTING':
        return 'Requesting stream lock...';
      case 'ACQUIRED':
        return 'Playing stream natively...';
      default:
        return `Status: ${lockStatus}`;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* --- Top Bar (Primary Controls) --- */}
      <header className="flex justify-between items-center px-4 pt-4 pb-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" />
          <h1 className="text-xl font-bold">Stream Locker</h1>
        </div>
        <div className="flex-1 flex justify-center px-8">
          {availablePlaylists.length > 0 && (
            <select
              value={selectedPlaylistId || ''}
              onChange={handlePlaylistChange}
              className="w-full max-w-xs px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
            >
              {availablePlaylists.map((p: Playlist) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={stopAndRelease} title="Stop Stream" className={`p-2 rounded-full hover:bg-gray-700 ${lockStatus !== 'ACQUIRED' ? 'text-gray-600' : 'text-yellow-400'}`} disabled={lockStatus !== 'ACQUIRED'}>
            <FiStopCircle size={24} />
          </button>
          <button onClick={handleReload} title="Reload" className="p-2 rounded-full hover:bg-gray-700">
            <FiRefreshCcw size={24} />
          </button>
          <Link to="/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700">
            <FiSettings size={24} />
          </Link>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-700">
            <FiLogOut size={24} />
          </button>
        </div>
      </header>

      {/* --- Second Bar (Contextual Controls & Status) --- */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-700 rounded-md p-1">
            <button onClick={() => setViewMode('grouped')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600' : ''}`}>Grouped</button>
            <button onClick={() => setViewMode('flat')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600' : ''}`}>Flat</button>
          </div>
          {viewMode === 'flat' && (
            <input
              type="text"
              placeholder="🔎 Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 text-white bg-gray-700 border border-gray-600 rounded-md text-sm"
            />
          )}
        </div>
        <p className="text-sm text-gray-400">{getPlayerStatusMessage()}</p>
      </div>

      {/* --- Main Content (Channel Browser) --- */}
      <div className="flex-1 overflow-y-hidden">
        {isLoading && <p className="p-4">Loading playlist...</p>}
        {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
        {!isLoading && !error && (
          <>
            {viewMode === 'grouped' && <ChannelList groupedChannels={groupedChannels} onChannelClick={handleChannelClick} />}
            {viewMode === 'flat' && (
              <div className="h-full">
                <AutoSizer>
                  {({ height, width }) => (
                    <VirtualList
                      width={width}
                      height={height}
                      itemCount={filteredChannels.length}
                      itemSize={44}
                      renderItem={({ index, style }) => {
                        const channel = filteredChannels[index];
                        return (
                          <div key={channel.url + index} style={style}>
                            <button onClick={() => handleChannelClick(channel.url)} className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11">
                              {(channel.logo && channel.logo !== '') ?
                                <img src={channel.logo} alt="" className="w-8 h-8 object-contain rounded-sm bg-gray-700" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                : <div className="w-8 h-8 bg-gray-700 rounded-sm flex items-center justify-center text-xs text-gray-400">N/A</div>}
                              <span className="flex-1 truncate">{channel.name}</span>
                            </button>
                          </div>
                        );
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// This component renders the original layout for Web and Desktop
const WebAndApkPortraitLayout = (props: any) => {
  const {
    apk, isSidebarOpen, setIsSidebarOpen,
    availablePlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleLogout, handleReload, stopAndRelease, lockStatus
  } = props;

  return (
    <div className={`relative h-screen w-screen bg-gray-900 text-white overflow-hidden md:flex `}>
      <aside className={`absolute top-0 left-0 h-full w-64 bg-gray-800 flex flex-col z-40 transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:static md:translate-x-0`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-xl font-bold">Playlists</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><FiX size={24} /></button>
          </div>
          {availablePlaylists.length > 0 ? (
            <select value={selectedPlaylistId || ''} onChange={handlePlaylistChange} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md">
              {availablePlaylists.map((p: Playlist) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          ) : (<p className="text-sm text-gray-400">No playlists found.</p>)}
        </div>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-2">Channels</h2>
          <div className="flex bg-gray-700 rounded-md p-1 mb-4">
            <button onClick={() => setViewMode('grouped')} className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>Grouped</button>
            <button onClick={() => setViewMode('flat')} className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>Flat</button>
          </div>
          {viewMode === 'flat' && <input type="text" placeholder="🔎 Search channels..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" />}
        </div>
        <div className="flex-1 overflow-y-hidden">
          {isLoading && <p className="p-4">Loading playlist...</p>}
          {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
          {!isLoading && !error && (
            <>
              {viewMode === 'grouped' && <ChannelList groupedChannels={groupedChannels} onChannelClick={handleChannelClick} />}
              {viewMode === 'flat' && (
                <div className="h-full">
                  <AutoSizer>
                    {({ height, width }) => (
                      <VirtualList
                        width={width}
                        height={height}
                        itemCount={filteredChannels.length}
                        itemSize={44}
                        renderItem={({ index, style }) => {
                          const channel = filteredChannels[index];
                          return (
                            <div key={channel.url + index} style={style}>
                              <button onClick={() => handleChannelClick(channel.url)} className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11">
                                {(channel.logo && channel.logo !== '') ? <img src={channel.logo} alt="" className="w-8 h-8 object-contain rounded-sm bg-gray-700" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <div className="w-8 h-8 bg-gray-700 rounded-sm flex items-center justify-center text-xs text-gray-400">N/A</div>}
                                <span className="flex-1 truncate">{channel.name}</span>
                              </button>
                            </div>
                          );
                        }}
                      />
                    )}
                  </AutoSizer>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full">
        <header className={`flex justify-between items-center ${apk ? 'px-4 pt-6 pb-2' : 'p-4'} bg-gray-800 border-b border-gray-700 shrink-0`}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><FiMenu size={24} /></button>
            <img src={logo} alt="Logo" className={`${apk ? 'w-8 h-8' : 'w-12 h-12'} rounded-full`} />
            <div><h1 className="text-xl font-bold">Stream Locker</h1></div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/download"><button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Download App</button></Link>
            <button onClick={stopAndRelease} className={`px-4 py-2 font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 ${lockStatus !== 'ACQUIRED' ? 'hidden' : ''}`}>Stop Stream</button>
            <Link to="/settings"><button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"><FiSettings size={24} className='mr-2' />Settings</button></Link>
            <button onClick={handleReload} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"><FiRefreshCcw size={24} className='mr-2' />Reload</button>
            <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"><FiLogOut size={24} className='mr-2' />Logout</button>
          </div>
        </header>
        <div className="flex-1 p-4 max-h-[calc(100vh-145px)] md:max-h-[calc(100vh-81px)]"><Player /></div>
        <nav className={`md:hidden fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 flex justify-around items-center ${apk ? 'pb-2' : ''} h-16`}>
          <Link to="/settings" className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiSettings size={24} /><span className="text-xs mt-1">Settings</span></Link>
          <button onClick={stopAndRelease} className={`flex flex-col items-center justify-center text-yellow-400 hover:text-yellow-300 ${lockStatus !== 'ACQUIRED' ? 'hidden' : 'flex'}`}><FiStopCircle size={24} /><span className="text-xs mt-1">Stop</span></button>
          <button onClick={handleReload} className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiRefreshCcw size={24} /><span className="text-xs mt-1">Reload</span></button>
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-gray-400 hover:text-white"><FiLogOut size={24} /><span className="text-xs mt-1">Logout</span></button>
        </nav>
        {isSidebarOpen && (<div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black opacity-50 z-30"></div>)}
      </main>
    </div>
  );
};


// --- The main DashboardPage component that decides which layout to render ---

const DashboardPage = () => {
  const { session } = useAuthStore();
  const { lockStatus } = usePlayerStore();
  const { requestLock, stopAndRelease } = useStreamLock();
  
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null); 
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groupedChannels, setGroupedChannels] = useState<GroupedChannels>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('flat');
  const [searchTerm, setSearchTerm] = useState('');
  const apk = !!import.meta.env.VITE_APK;
  const orientation = useOrientation();

  // --- All the data fetching and state logic remains the same ---

  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const userPlaylists = session.user.user_metadata.playlists as Playlist[];
      setAvailablePlaylists(userPlaylists);
      if (userPlaylists.length > 0) {
        const lastSelectedId = localStorage.getItem('lastSelectedPlaylistId');
        const isValid = userPlaylists.some(p => p.id === lastSelectedId);
        setSelectedPlaylistId(isValid ? lastSelectedId : userPlaylists[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    } else {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const fetchAndParsePlaylist = async () => {
      if (!selectedPlaylistId) {
        setChannels([]); setGroupedChannels({}); setIsLoading(false); setError("No playlist selected."); return;
      }
      const selectedPlaylist = availablePlaylists.find(p => p.id === selectedPlaylistId);
      if (!selectedPlaylist) {
        setChannels([]); setGroupedChannels({}); setIsLoading(false); setError("Selected playlist not found."); return;
      }
      const m3uUrlToFetch: string | null = isXtreamPlaylist(selectedPlaylist) ? `${selectedPlaylist.serverUrl}/get.php?username=${selectedPlaylist.username}&password=${selectedPlaylist.password || ''}&type=m3u_plus&output=ts` : selectedPlaylist.url;
      if (!m3uUrlToFetch) { setError("Could not determine the M3U URL for this playlist."); return; }
      setIsLoading(true); setError(null); setChannels([]); setGroupedChannels({});
      try {
        const response = await fetch(m3uUrlToFetch);
        if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        const playlistText = await response.text();
        const result = parser.parse(playlistText);
        const formattedChannels = result.items.map(item => ({ name: item.name, url: item.url, logo: item.tvg.logo, group: item.group.title }));
        const grouped = formattedChannels.reduce((acc: GroupedChannels, channel) => {
          const groupName = channel.group || 'Uncategorized';
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(channel);
          return acc;
        }, {});
        setChannels(formattedChannels);
        setGroupedChannels(grouped);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to parse playlist: ${errorMessage}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParsePlaylist();
  }, [selectedPlaylistId, availablePlaylists]);

  const filteredChannels = useMemo(() => {
    if (!searchTerm) return channels;
    return channels.filter(channel => channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, channels]); 

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedPlaylistId(newId);
    localStorage.setItem('lastSelectedPlaylistId', newId);
  };

  const handleLogout = () => supabase.auth.signOut();
  const handleReload = () => window.location.reload();

  const handleChannelClick = (channelUrl: string) => {
    if (lockStatus === 'ACQUIRED') {
      usePlayerStore.getState().playStream(channelUrl);
    } else if (lockStatus === 'AVAILABLE') {
      requestLock();
      sessionStorage.setItem('nextStreamUrl', channelUrl);
    } else {
      alert(`Cannot play channel, lock status is: ${lockStatus}`);
    }
  };

  useEffect(() => {
    if (lockStatus === 'ACQUIRED') {
      const nextUrl = sessionStorage.getItem('nextStreamUrl');
      if (nextUrl) {
        if (apk) {
          playVideo(nextUrl);
          // Don't set the store URL on APK, just remove the temporary item
          sessionStorage.removeItem('nextStreamUrl');
          // Release the lock immediately so another device can grab it,
          // as the native player is fire-and-forget.
          stopAndRelease();
        } else {
          usePlayerStore.getState().playStream(nextUrl);
          sessionStorage.removeItem('nextStreamUrl');
        }
      }
    }
  }, [lockStatus, apk, stopAndRelease]);

  const props = {
    apk, isSidebarOpen, setIsSidebarOpen,
    availablePlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleLogout, handleReload, stopAndRelease, lockStatus,
  };

  // --- The main render logic ---
  if (apk && orientation === 'landscape') {
    return <ApkLandscapeLayout {...props} />;
  }

  // Use the same original layout for Web, Desktop, and APK Portrait mode
  return <WebAndApkPortraitLayout {...props} />;
};

export default DashboardPage;