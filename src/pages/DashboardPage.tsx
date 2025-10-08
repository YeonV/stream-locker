import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useStreamLock } from '../hooks/useStreamLock';
import Player from '../components/Player';
import parser from 'iptv-playlist-parser'; // Import the parser
import { Link } from 'react-router-dom';
// import VirtualList from 'react-tiny-virtual-list';
import ChannelList from '../components/ChannelList';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer'; 

// Define a type for a parsed channel item
interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

type GroupedChannels = {
  [groupName: string]: Channel[];
};

interface Playlist {
  id: string;
  name: string;
  url: string;
}

const DashboardPage = () => {
  const { session } = useAuthStore();
  const { lockStatus } = usePlayerStore();
  const { requestLock, stopAndRelease } = useStreamLock();

  
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistUrl, setSelectedPlaylistUrl] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groupedChannels, setGroupedChannels] = useState<GroupedChannels>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('flat'); // Default to flat
  const [searchTerm, setSearchTerm] = useState('');

  // Effect 1: Load user playlists from session on mount or when session changes
  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const userPlaylists = session.user.user_metadata.playlists as Playlist[];
      setAvailablePlaylists(userPlaylists);

      if (userPlaylists.length > 0) {
        // Remember the user's last choice from localStorage
        const lastSelected = localStorage.getItem('lastSelectedPlaylistUrl');
        const isValid = userPlaylists.some(p => p.url === lastSelected);
        
        setSelectedPlaylistUrl(isValid ? lastSelected : userPlaylists[0].url);
      } else {
        setSelectedPlaylistUrl(null);
      }
    } else {
        setIsLoading(false); // No playlists, stop loading.
    }
  }, [session]);

  // Effect 2: Fetch and parse the selected playlist
  useEffect(() => {
    const fetchAndParsePlaylist = async () => {
      if (!selectedPlaylistUrl) {
        setGroupedChannels({});
        setError("No playlist selected or configured. Please add one in Settings.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(selectedPlaylistUrl);
         if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        }
        const playlistText = await response.text();
        
        const result = parser.parse(playlistText);
        
        const formattedChannels = result.items.map(item => ({
          name: item.name,
          url: item.url,
          logo: item.tvg.logo,
          group: item.group.title,
        }));
        
        setChannels(formattedChannels);

        const grouped = formattedChannels.reduce((acc: GroupedChannels, channel) => {
          const groupName = channel.group || 'Uncategorized'; // Use a default group
          if (!acc[groupName]) {
            acc[groupName] = []; // Create the group array if it doesn't exist
          }
          acc[groupName].push(channel);
          return acc;
        }, {});

        setGroupedChannels(grouped);

      } catch (err: unknown) {
              if (err instanceof Error) {
          setError(`Failed to parse playlist: ${err.message}`);
          console.error(err);
        } else {
          setError('Failed to parse playlist: Unknown error');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndParsePlaylist();
  }, [selectedPlaylistUrl]); // This effect now runs when the selection changes!

  const filteredChannels = useMemo(() => {
    if (!searchTerm) {
      return channels; // If search is empty, return all channels
    }
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, channels]); 

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUrl = e.target.value;
    setSelectedPlaylistUrl(newUrl);
    localStorage.setItem('lastSelectedPlaylistUrl', newUrl);
  };


  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const handleReload = () => {
    window.location.reload();
  }

  const handleChannelClick = (channelUrl: string) => {
    if (lockStatus === 'ACQUIRED') {
        // If we already have the lock, just switch the stream
        usePlayerStore.getState().playStream(channelUrl);
    } else if (lockStatus === 'AVAILABLE') {
        // If the lock is free, request it. The player will start
        // automatically when the lock status changes to 'ACQUIRED'.
        requestLock();
        // A temporary store to hold the requested URL until the lock is acquired
        sessionStorage.setItem('nextStreamUrl', channelUrl);
    } else {
        alert(`Cannot play channel, lock status is: ${lockStatus}`);
    }
  };
    // Effect to play the stream once the lock is acquired
  useEffect(() => {
    if (lockStatus === 'ACQUIRED') {
        const nextUrl = sessionStorage.getItem('nextStreamUrl');
        if (nextUrl) {
            usePlayerStore.getState().playStream(nextUrl);
            sessionStorage.removeItem('nextStreamUrl');
        }
    }
  }, [lockStatus]);

  return (
   <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 flex flex-col">
        {/* --- START OF NEW DROPDOWN --- */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-2">Playlists</h2>
          {availablePlaylists.length > 0 ? (
            <select
              value={selectedPlaylistUrl || ''}
              onChange={handlePlaylistChange}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
            >
              {availablePlaylists.map(p => (
                <option key={p.id} value={p.url}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-400">No playlists found.</p>
          )}
        </div>
        {/* --- END OF NEW DROPDOWN --- */}

         <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold mb-2">Channels</h2>
        {/* View Mode Toggle */}
        <div className="flex bg-gray-700 rounded-md p-1 mb-4">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
          >
            Grouped
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`flex-1 py-1 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
          >
            Flat
          </button>
        </div>
        {/* Search Bar (only visible in flat mode) */}
        {viewMode === 'flat' && (
          <input
            type="text"
            placeholder="🔎 Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
          />
        )}
      </div>
        
        {/* --- END OF NEW CONTROLS SECTION --- */}

      {/* Channel List Display Section */}
      <div className="flex-1 overflow-y-hidden">
        {isLoading && <p className="p-4">Loading playlist...</p>}
        {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
        
        {!isLoading && !error && (
          <>
            {/* --- START OF CONDITIONAL RENDERING --- */}
            {viewMode === 'grouped' && (
              <ChannelList 
                groupedChannels={groupedChannels} 
                onChannelClick={handleChannelClick} 
              />
            )}

            {viewMode === 'flat' && (
              <div className="h-full">
                 <AutoSizer>
                  {({ height, width }) => ( // 3. AutoSizer provides the measured height and width
                    <VirtualList
                      width={width} // <-- Pass the measured width
                      height={height} // <-- Pass the measured height
                      itemCount={filteredChannels.length}
                      itemSize={44}
                      renderItem={({ index, style }) => {
                        const channel = filteredChannels[index];
                        return (
                          // The rest of this is exactly the same
                          <div key={channel.url + index} style={style}>
                            <button 
                              onClick={() => handleChannelClick(channel.url)}
                              className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11"
                            >
                              {channel.logo && channel.logo !== '' && <img 
                                src={channel.logo} 
                                alt="" 
                                className="w-8 h-8 object-contain rounded-sm bg-gray-700"
                                loading="lazy"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />}
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
            {/* --- END OF CONDITIONAL RENDERING --- */}
          </>
        )}
      </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div>
            <h1 className="text-xl font-bold">Stream Locker - IPTV Player</h1>
            <p className="text-sm text-gray-400">Welcome, {session?.user?.email}</p>
          </div>
          <div className="space-x-2">
          <button 
            onClick={stopAndRelease} 
            // Only show the button if a stream is active
            className={`px-4 py-2 font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 ${lockStatus !== 'ACQUIRED' ? 'hidden' : ''}`}
          >
            Stop Stream
          </button>
          <Link to="/settings">
            <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Settings
            </button>
          </Link>
          <button onClick={handleReload} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Reload
          </button>
          <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
            Logout
          </button>
          </div>
        </header>

        <div className="flex-1 p-4" style={{ maxHeight: 'calc(100vh - 81px)' }}>
          <Player />
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;