import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { StreamGrid } from './StreamGrid';
import type { PosterItem } from '../../../types/playlist';

interface GridModalProps {
  title: string;
  streams: PosterItem[];
  onClose: () => void;
  onPosterClick: (id: number) => void;
}

export const GridModal = ({ title, streams, onClose, onPosterClick }: GridModalProps) => {
  // Hijack Escape key and Back button to close the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.history.pushState({ modal: 'grid' }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modal === 'grid') {
        window.history.back();
      }
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm flex flex-col p-4 md:p-8"
      onClick={onClose}
    >
      <div 
        className="w-full h-full bg-gray-900 rounded-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold">{title} - Grid View ({streams.length})</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            title="Close grid view"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body - The Grid */}
        <div className="flex-1 overflow-hidden">
          {/* The StreamGrid component fits perfectly here */}
          <StreamGrid streams={streams} onPosterClick={onPosterClick} />
        </div>
      </div>
    </div>
  );
};