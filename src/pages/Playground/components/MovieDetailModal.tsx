import { useEffect, useState } from 'react';
import { FiPlay, FiX, FiYoutube } from 'react-icons/fi';
import { TrailerPlayerModal } from './TrailerPlayerModal';
import { usePlayback } from '../../../hooks/usePlayback';
import type { Movie, MovieInfo } from '../../../types/playlist';
import { PlayerWidget } from '../../../components/PlayerWidget';
import { useUiContextStore } from '../../../store/uiContextStore';

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
    console.log('Playing movie:', movie_data);
    if (typeof movie_data.stream_id === 'number') {
      setUiContext({ type: 'movie', movie: movie_data as Movie, movieInfo: info });
      play({
        type: 'movie',
        movie: {
          ...(movie_data as Movie)
        }
      });
    }
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.history.pushState({ modal: 'movieDetail' }, '');
    const handlePopState = () => onClose();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modal === 'movieDetail') window.history.back();
    };
  }, [onClose]);

  if (!movie || !info) return null;

  return (
    // The main container with a blurred backdrop
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center"
      onClick={onClose} // Close when clicking the backdrop
    >
      <div 
        className="relative bg-gray-900/80 w-full max-w-5xl h-full md:h-auto md:max-h-[80vh] rounded-lg overflow-hidden shadow-2xl shadow-blue-500/20"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-white hover:text-black transition-colors">
          <FiX size={24} />
        </button>

        {/* Backdrop Image */}
        {backdropUrl && (
          <div className="absolute top-0 left-0 w-full h-1/2">
            <img src={backdropUrl} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
        )}

        {/* Main Content */}
        <div className="relative pt-8 md:pt-32 p-8 overflow-y-auto h-full">
          <div className="md:flex md:space-x-8">
            {/* Left Side: Poster and Actions */}
            <div className="w-full md:w-1/3 flex-shrink-0 text-center">
              <img src={info.cover_big} alt={info.name} className="rounded-lg shadow-lg w-2/3 md:w-full mx-auto" />
              <div className="mt-4 space-y-2">
                <button onClick={handlePlayClick} className="w-full flex items-center justify-center p-3 bg-blue-600 rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors">
                  <FiPlay className="mr-2" /> Play
                </button>
                <button 
                  onClick={() => setIsTrailerPlaying(true)}
                  className="w-full flex items-center justify-center p-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  <FiYoutube className="mr-2 text-red-500" /> Watch Trailer
                </button>
              </div>
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-2/3 mt-8 md:mt-0 text-white">
              <h1 className="text-4xl font-extrabold">{info.name}</h1>
              <div className="flex items-center space-x-4 text-gray-400 mt-2">
                <span>{info.releasedate?.split('-')[0]}</span>
                <span>•</span>
                <span>{info.duration}</span>
                <span>•</span>
                <span className="font-bold text-yellow-400">⭐ {parseFloat(info.rating).toFixed(1)}</span>
              </div>
              <p className="mt-4 text-gray-300">{info.plot}</p>
              
              <div className="mt-6 border-t border-gray-700 pt-4 text-sm space-y-2">
                <div className="flex"><strong className="w-24 text-gray-400">Starring:</strong> <span className="flex-1">{info.actors}</span></div>
                <div className="flex"><strong className="w-24 text-gray-400">Director:</strong> <span className="flex-1">{info.director}</span></div>
                <div className="flex"><strong className="w-24 text-gray-400">Genre:</strong> <span className="flex-1">{info.genre}</span></div>
                <div className="flex"><strong className="w-24 text-gray-400">Details:</strong> <span className="font-mono">{info.video.width}x{info.video.height} | {info.audio.channel_layout} | {movie_data.container_extension?.toUpperCase()}</span></div>
              </div>
            </div>
          </div>
        </div>
        <PlayerWidget  />
      </div>
      {isTrailerPlaying && (
        <TrailerPlayerModal 
          youtubeId={info.youtube_trailer}
          onClose={() => setIsTrailerPlaying(false)}
        />
      )}
    </div>
  );
};