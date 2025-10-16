import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FiArrowLeft, FiPlay } from 'react-icons/fi';
import { useApiStore } from '../../../store/apiStore';
import type { LiveStream, EpgListing } from '../../../types/playlist';
import Player from '../../../components/Player';
import { usePlayback } from '../../../hooks/usePlayback';

interface LiveCategoryViewProps {
  categoryName: string;
  channels: LiveStream[];
  onBack: () => void;
  onChannelClick: (channel: LiveStream) => void;
}

const ROW_HEIGHT = 64;

export const LiveCategoryView = ({ categoryName, channels, onBack, onChannelClick }: LiveCategoryViewProps) => {
  const [selectedChannel, setSelectedChannel] = useState<LiveStream | null>(channels[0] || null);
  const [epgData, setEpgData] = useState<EpgListing[]>([]);
  const [isLoadingEpg, setIsLoadingEpg] = useState(false);
  const { play } = usePlayback();
  const xtreamApi = useApiStore((state) => state.xtreamApi);
  
  useEffect(() => {
    if (!selectedChannel) { setEpgData([]); return; }
    const fetchEpg = async () => {
      setIsLoadingEpg(true);
      const epgResult = await xtreamApi?.getShortEpg(selectedChannel.stream_id);
      setEpgData(epgResult?.epg_listings || []);
      setIsLoadingEpg(false);
    };
    fetchEpg();
  }, [selectedChannel, xtreamApi]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="w-full h-full flex flex-col">
      <header className="flex items-center p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0 z-10">
        <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600">
          <FiArrowLeft /><span>Back</span>
        </button>
        <h1 className="text-xl font-bold mx-auto">{categoryName} ({channels.length})</h1>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div ref={parentRef} className="w-1/3 h-full overflow-y-auto border-r border-gray-700">
          <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {virtualItems.map(virtualItem => {
              const channel = channels[virtualItem.index];
              if (!channel) return null;
              const isSelected = selectedChannel?.stream_id === channel.stream_id;
              return (
                <div key={virtualItem.key} className="absolute top-0 left-0 w-full" style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}>
                  <div onClick={() => setSelectedChannel(channel)} className={`w-full h-full flex items-center justify-between px-4 text-left cursor-pointer transition-colors ${isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                    <div className="flex items-center space-x-4 overflow-hidden">
                      {channel.stream_icon && <img src={channel.stream_icon} alt="" className="w-10 h-10 object-contain flex-shrink-0" />}
                      <span className="font-semibold truncate">{channel.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onChannelClick(channel); play({type: 'livetv', channel}); }} className="p-2 rounded-full hover:bg-white/20" title={`Play ${channel.name}`}>
                      <FiPlay className="text-2xl text-gray-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-2/3 h-full overflow-y-auto p-4">
        <Player onRequestTakeover={() => console.log('takeover')} />
        </div>
        {/* --- THIS IS THE SIMPLIFIED JSX --- */}
        <div className="w-1/3 h-full overflow-y-auto p-4">
          {isLoadingEpg ? (
            <div className="flex items-center justify-center h-full"><p className="text-gray-400">Loading EPG...</p></div>
          ) : epgData.length > 0 ? (
            <div className="space-y-3">
              {epgData.map(listing => (
                <div key={listing.id} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-baseline space-x-3">
                    <p className="font-mono text-base text-gray-400">{listing.start.substring(11, 16)} - {listing.end.substring(11, 16)}</p>
                    <p className="font-bold text-lg text-white">{listing.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-400 border-l-2 border-gray-700 pl-3">{listing.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full"><p className="text-gray-400">No EPG data available for this channel.</p></div>
          )}
        </div>
      </main>
    </div>
  );
};