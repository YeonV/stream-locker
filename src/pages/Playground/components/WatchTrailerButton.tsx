import { useState } from 'react';
import { FiYoutube } from 'react-icons/fi';
import { TrailerPlayerModal } from './TrailerPlayerModal';

interface WatchTrailerButtonProps {
  youtubeId: string | null;
  className?: string;
}

export const WatchTrailerButton = ({ youtubeId, className }: WatchTrailerButtonProps) => {
  // --- STATE and LOGIC are now encapsulated here ---
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);

  const handleOpenTrailer = () => {
    setIsTrailerPlaying(true);
  };

  const handleCloseTrailer = () => {
    setIsTrailerPlaying(false);
  };

  // If there's no youtubeId, the component renders nothing.
  if (!youtubeId) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpenTrailer} // Simple click handler
        className={`w-full flex items-center justify-center p-2.5 bg-background-secondary text-text-primary rounded-lg font-semibold text-sm hover:bg-background-glass transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:ring-primary-focus ${className}`}
      >
        <FiYoutube className="mr-2 text-red-500" /> Watch Trailer
      </button>

      {/* The modal is now part of this component's render output */}
      {isTrailerPlaying && (
        <TrailerPlayerModal 
          youtubeId={youtubeId}
          onClose={handleCloseTrailer}
        />
      )}
    </>
  );
};