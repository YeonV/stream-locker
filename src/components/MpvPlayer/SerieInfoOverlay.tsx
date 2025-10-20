// src/components/player/SerieInfoOverlay.tsx

import { useState } from 'react';
import { usePlayback } from '../../hooks/usePlayback';
import { FiPlay } from 'react-icons/fi';
import { useUiContextStore } from '../../store/uiContextStore';

export const SerieInfoOverlay = () => {
  const context = useUiContextStore(state => state.context);
  const { play } = usePlayback();
  
  // --- STEP 1: Always assume we have data. Get the hooks out of the way. ---
  // If the context is not 'series', these variables will be `undefined`, but that's okay.
  const isVisible = context?.type === 'series';
  const seriesInfo = isVisible ? context.metadata.seriesInfo : null;
  
  // We MUST call the hook unconditionally. We give it a default value for when seriesInfo is null.
  const [selectedSeason, setSelectedSeason] = useState<number>(() => {
    if (seriesInfo) {
      const firstRealSeason = seriesInfo.seasons.find(s => s.season_number !== 0)?.season_number || seriesInfo.seasons[0]?.season_number || 1;
      return firstRealSeason;
    }
    return 1; // Default fallback
  });

  // --- STEP 2: The Guard. Now it is safe. ---
  // The hooks have been called. Now we can check if we should render anything.
  if (!seriesInfo) {
    return null;
  }
  
  // If we are here, we know `seriesInfo` is not null. We can safely destructure it.
  const { info, seasons, episodes } = seriesInfo;
  const currentEpisodes = episodes[selectedSeason] || [];

  return (
    // This is a semi-transparent overlay that sits on top of the paused video
    <div className={`absolute inset-0 bg-black/60 backdrop-blur-md p-8 flex flex-col items-center justify-center overflow-y-auto
                  transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* --- HEADER SECTION --- */}
      <div className="flex-shrink-0 mb-8">
        <div className="md:flex md:space-x-8">
          {/* Cover Image */}
          <div className="w-full md:w-[200px] flex-shrink-0">
            <img src={info.cover} alt={info.name} className="rounded-lg shadow-lg w-1/2 md:w-full mx-auto" />
          </div>
          {/* Core Info */}
          <div className="flex-1 mt-6 md:mt-0 text-white self-end">
            <h1 className="text-3xl lg:text-4xl font-extrabold">{info.name}</h1>
            <div className="flex items-center space-x-4 text-gray-400 mt-2">
              <span>{info.releaseDate.split('-')[0]}</span>
              <span>•</span>
              <span>{info.genre}</span>
              <span>•</span>
              <span className="font-bold text-yellow-400">⭐ {parseFloat(info.rating_5based).toFixed(1)}</span>
            </div>
            <p className="mt-4 text-gray-300 max-w-3xl text-sm">{info.plot}</p>
          </div>
        </div>
      </div>

      {/* --- EPISODE BROWSER SECTION --- */}
      <div className="flex-1 min-h-0">
        <h2 className="text-xl font-bold mb-4">Seasons</h2>
        <div className="flex items-center space-x-2 pb-4 overflow-x-auto">
          {seasons.sort((a,b) => a.season_number - b.season_number).map(season => (
            <button 
              key={season.season_number} 
              onClick={() => setSelectedSeason(season.season_number)}
              className={`px-4 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${selectedSeason === season.season_number ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {season.name}
            </button>
          ))}
        </div>
        <div className="space-y-2 pr-2 mt-4 max-h-[40vh] overflow-y-auto">
          {currentEpisodes.map(episode => (
            <button 
              onClick={() => play({ type: 'series', episode: episode })} 
              key={episode.id} 
              className="w-full text-left p-2 bg-gray-800/80 rounded hover:bg-gray-700 transition-colors flex items-center space-x-4"
            >
              <img src={episode.info.movie_image} alt="" className="w-24 h-auto aspect-video object-cover rounded shadow-md" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{episode.episode_num}. {episode.title}</p>
              </div>
              <FiPlay className="text-xl text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};