import { useState, useMemo, useRef } from 'react';
import { FiGrid, FiSearch, FiX } from 'react-icons/fi';
import { StreamCarousel } from './StreamCarousel';
import { GridModal } from './GridModal';
import type { PosterItem } from '../../../types/playlist';
import { FocusTrap } from 'focus-trap-react';

interface StreamRowProps {
  title: string;
  streams: PosterItem[];
  onPosterClick: (id: number) => void;
}

export const StreamRow = ({ title, streams, onPosterClick }: StreamRowProps) => {
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [isFocusTrapActive, setIsFocusTrapActive] = useState(false);

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
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xl font-bold text-text-primary">
          {title} <span className="text-sm font-normal text-text-tertiary">({filteredStreams.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFocusTrapActive(!isFocusTrapActive)}
            className={`px-3 py-1 text-xs rounded-md ${isFocusTrapActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {isFocusTrapActive ? 'TRAP ON' : 'TRAP OFF'}
          </button>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
              className={`h-9 pl-8 pr-3 py-0 text-text-primary bg-background-secondary border border-border-primary rounded-md text-sm focus:ring-2 focus:ring-primary-focus focus:outline-none transition-all duration-300 ${isSearchOpen || searchTerm ? 'w-64' : 'w-9'}`}
            />
            <FiSearch className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${isSearchOpen || searchTerm ? 'text-primary' : 'text-text-tertiary'}`} size={16} onClick={()=>{
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

          <button 
            onClick={() => setIsGridModalOpen(true)}
            className="flex-shrink-0 p-2 rounded-md bg-background-secondary border border-border-primary text-text-tertiary hover:bg-background-glass hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-focus"
            title="Open Grid View"
          >
            <FiGrid size={16} />
          </button>
        </div>
      </div>
      
      <FocusTrap
        active={isFocusTrapActive}
        focusTrapOptions={{
          onDeactivate: () => setIsFocusTrapActive(false),
          initialFocus: () => {
            const container = document.querySelector(`[data-row-title="${title}"]`);
            return container?.querySelector('button') as HTMLElement;
          },
          // Allow clicks outside to deactivate, useful for debugging with a mouse
          clickOutsideDeactivates: true, 
        }}
      >
        <div data-row-title={title}>
          <StreamCarousel streams={filteredStreams} onPosterClick={onPosterClick} />
        </div>
      </FocusTrap>

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