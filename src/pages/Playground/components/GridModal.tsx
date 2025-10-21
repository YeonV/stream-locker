import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { StreamGrid } from './StreamGrid';
import type { PosterItem } from '../../../types/playlist';
import * as Dialog from '@radix-ui/react-dialog';

interface GridModalProps {
  title: string;
  streams: PosterItem[];
  onClose: () => void;
  onPosterClick: (id: number) => void;
}

export const GridModal = ({ title, streams, onClose, onPosterClick }: GridModalProps) => {
  // --- REFS for D-PAD NAVIGATION ---
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // --- "HISTORY HIJACK" FOR BACK BUTTON ---
  useEffect(() => {
    window.history.pushState({ modal: 'grid' }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modal === 'grid') {
        window.history.back();
      }
    };
  }, [onClose]);

  // --- "MANUAL BRIDGE" FROM HEADER TO CONTENT ---
  useEffect(() => {
    const button = closeButtonRef.current;
    if (!button) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const firstPoster = gridContainerRef.current?.querySelector('button') as HTMLElement | null;
        firstPoster?.focus();
      }
    };

    button.addEventListener('keydown', handleKeyDown);
    return () => button.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array ensures this runs once

  const handleFocusLeaveUp = () => {
    closeButtonRef.current?.focus();
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content 
          className="fixed inset-4 z-50 bg-background-secondary rounded-lg overflow-hidden shadow-2xl shadow-primary/20 flex flex-col animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex justify-between items-center p-4 border-b border-border-primary flex-shrink-0">
            <Dialog.Title className="text-2xl font-bold text-text-primary">
              {title} <span className="text-base font-normal text-text-tertiary">({streams.length})</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                ref={closeButtonRef}
                className="p-2 rounded-full text-text-secondary hover:bg-background-glass hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-focus"
                title="Close grid view"
              >
                <FiX size={24} />
              </button>
            </Dialog.Close>
          </div>

          <div ref={gridContainerRef} className="flex-1 overflow-hidden">
            <StreamGrid 
              streams={streams} 
              onPosterClick={onPosterClick}
              onFocusLeaveUp={handleFocusLeaveUp} // Pass the "return journey" handler
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};