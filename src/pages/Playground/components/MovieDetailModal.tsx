import { useState } from 'react';
import { FiPlay, FiX, FiYoutube } from 'react-icons/fi';
import { TrailerPlayerModal } from './TrailerPlayerModal';
import { usePlayback } from '../../../hooks/usePlayback';
import type { Movie, MovieInfo } from '../../../types/playlist';
// import { PlayerWidget } from '../../../components/PlayerWidget';
import { useUiContextStore } from '../../../store/uiContextStore';
import * as Dialog from '@radix-ui/react-dialog';

interface MovieDetailModalProps {
  movie: MovieInfo;
  onClose: () => void;
}

export const MovieDetailModal = ({ movie, onClose }: MovieDetailModalProps) => {
  const { info, movie_data } = movie;
  const backdropUrl = info.backdrop_path?.[0];

  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const setUiContext = useUiContextStore(state => state.setContext);
  const { play } = usePlayback();

  const handlePlayClick = () => {
    if (typeof movie_data.stream_id === 'number') {
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
          className="fixed inset-4 z-50 bg-background-primary rounded-lg overflow-hidden shadow-2xl shadow-primary/20 animate-in fade-in-0 zoom-in-95"
        >
          <Dialog.Close asChild>
            <button className="absolute top-3 right-3 z-20 p-2 bg-black/50 rounded-full text-text-primary hover:bg-white hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary-focus">
              <FiX size={20} />
            </button>
          </Dialog.Close>

          <div className="h-full w-full overflow-y-auto">
            {/* --- SECTION 1: VISUALS --- */}
            {/* FURTHER REDUCED backdrop height. This is the biggest change. */}
            <div className="relative h-[25vh] md:h-[30vh]">
              {backdropUrl && (
                <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background-primary to-transparent" />
            </div>

            {/* --- SECTION 2: CONTENT --- */}
            {/* FURTHER REDUCED negative margin */}
            <div className="relative -mt-20 px-4 pb-8 sm:px-6 md:flex md:gap-6">
              {/* Left Side: Poster and Actions */}
              {/* FURTHER REDUCED width of the poster container */}
              <div className="w-full md:w-48 lg:w-56 flex-shrink-0 text-center">
                <img src={info.cover_big} alt={info.name} className="rounded-lg shadow-lg w-1/2 md:w-full mx-auto" />
                <div className="mt-4 space-y-2">
                  {/* FURTHER REDUCED padding and text size */}
                  <button onClick={handlePlayClick} className="w-full flex items-center justify-center p-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:ring-primary-focus">
                    <FiPlay className="mr-2" /> Play
                  </button>
                  {info.youtube_trailer && (
                    <button 
                      onClick={() => setIsTrailerPlaying(true)}
                      className="w-full flex items-center justify-center p-2 bg-background-secondary rounded-lg font-semibold text-xs hover:bg-background-glass transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:ring-primary-focus"
                    >
                      <FiYoutube className="mr-2 text-red-500" /> Watch Trailer
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="flex-1 mt-6 md:mt-0 text-text-primary">
                <h1 className="text-3xl font-extrabold">{info.name}</h1>
                <div className="flex items-center flex-wrap gap-x-3 text-sm text-text-secondary mt-2">
                  <span>{info.releasedate?.split('-')[0]}</span>
                  <span>•</span>
                  <span>{info.duration}</span>
                  <span>•</span>
                  <span className="font-bold text-primary-focus flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>
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
            </div>
            
            {/* <PlayerWidget /> */}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      {isTrailerPlaying && (
        <TrailerPlayerModal 
          youtubeId={info.youtube_trailer}
          onClose={() => setIsTrailerPlaying(false)}
        />
      )}
    </Dialog.Root>
  );
};