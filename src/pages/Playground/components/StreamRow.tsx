import { useState, useMemo } from 'react';
import { FiGrid, FiSearch, FiX } from 'react-icons/fi';
import { StreamCarousel } from './StreamCarousel';
import { GridModal } from './GridModal'; // <-- Import the new modal
import type { PosterItem } from '../../../types/playlist';

interface StreamRowProps {
  title: string;
  streams: PosterItem[];
  onPosterClick: (id: number) => void;
}

export const StreamRow = ({ title, streams, onPosterClick }: StreamRowProps) => {
  // We no longer need a `viewMode`. The Carousel is the default inline view.
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStreams = useMemo(() => {
    if (!searchTerm) {
      return streams;
    }
    return streams.filter(stream =>
      stream.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [streams, searchTerm]);

  const handleCloseSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">{title} ({filteredStreams.length})</h2>
        <div className="flex items-center space-x-2">
          {/* --- Search UI (Now always uses `flex-shrink-0` for better responsiveness) --- */}
          <div className={`flex bg-gray-700 rounded-md p-1 transition-all duration-300 ${isSearchOpen ? 'flex-grow' : 'flex-shrink-0'}`}>
            {!isSearchOpen ? (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="px-3 py-1 text-sm rounded-md cursor-pointer"
                title="Search this row"
              >
                <FiSearch size={16} />
              </button>
            ) : (
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={`Search in ${title}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-80 h-full px-3 py-0 text-white bg-gray-700 border-none rounded-md text-sm focus:ring-0"
                />
                <button 
                  onClick={handleCloseSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  title="Close search"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}
          </div>

          {/* --- The Grid Button now opens the modal --- */}
          <div className="flex bg-gray-700 rounded-md p-1">
            <button 
              onClick={() => setIsGridModalOpen(true)}
              className="px-3 py-1 text-sm rounded-md cursor-pointer"
              title="Open Grid View"
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* The Carousel is now the only inline view */}
      <StreamCarousel streams={filteredStreams} onPosterClick={onPosterClick} />

      {/* Conditionally render the new full-screen modal */}
      {isGridModalOpen && (
        <GridModal 
          title={title}
          streams={filteredStreams}
          onClose={() => setIsGridModalOpen(false)}
          onPosterClick={onPosterClick}
        />
      )}
    </div>
  );
};