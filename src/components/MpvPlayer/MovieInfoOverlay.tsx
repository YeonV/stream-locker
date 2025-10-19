// src/components/MpvPlayer/MovieInfoOverlay.tsx

import { useUiContextStore } from '../../store/uiContextStore'; // We get context from here


// This component no longer needs props. It is a self-sufficient warrior.
export const MovieInfoOverlay = () => {
  const context = useUiContextStore(state => state.context);
  
  // The overlay is only visible for the 'movie' context and when paused.
  const isVisible = context?.type === 'movie';

  if (!isVisible) {
    return null;
  }

  // --- THE INTELLIGENCE GATHERING LOGIC ---
  // We have a guaranteed 'movie' context here.
  const movieSummary = context.movie;
  const movieDetails = context.movieInfo; // This is optional

  // We build the display data by prioritizing the detailed info,
  // but falling back to the summary info.
  const title = movieDetails?.name || movieSummary.name;
  const plot = movieDetails?.plot || 'No plot available.';
  const coverUrl = movieDetails?.cover_big || movieSummary.stream_icon;
  const rating = movieDetails?.rating ? `${parseFloat(movieDetails.rating).toFixed(1)} / 10` : `${(movieSummary.rating_5based / 2).toFixed(1)} / 5`;
  const year = movieDetails?.releasedate ? new Date(movieDetails.releasedate).getFullYear() : null;
  const genre = movieDetails?.genre || 'Unknown Genre';

  return (
    <div 
      className={`absolute inset-0 bg-black/60 backdrop-blur-md p-8 flex items-center justify-center overflow-y-auto
                  transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex max-w-4xl w-full space-x-8">
        {/* Left Side: Poster */}
        <div className="w-1/3 flex-shrink-0">
          {coverUrl && <img src={coverUrl} alt={title} className="w-full h-auto object-cover rounded-lg shadow-2xl" />}
        </div>
        
        {/* Right Side: Details */}
        <div className="w-2/3 text-white bg-black/50 p-6 rounded-lg">
          <h1 className="text-4xl font-extrabold">{title}</h1>
          <div className="flex items-center space-x-4 text-gray-400 mt-2">
            {year && <span>{year}</span>}
            {year && rating && <span>•</span>}
            {rating && <span className="font-bold text-yellow-400">⭐ {rating}</span>}
          </div>
          <p className="mt-4 text-gray-300 max-h-48 overflow-y-auto pr-2">{plot}</p>
          <div className="mt-6 text-sm">
            <strong className="text-gray-400">Genre:</strong> {genre}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieInfoOverlay;