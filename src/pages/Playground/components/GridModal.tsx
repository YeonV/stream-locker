import { FiX } from 'react-icons/fi';
import { StreamGrid } from './StreamGrid';
import type { PosterItem } from '../../../types/playlist';
import * as Dialog from '@radix-ui/react-dialog'; // Import Radix Dialog

interface GridModalProps {
  title: string;
  streams: PosterItem[];
  onClose: () => void;
  onPosterClick: (id: number) => void;
}

export const GridModal = ({ title, streams, onClose, onPosterClick }: GridModalProps) => {
  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content 
          className="fixed inset-4 z-50 bg-background-secondary rounded-lg overflow-hidden shadow-2xl shadow-primary/20 flex flex-col animate-in fade-in-0 zoom-in-95"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b border-border-primary flex-shrink-0">
            <Dialog.Title className="text-2xl font-bold text-text-primary">
              {title} <span className="text-base font-normal text-text-tertiary">({streams.length})</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button 
                className="p-2 rounded-full text-text-secondary hover:bg-background-glass hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-focus"
                title="Close grid view"
              >
                <FiX size={24} />
              </button>
            </Dialog.Close>
          </div>

          {/* Modal Body - The Grid */}
          <div className="flex-1 overflow-hidden">
            <StreamGrid streams={streams} onPosterClick={onPosterClick} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};