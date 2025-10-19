// src/components/MpvPlayer/ChannelListOverlay.tsx

import { usePlayerStore } from '../../store/playerStore';
import { usePlayback } from '../../hooks/usePlayback';
import type { LiveStream, Channel } from '../../types/playlist';
import placeholderLogo from '../../assets/yz.png';
import { useState, useMemo } from 'react';
import VirtualList from 'react-tiny-virtual-list';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useUiContextStore } from '../../store/uiContextStore';

const ITEM_HEIGHT = 44;

export const ChannelListOverlay = () => {
  const { play } = usePlayback();
  const playStream = usePlayerStore(state => state.playStream);
  const currentStreamUrl = usePlayerStore(state => state.currentStreamUrl);
  const context = useUiContextStore(state => state.context);
  const [searchTerm, setSearchTerm] = useState('');

  // --- THIS IS THE FIX for the Temporal Paradox ---
  // 1. We get the raw channel list from the context, providing an empty array as a fallback.
  const channels = useMemo(() => {
    return (context?.type === 'livetv-xtream' || context?.type === 'livetv-m3u')
      ? context.channels
      : [];
  }, [context]);
    
  // 2. The useMemo hook is now safe. It always has a valid `channels` array to work with.
  const filteredChannels = useMemo(() => {
    if (!searchTerm) {
      return channels;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(lowerCaseSearch)
    );
  }, [channels, searchTerm]);
  // --- END OF FIX ---
   
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = placeholderLogo;
  };

  const handleChannelZap = (channel: LiveStream | Channel) => {
    if ('stream_id' in channel) {
      play({ type: 'livetv', channel: channel as LiveStream });
    } else {
      playStream(channel.url);
    }
  };
  
  // The safety check can now be simpler.
  if (channels.length === 0) {
    return null;
  }
  
  // This is now also safe.
  const currentId = context?.type === 'livetv-xtream' ? context.currentStreamId : currentStreamUrl!;

  return (
    <div className="w-80 h-full bg-black/70 backdrop-blur-md flex flex-col p-4">
      <h3 className="text-lg font-bold mb-2 text-white flex-shrink-0">Channel List</h3>
      <input 
        type="text" 
        placeholder="Search..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        className="w-full px-3 py-2 text-white bg-gray-800/80 border border-gray-600 rounded-md mb-2 flex-shrink-0"
      />
      
      <div className="flex-1 overflow-y-hidden">
        <AutoSizer>
          {({ height, width }) => (
            <VirtualList
              width={width}
              height={height}
              itemCount={filteredChannels.length}
              itemSize={ITEM_HEIGHT}
              renderItem={({ index, style }) => {
                const channel = filteredChannels[index];
                if (!channel) return null;

                const id = 'stream_id' in channel ? channel.stream_id : channel.url;
                const logo = 'stream_icon' in channel ? channel.stream_icon : channel.logo;
                const isCurrent = id === currentId;

                return (
                  <div key={id} style={style}>
                    <button 
                      onClick={() => handleChannelZap(channel)} 
                      className={`w-full h-full text-left text-white flex items-center p-2 rounded transition-colors ${isCurrent ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    >
                      <img 
                        src={logo || placeholderLogo} 
                        alt="" 
                        className="w-8 h-8 object-contain flex-shrink-0 mr-3" 
                        onError={handleImageError} 
                      />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default ChannelListOverlay;