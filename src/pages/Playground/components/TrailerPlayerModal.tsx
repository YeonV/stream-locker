import ReactPlayer from 'react-player'; // Import the YouTube-specific player for a smaller bundle
import { FiX } from 'react-icons/fi';
import { useEffect } from 'react';

interface TrailerPlayerModalProps {
  youtubeId: string;
  onClose: () => void;
}

export const TrailerPlayerModal = ({ youtubeId, onClose }: TrailerPlayerModalProps) => {
  // Construct the full YouTube URL
  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

    useEffect(() => {
    // --- Handle "Escape" key press ---
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // --- Handle Browser Back Button ---
    // 1. We push a "fake" entry into the browser's history state.
    //    We're not changing the URL, just adding a state object.
    window.history.pushState({ modal: 'trailer' }, '');

    // 2. We listen for the `popstate` event, which fires when the user
    //    navigates back (either with the back button or a swipe gesture).
    const handlePopState = (event: PopStateEvent) => {
      // If our specific modal state is present, we know this back action
      // was meant for our modal.
      if (event.state?.modal === 'trailer') {
        onClose();
      }
    };

    // Add the event listeners when the modal mounts
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    // This is the crucial cleanup function. It runs when the modal unmounts.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      
      // If the user closed the modal by other means (clicking 'X' or the backdrop),
      // we need to make sure we clean up our "fake" history entry.
      // We check if the current state is still our modal state before going back.
      if (window.history.state?.modal === 'trailer') {
        window.history.back();
      }
    };
  }, [onClose]);

  return (
    // The main overlay with a dark, blurred background. It closes when clicked.
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* The container for the video player. Prevents clicks inside from closing the modal. */}
      <div 
        className="relative w-full max-w-[90vw] max-h-[95vh] aspect-video bg-black rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The close button */}
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 z-10 p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
          title="Close trailer"
        >
          <FiX size={24} />
        </button>

        {/* The React Player, configured for YouTube */}
        <ReactPlayer        
          src={videoUrl}
          playing={true}
          controls={true}
          width="100%"
          height="100%"
          style={{ borderRadius: '8px', overflow: 'hidden' }} // Match the container's rounded corners
        />
      </div>
    </div>
  );
};