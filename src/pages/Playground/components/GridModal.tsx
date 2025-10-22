import { useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { StreamGrid } from './StreamGrid';
import type { PosterItem } from '../../../types/playlist';
import * as Dialog from '@radix-ui/react-dialog';
import { useHotkeys } from 'react-hotkeys-hook';
import { FocusTrap } from 'focus-trap-react';

interface GridModalProps {
  title: string;
  streams: PosterItem[];
  onClose: () => void;
  onPosterClick: (id: number) => void;
}

export const GridModal = ({ title, streams, onClose, onPosterClick }: GridModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useHotkeys('MediaRewind', onClose, {
    enableOnContentEditable: true,
    enableOnFormTags: ['input', 'select', 'textarea'],
  });
  
  // The 'history hijack' can now be safely removed as it was unreliable.
  // The 'manual bridge' from the close button is also no longer needed,
  // as FocusTrap will handle initial focus for us. We can clean this up.
  // useEffect(() => { /* ... history hijack ... */ }); // --- REMOVE THIS ---
  // useEffect(() => { /* ... manual bridge ... */ }); // --- REMOVE THIS ---

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
          {/* --- NEW: Wrap the content in FocusTrap --- */}
          <FocusTrap
            active={true} // The trap is always active when the modal is open
            focusTrapOptions={{
              // Set the initial focus to the first poster in the grid
              initialFocus: () => gridContainerRef.current?.querySelector('button') as HTMLElement,
              // When the trap is deactivated (e.g., by the component unmounting),
              // it will try to return focus to whatever opened it.
              onDeactivate: onClose,
              // Allow clicking outside to close, useful for desktop testing
              clickOutsideDeactivates: true,
            }}
          >
            {/* We need a container div for the trap to attach to */}
            <div className="flex flex-col h-full">
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
                  onFocusLeaveUp={handleFocusLeaveUp}
                />
              </div>
            </div>
          </FocusTrap>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};