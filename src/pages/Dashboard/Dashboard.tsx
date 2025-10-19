// src/pages/Dashboard/components/ApkLandscapeLayout.tsx

import type { Playlist, Channel, M3uPlaylist, GroupedChannels } from '../../types/playlist';
import { FaLayerGroup, FaSearch, FaUnlockAlt, FaUserShield } from 'react-icons/fa';
import { useRef, useState, useCallback, type FC } from 'react';
import { FiSettings, FiStopCircle } from 'react-icons/fi';
import { useDebugStore } from '../../store/debugStore';
import { FaList  } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChannelList from '../../components/ChannelList';
import logo from '../../assets/logo.png';
import yz from '../../assets/yz.png';

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

export const Dashboard: FC<ApkLandscapeLayoutProps> = (props) => {
  const {
    m3uPlaylists, selectedPlaylistId, handlePlaylistChange,
    viewMode, setViewMode, searchTerm, setSearchTerm,
    isLoading, error, groupedChannels, filteredChannels, handleChannelClick,
    handleTakeover, stopAndRelease, lockStatus,
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
        className="flex items-center justify-between min-md:space-x-4 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0"
      >
        <div className="flex w-full items-center  space-x-4 max-md:flex-wrap">
        {/* Left Side */}
        <div className="flex items-center space-x-4 max-sm:w-full max-sm:mr-0">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-full" onClick={() => toggleConsole()} />
            {m3uPlaylists.length > 0 && (
              <select
                value={selectedPlaylistId || ''}
                onChange={handlePlaylistChange}
                className="cursor-pointer max-sm:w-full px-3 pt-1 pb-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                onKeyDown={handleHeaderKeyDown}
              >
                {m3uPlaylists.map((p: Playlist) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            
            <div className="flex bg-gray-700 rounded-md p-1">
              <button onClick={() => setViewMode('grouped')} className={`cursor-pointer px-3 py-2 text-sm rounded-md ${viewMode === 'grouped' ? 'bg-blue-600' : 'hover:bg-gray-600'}`} onKeyDown={handleHeaderKeyDown}><FaLayerGroup   /></button>
              <button onClick={() => setViewMode('flat')} className={`cursor-pointer px-3 py-2 text-sm rounded-md ${viewMode === 'flat' ? 'bg-blue-600' : 'hover:bg-gray-600'}`} onKeyDown={handleHeaderKeyDown}><FaList  /></button>
            </div>
            </div>
            {viewMode === 'flat' && (
              <div className="relative max-sm:w-full max-sm:mt-2 flex-grow">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 pl-10 py-2 text-white bg-gray-700 border border-gray-600 rounded-md text-sm flex-shrink-1 flex-grow-1"
                onKeyDown={handleHeaderKeyDown}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            )}
        </div>

  
        {/* Right Side - Hide on mobile portrait */}
        <div className="flex items-center space-x-4 max-md:portrait:hidden">
          {lockStatus === 'ACQUIRED' && (
            <button onClick={stopAndRelease} title="Stop Stream" className="p-2 rounded-full text-yellow-400 hover:bg-gray-700 animate-pulse" onKeyDown={handleHeaderKeyDown}><FiStopCircle size={24} /></button>
          )}
          {lockStatus === 'LOCKED_BY_OTHER' && <button
            onClick={handleTakeover}
            autoFocus
            title="Play Here"
            className={`p-2 rounded-full hover:bg-gray-700 text-blue-400 animate-pulse`}
            onKeyDown={handleHeaderKeyDown}
          >
            <FaUnlockAlt size={24} />
          </button>}
          <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><FiSettings size={24} /></Link>
          {hasXtreamPlaylists && <Link to="/playground" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><img src={yz} width={24} /></Link>}
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
              <div className="h-full relative">
                {lockStatus === 'LOCKED_BY_OTHER' && (
                  <div className="absolute top-0 left-0 w-full h-full bg-black opacity-90 z-10 pointer-events-none flex items-center justify-center flex-col">
                    <h2 className="p-4 text-white text-xl">Protected by StreamLocker</h2>
                    <FaUserShield size={72} className="text-white" />
                    <p className="p-4 text-white text-sm">already streaming on another device.</p>
                  </div>
                )}
                <AutoSizer>
                  {({ height, width }) => (
                    <VirtualList
                      width={width} height={height} itemCount={filteredChannels.length} itemSize={44}
                      renderItem={({ index, style }) => {
                        const channel = filteredChannels[index];
                        return (
                          <div key={channel.url + index} style={style}>
                            <button onClick={() => onChannelButtonClick(channel.url, index)} className={`w-full text-left px-4 rounded hover:bg-gray-600 text-sm flex items-center space-x-2 h-11 space-x-5 focus:bg-blue-600 focus:outline-none ${lockStatus === 'LOCKED_BY_OTHER' ? 'opacity-50 pointer-events-none' : ''}`}>
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
          {/* mobile portrait bottom navigation */}
        <div className="flex justify-center items-center space-x-8 py-1 bg-gray-800 border-t border-gray-700 min-md:hidden landscape:hidden">
          {lockStatus === 'ACQUIRED' && (
            <button onClick={stopAndRelease} title="Stop Stream" className="p-2 rounded-full text-yellow-400 hover:bg-gray-700 animate-pulse" onKeyDown={handleHeaderKeyDown}><FiStopCircle size={36} /></button>
          )}
          {lockStatus === 'LOCKED_BY_OTHER' && <button
            onClick={handleTakeover}
            autoFocus
            title="Play Here"
            className={`p-2 rounded-full hover:bg-gray-700 text-blue-400 animate-pulse`}
            onKeyDown={handleHeaderKeyDown}
          >
            <FaUnlockAlt size={36} />
          </button>}
          <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><FiSettings size={36} /></Link>
          {hasXtreamPlaylists && <Link to="/playground" className="p-2 rounded-full hover:bg-gray-700" onKeyDown={handleHeaderKeyDown}><img src={yz} width={36} /></Link>}
        </div>
    </div>
  );
};