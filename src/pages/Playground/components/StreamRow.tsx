import { useState, useMemo, useRef } from 'react';
import { FiGrid, FiSearch, FiX } from 'react-icons/fi';
import { StreamCarousel } from './StreamCarousel';
import { GridModal } from './GridModal';
import type { PosterItem } from '../../../types/playlist';

interface StreamRowProps {
  title: string;
  streams: PosterItem[];
  onPosterClick: (id: number) => void;
  rowIndex?: number;
}

export const StreamRow = ({ title, streams, onPosterClick, rowIndex }: StreamRowProps) => {
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    // The main container for the row
    <div className="mt-4">
      {/* --- Row Header --- */}
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl font-bold text-text-primary">
          {title} <span className="text-sm font-normal text-text-tertiary">({filteredStreams.length})</span>
        </h2>

        {/* --- Row Controls --- */}
        <div className="flex items-center gap-2">
          {/* Search UI */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
              // Themed input with a transition for the width
              className={`h-8.5 pl-8 pr-1 py-0 text-text-primary bg-background-secondary border border-border-primary rounded-md text-sm focus:ring-2 focus:ring-primary-focus focus:outline-none transition-all duration-300 ${isSearchOpen || searchTerm ? 'w-64' : 'w-9'}`}
            />
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchOpen || searchTerm ? 'text-primary' : 'text-text-tertiary'}`} size={16} onClick={()=>{
              setIsSearchOpen(true)
              inputRef.current?.focus();
              }} />
            {(isSearchOpen || searchTerm) && (
              <button 
                onClick={handleCloseSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                title="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Grid Button */}
          <button 
            onClick={() => setIsGridModalOpen(true)}
            className="flex-shrink-0 p-2 rounded-md bg-background-secondary border border-border-primary text-text-tertiary hover:bg-background-glass hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-focus"
            title="Open Grid View"
          >
            <FiGrid size={16} />
          </button>
        </div>
      </div>
      
      <StreamCarousel streams={filteredStreams} onPosterClick={onPosterClick} rowIndex={rowIndex} />

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