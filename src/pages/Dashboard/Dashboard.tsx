import type { Channel, M3uPlaylist, GroupedChannels } from '../../types/playlist';
import { useRef, useState, useCallback, useEffect, type FC } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { FaUserShield, FaUnlockAlt } from 'react-icons/fa';
import { FiStopCircle, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useEnvStore } from '../../store/envStore';
import ChannelList from '../../components/ChannelList';
import AutoSizer from 'react-virtualized-auto-sizer';
import VirtualList from 'react-tiny-virtual-list';
import yz from '../../assets/yz.png';

const ITEM_HEIGHT = 44;

interface DashboardProps {
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
  stopAndRelease: () => void;
  handleTakeover: () => void;
  lockStatus: string;
  hasXtreamPlaylists: boolean;
}

export const Dashboard: FC<DashboardProps> = (props) => {
  const {
    isLoading, error, viewMode, groupedChannels, handleChannelClick,
    filteredChannels, lockStatus, stopAndRelease, handleTakeover,
    hasXtreamPlaylists
  } = props;

  const headerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [lastFocusedIndex, setLastFocusedIndex] = useState(0);
  const [listScrollOffset, setListScrollOffset] = useState(0);
  const [needsFocus, setNeedsFocus] = useState(false);
  const { device } = useEnvStore();

  const handleHeaderKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const offset = lastFocusedIndex * ITEM_HEIGHT;
      setListScrollOffset(offset);
      setNeedsFocus(true);
    }
  }, [lastFocusedIndex]);

  // const handleListKeyDown = useCallback((event: React.KeyboardEvent) => {
  //   if (event.key === 'ArrowLeft') {
  //     event.preventDefault();
  //     headerRef.current?.querySelector('select')?.focus();
  //   }
  // }, []);

  const onChannelButtonClick = (url: string, index: number) => {
    setLastFocusedIndex(index);
    handleChannelClick(url);
  };

  useEffect(() => {
    if (needsFocus) {
      const timer = setTimeout(() => {
        const targetElement = listContainerRef.current?.querySelector(`[data-index='${lastFocusedIndex}'] button`) as HTMLElement | null;
        targetElement?.focus();
        setNeedsFocus(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [needsFocus, lastFocusedIndex, filteredChannels]);

  const headerProps = {
    m3uPlaylists: props.m3uPlaylists,
    selectedPlaylistId: props.selectedPlaylistId,
    handlePlaylistChange: props.handlePlaylistChange,
    viewMode: props.viewMode,
    setViewMode: props.setViewMode,
    searchTerm: props.searchTerm,
    setSearchTerm: props.setSearchTerm,
    hasXtreamPlaylists: props.hasXtreamPlaylists,
  };

  const lockActions = (
    <div className="absolute top-4 right-4 z-20 flex gap-2">
      {lockStatus === 'ACQUIRED' && (
        <button onClick={stopAndRelease} title="Stop Stream" className="p-2 rounded-full bg-background-secondary text-primary-focus hover:bg-background-glass animate-pulse"><FiStopCircle size={24} /></button>
      )}
      {lockStatus === 'LOCKED_BY_OTHER' && (
        <button onClick={handleTakeover} autoFocus title="Play Here" className="p-2 rounded-full bg-background-secondary text-primary-focus hover:bg-background-glass animate-pulse"><FaUnlockAlt size={24} /></button>
      )}
    </div>
  );

  return (
    <div className="h-screen w-screen bg-background-primary text-text-primary flex flex-col overflow-hidden">
      <div ref={headerRef} onKeyDown={handleHeaderKeyDown}>
        <DashboardHeader {...headerProps} />
      </div>

      <main ref={listContainerRef} onKeyDown={handleListKeyDown} className="flex-1 overflow-y-hidden relative" tabIndex={-1}>
        {lockActions}
        
        {isLoading && <div className="p-4">Loading playlist...</div>}
        {error && <div className="p-4 text-error">{error}</div>}
        
        {!isLoading && !error && (
          <>
            {viewMode === 'grouped' && (
              <ChannelList 
                groupedChannels={groupedChannels} 
                onChannelClick={onChannelButtonClick}
              />
            )}
            {viewMode === 'flat' && (
              <div className="h-full">
                {lockStatus === 'LOCKED_BY_OTHER' && (
                  <div className="absolute inset-0 bg-black/90 z-10 flex flex-col items-center justify-center gap-4">
                    <FaUserShield size={72} className="text-primary-focus" />
                    <h2 className="text-xl">Protected by Stream Locker</h2>
                    <p className="text-text-secondary">Already streaming on another device.</p>
                  </div>
                )}
                <AutoSizer>
                  {({ height, width }) => (
                    <VirtualList
                      width={width}
                      height={height}
                      itemCount={filteredChannels.length}
                      itemSize={ITEM_HEIGHT}
                      scrollOffset={listScrollOffset}
                      onScroll={offset => setListScrollOffset(offset)}
                      renderItem={({ index, style }) => {
                        const channel = filteredChannels[index];
                        return (
                          <div key={channel.url + index} style={style} data-index={index}>
                            <button 
                              onClick={() => onChannelButtonClick(channel.url, index)} 
                              className="w-full h-11 flex items-center gap-4 px-4 text-left text-sm rounded hover:bg-background-secondary focus:bg-primary focus:text-white focus:outline-none focus:scale-[1.02] transition-all duration-150"
                              disabled={lockStatus === 'LOCKED_BY_OTHER'}
                            >
                              {channel.logo ? 
                                <img src={channel.logo} alt="" className="w-8 h-8 object-contain rounded-sm bg-background-secondary" loading="lazy" onError={(e) => e.currentTarget.style.display = 'none'} /> : 
                                <div className="w-8 h-8 bg-background-secondary rounded-sm flex items-center justify-center text-xs text-text-tertiary">N/A</div>
                              }
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
      </main>
      
      <div className={`flex justify-center items-center space-x-8 py-1 ${device === 'android' ? 'pb-3' : ''} bg-gray-800 border-t border-gray-700 min-md:hidden landscape:hidden`}>
        <Link to="/playground/settings" title="Settings" className="p-2 rounded-full hover:bg-gray-700"><FiSettings size={36} /></Link>
        {hasXtreamPlaylists && <Link to="/playground" className="p-2 rounded-full hover:bg-gray-700"><img src={yz} alt="Playground" width={36} /></Link>}
      </div>
    </div>
  );
};