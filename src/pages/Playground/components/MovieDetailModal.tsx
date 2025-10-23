import { FiX } from 'react-icons/fi';
import { usePlayback } from '../../../hooks/usePlayback';
import { useUiContextStore } from '../../../store/uiContextStore';
import { SmartPlayButton } from './SmartPlayButton';
import { WatchTrailerButton } from './WatchTrailerButton';
import * as Dialog from '@radix-ui/react-dialog';
import type { Movie, MovieInfo } from '../../../types/playlist';
import { FocusTrap } from 'focus-trap-react';
import { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface MovieDetailModalProps {
  movie: MovieInfo;
  onClose: () => void;
}

export const MovieDetailModal = ({ movie, onClose }: MovieDetailModalProps) => {
  const { info, movie_data } = movie;
  const backdropUrl = info.backdrop_path?.[0];

  const setUiContext = useUiContextStore(state => state.setContext);
  const { play } = usePlayback();
  const lockFocus = useUiContextStore(state => state.lockFocus);
  const isFocusLocked = useUiContextStore(state => state.isFocusLocked);
  const actionsContainerRef = useRef<HTMLDivElement>(null);

  useHotkeys('MediaRewind', onClose, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  });

  const handlePlayClick = () => {
    if (typeof movie_data.stream_id === 'number') {
      lockFocus();
      setUiContext({ type: 'movie', movie: movie_data as Movie, movieInfo: info });
      play({ type: 'movie', movie: { ...(movie_data as Movie) } });
      onClose();
    }
  };

  if (!movie || !info) return null;

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content 
          className="fixed inset-4 z-50 bg-background-primary rounded-lg overflow-hidden shadow-2xl shadow-primary/20 animate-in fade-in-0 zoom-in-95 max-w-desktop"
        >
          <Dialog.Title className="sr-only">Movie Details: {info.name}</Dialog.Title>
          <Dialog.Description className="sr-only">Details and actions for the selected movie.</Dialog.Description>
          <FocusTrap
            active={!isFocusLocked} 
            focusTrapOptions={{
              initialFocus: () => actionsContainerRef.current?.querySelector('button') as HTMLElement,
              returnFocusOnDeactivate: false
              // onDeactivate: onClose,
              // clickOutsideDeactivates: true,
            }}
          >
            <div className="h-full w-full"> 
              <Dialog.Close asChild>
                <button className="absolute top-3 right-3 z-20 p-2 bg-black/50 rounded-full text-text-primary hover:bg-white hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary-focus">
                  <FiX size={20} />
                </button>
              </Dialog.Close>

              <div className="h-full w-full overflow-y-auto">
                {/* --- SECTION 1: VISUALS --- */}
                <div className="relative h-[25vh] md:h-[30vh]">
                  {backdropUrl && (
                    <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background-primary to-transparent" />
                </div>
                  
                {/* --- SECTION 2: CONTENT --- */}
                {/* This is the Flex container that lays out the two columns */}
                <div className="relative -mt-20 px-4 pb-8 sm:px-6 md:flex md:gap-6">
                  
                  {/* Left Side: Poster and Actions */}
                  <div className="w-full md:w-48 lg:w-56 flex-shrink-0 text-center">
                    <img src={info.cover_big} alt={info.name} className="rounded-lg shadow-lg w-1/2 md:w-full mx-auto" />
                    <div ref={actionsContainerRef} className="mt-4 space-y-2">
                      <SmartPlayButton onPlay={handlePlayClick} />
                      <WatchTrailerButton youtubeId={info.youtube_trailer} />
                    </div>
                  </div>

                  {/* --- FIX IS HERE --- */}
                  {/* Right Side: Details. This was moved back INSIDE the md:flex container. */}
                  <div className="flex-1 mt-6 md:mt-0 text-text-primary">
                    <h1 className="text-3xl font-extrabold">{info.name}</h1>
                    <div className="flex items-center flex-wrap gap-x-3 text-sm text-text-secondary mt-2">
                      <span>{info.releasedate?.split('-')[0]}</span>
                      <span>•</span>
                      <span>{info.duration}</span>
                      <span>•</span>
                      <span className="font-bold text-primary-focus flex items-center gap-1">
                        <svg /* ... */ ></svg>
                        {parseFloat(info.rating).toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-text-secondary leading-relaxed">{info.plot}</p>
                    <div className="mt-5 border-t border-border-primary pt-3 text-xs space-y-2">
                      <div className="flex"><strong className="w-20 flex-shrink-0 text-text-tertiary">Starring:</strong> <span className="flex-1">{info.actors}</span></div>
                      <div className="flex"><strong className="w-20 flex-shrink-0 text-text-tertiary">Director:</strong> <span className="flex-1">{info.director}</span></div>
                      <div className="flex"><strong className="w-20 flex-shrink-0 text-text-tertiary">Genre:</strong> <span className="flex-1">{info.genre}</span></div>
                      <div className="flex"><strong className="w-20 flex-shrink-0 text-text-tertiary">Details:</strong> <span className="font-mono">{info.video?.width}x{info.video?.height} | {info.audio?.channel_layout} | {movie_data.container_extension?.toUpperCase()}</span></div>
                    </div>
                  </div>
                  {/* --- END OF FIX --- */}

                </div>
                {/* The "Right Side: Details" div was previously here by mistake. */}
              </div>
            </div>
          </FocusTrap>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};