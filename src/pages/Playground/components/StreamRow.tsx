import { useState, useMemo, useRef } from 'react';
import { FiGrid, FiSearch, FiX } from 'react-icons/fi';
import { StreamCarousel } from './StreamCarousel';
import { GridModal } from './GridModal';
import type { PosterItem } from '../../../types/playlist';
import { FocusTrap } from 'focus-trap-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUiContextStore } from '../../../store/uiContextStore';
import { useEnvStore } from '../../../store/envStore';

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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isFocusTrapActive, setIsFocusTrapActive] = useState(false);

  const device = useEnvStore(state => state.device);
  const isFocusLocked = useUiContextStore(state => state.isFocusLocked);
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
  useHotkeys(['MediaFastForward', 'ctrl+alt+f'], () => {
    buttonRef.current?.focus();
  }, { preventDefault: true });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <button
          ref={buttonRef}
          onClick={() => setIsFocusTrapActive(!isFocusTrapActive)}
          data-testid={`trap-button-${title.replace(/\s+/g, '-')}`}
          // Basic styling to make it behave like a text block, plus focus styles
          className="text-left focus:outline-none focus:ring-2 focus:ring-primary-focus rounded-md -ml-2 p-2"
        >
          <h2 className="text-xl font-bold text-text-primary">
            {title} <span className="text-sm font-normal text-text-tertiary">({filteredStreams.length})</span>
          </h2>
          {/* Add a visual indicator for the active trap state */}
          {isFocusTrapActive && (
            <div className="w-1/2 h-1 bg-primary mt-1 rounded-full"></div>
          )}
        </button>
        {device !== 'firetv' && <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
              className={`h-8.5 pr-3 py-0 text-text-primary bg-background-secondary border border-border-primary rounded-md text-sm focus:ring-2 focus:ring-primary-focus focus:outline-none transition-all duration-300 ${isSearchOpen || searchTerm ? 'w-64 pl-8 ' : 'w-7 pl-5 '} `}
            />
            <FiSearch className={`absolute pointer-events-none left-2 top-1/2 -translate-y-1/2 transition-colors ${isSearchOpen || searchTerm ? 'text-primary' : 'text-text-tertiary'}`} size={16} />
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
        </div>}
      </div>
      
      <FocusTrap
        active={!isFocusLocked && isFocusTrapActive}
        focusTrapOptions={{
          onDeactivate: () => setIsFocusTrapActive(false),
          initialFocus: () => {
            const container = document.querySelector(`[data-row-title="${title}"]`);
            return container?.querySelector('button') as HTMLElement;
          },
          // Allow clicks outside to deactivate, useful for debugging with a mouse
          clickOutsideDeactivates: true, 
          returnFocusOnDeactivate: true,
        }}
      >
        <div data-row-title={title} onKeyDown={(e) => {
          // If the trap is active and the user presses Up or Down...
          if (isFocusTrapActive && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            // ...prevent the default browser behavior...
            e.preventDefault();
            // ...and deactivate the trap.
            setIsFocusTrapActive(false);
          }
        }}
        // We need to make this div focusable for the keydown event to reliably fire
        // when its children have focus. -1 removes it from the natural tab order.
        tabIndex={-1} 
        className="focus:outline-none">
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