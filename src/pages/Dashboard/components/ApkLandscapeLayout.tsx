// src/pages/Dashboard/components/ApkLandscapeLayout.tsx

import { useRef, useState, useCallback, type FC } from 'react';
import { Link } from 'react-router-dom';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FiLogOut, FiSettings, FiStopCircle } from 'react-icons/fi';

import ChannelList from '../../../components/ChannelList'; // Adjust path if needed
import logo from '../../../assets/logo.png'; // Adjust path if needed
import type { Playlist, Channel, GroupedChannels, M3uPlaylist } from '../../../types/playlist'; // Adjust path if needed
import { useDebugStore } from '../../../store/debugStore';
import yz from '../../../assets/yz.png';

interface ApkLandscapeLayoutProps {
  m3uPlaylists: M3uPlaylist[];
  selectedPlaylistId: string | null;
  handlePlaylistChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  viewMode: 'grouped' | 'flat';
  setViewMode: (mode: 'grouped' | 'flat') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  error: string | null;
  groupedChannels: GroupedChannels;
  filteredChannels: Channel[];
  handleChannelClick: (channelUrl: string) => void;
  handleLogout: () => void;
  handleTakeover: () => void;
  stopAndRelease: () => void; // We need this prop now
  lockStatus: string;
  hasXtreamPlaylists: boolean;
}

export const ApkLandscapeLayout: FC<ApkLandscapeLayoutProps> = (props) => {
  const {
    m3uPlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleLogout, handleTakeover, stopAndRelease, lockStatus,
    hasXtreamPlaylists
  } = props;
  
  const { toggleConsole } = useDebugStore();
  const headerRef = useRef<HTMLHeadElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [lastFocusedIndex, setLastFocusedIndex] = useState(0);

  const focusChannelList = useCallback(() => {
    const channelButtons = listContainerRef.current?.querySelectorAll('button');
    if (channelButtons && channelButtons.length > 0) {
      const indexToFocus = Math.min(lastFocusedIndex, channelButtons.length - 1);
      channelButtons[indexToFocus]?.focus();
    }
  }, [lastFocusedIndex]);

  const handleHeaderKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusChannelList();
    }
  }, [focusChannelList]);

  const handleListKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      headerRef.current?.querySelector('select')?.focus();
    }
  }, []);

  const onChannelButtonClick = (url: string, index: number) => {
    setLastFocusedIndex(index);
    handleChannelClick(url);
  };

  return (
    <div
      className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header
        ref={headerRef}
        className="flex items-center space-x-4 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0"
      >
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" onClick={()=>toggleConsole()} />
          {m3uPlaylists.length > 0 && (
            <select
              value={selectedPlaylistId || ''}
              onChange={handlePlaylistChange}
              className="w-48 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
              onKeyDown={handleHeaderKeyDown}
            >
              {m3uPlaylists.map((p: Playlist) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 flex items-center justify-center space-x-4">
          <div className="flex bg-gray-700 rounded-md p-1">
            <button onClick={() => setViewMode('grouped')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600' : ''}`} onKeyDown={handleHeaderKeyDown}>Grouped</button>
            <button onClick={() => setViewMode('flat')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600' : ''}`} onKeyDown={handleHeaderKeyDown}>Flat</button>
          </div>
          {viewMode === 'flat' && (
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 px-3 py-1.5 text-white bg-gray-700 border border-gray-600 rounded-md text-sm"
              onKeyDown={handleHeaderKeyDown}
            />
          )}
        </div>

        {/* Right Side - Now with Lock-Aware Logic */}
        <div className="flex items-center space-x-2">
           {lockStatus === 'ACQUIRED' && (
             <button onClick={stopAndRelease} title="Stop Stream" className="p-2 rounded-full text-yellow-400 hover:bg-gray-700 animate-pulse" onKeyDown={handleHeaderKeyDown}><FiStopCircle size={24} /></button>
           )}
          <button
            onClick={handleTakeover}
            title="Play Here"
            // The button is only enabled and visible when another device has the lock.
            className={`p-2 rounded-full hover:bg-gray-700 ${lockStatus === 'LOCKED_BY_OTHER' ? 'text-blue-400 animate-pulse' : 'hidden'}`}
            onKeyDown={handleHeaderKeyDown}
          >
            <FiStopCircle size={24} />
          </button>
            {hasXtreamPlaylists && <Link to="/playground" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><img src={yz} width={24} /></Link>}
          <Link to="/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><FiSettings size={24} /></Link>
          <button onClick={handleLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><FiLogOut size={24} /></button>
        </div>
      </header>

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-hidden"
        ref={listContainerRef}
        onKeyDown={handleListKeyDown}
      >
        {isLoading && <p className="p-4">Loading playlist...</p>}
        {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
        {!isLoading && !error && (
          <>
            {viewMode === 'grouped' && <ChannelList groupedChannels={groupedChannels} onChannelClick={(url, index) => onChannelButtonClick(url, index ?? 0)} />}
            {viewMode === 'flat' && (
              <div className="h-full">
                <AutoSizer>
                  {({ height, width }) => (
                    <VirtualList
                      width={width} height={height} itemCount={filteredChannels.length} itemSize={44}
                      renderItem={({ index, style }) => {
                        const channel = filteredChannels[index];
                        return (
                          <div key={channel.url + index} style={style}>
                            <button onClick={() => onChannelButtonClick(channel.url, index)} className="w-full text-left p-2 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11 focus:bg-blue-600 focus:outline-none">
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
    </div>
  );
};