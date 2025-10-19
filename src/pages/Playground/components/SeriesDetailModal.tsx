import { useState, useEffect } from 'react';
import { FiPlay, FiX, FiYoutube } from 'react-icons/fi';
import { TrailerPlayerModal } from './TrailerPlayerModal';
import type { SeriesInfo } from '../../../types/playlist';
import { usePlayback } from '../../../hooks/usePlayback';
import { PlayerWidget } from '../../../components/PlayerWidget';
import { useUiContextStore } from '../../../store/uiContextStore';

// --- Complete and Accurate Types based on your get_series_info JSON ---

interface SeriesDetailModalProps {
  series: SeriesInfo;
  onClose: () => void;
}

export const SeriesDetailModal = ({ series, onClose }: SeriesDetailModalProps) => {
  const { info, seasons, episodes } = series;
  
  // Find the first "real" season to select by default, not "Extras"
  const firstRealSeason = seasons.find(s => s.season_number !== 0)?.season_number || seasons[0]?.season_number || 1;
  const [selectedSeason, setSelectedSeason] = useState<number>(firstRealSeason);
  
  const currentEpisodes = episodes[selectedSeason] || [];

  const [activeBackdropIndex, setActiveBackdropIndex] = useState(0);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const { play } = usePlayback();
  const setContext = useUiContextStore(state => state.setContext);


  useEffect(() => {
    if (!info.backdrop_path || info.backdrop_path.length <= 1) return;
    const intervalId = setInterval(() => {
      setActiveBackdropIndex((prevIndex) => (prevIndex + 1) % info.backdrop_path.length);
    }, 7000);
    return () => clearInterval(intervalId);
  }, [info.backdrop_path]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative bg-gray-900/70 w-full max-w-7xl h-full md:max-h-[95vh] rounded-lg overflow-hidden shadow-2xl shadow-blue-500/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 bg-black/50 rounded-full text-white hover:bg-white hover:text-black transition-colors"><FiX size={24} /></button>

        {/* --- SECTION 1: TOP HEADER (NON-SCROLLING) --- */}
        <div className="relative flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-full">
            {info.backdrop_path?.map((url, index) => (
              <img key={url + index} src={url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: index === activeBackdropIndex ? 0.3 : 0 }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
          </div>
          <div className="relative pt-8 md:pt-16 px-8 pb-6">
            <div className="md:flex md:space-x-8">
              <div className="w-full md:w-[280px] flex-shrink-0 text-center md:text-left">
                <img src={info.cover} alt={info.name} className="rounded-lg shadow-lg w-2/3 md:w-full mx-auto" />
                <div className="mt-4 space-y-2">
                  {/* <button className="w-full flex items-center justify-center p-3 bg-blue-600 rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors">
                    <FiPlay className="mr-2" /> Watch Now
                  </button> */}
                  {info.youtube_trailer && (
                    <button
                      onClick={() => setIsTrailerPlaying(true)}
                      className="w-full flex items-center justify-center p-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      <FiYoutube className="mr-2 text-red-500" /> Watch Trailer
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 mt-6 md:mt-0 text-white self-end">
                <h1 className="text-4xl lg:text-5xl font-extrabold">{info.name}</h1>
                <div className="flex items-center space-x-4 text-gray-400 mt-2">
                  <span>{info.releaseDate.split('-')[0]}</span>
                  <span>•</span>
                  <span>{info.genre}</span>
                  <span>•</span>
                  <span className="font-bold text-yellow-400">⭐ {parseFloat(info.rating_5based).toFixed(1)}</span>
                </div>
                <p className="mt-4 text-gray-300 max-w-3xl pb-4">{info.plot}</p>
                <PlayerWidget hideWhenIdle />
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: EPISODE BROWSER (SCROLLABLE) --- */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          <div className="border-t border-gray-700/50 pt-6">
            <h2 className="text-2xl font-bold mb-4">Seasons</h2>
            <div className="flex items-center space-x-2 pb-4 overflow-x-auto">
              {seasons.sort((a,b) => a.season_number - b.season_number).map(season => (
                <button 
                  key={season.season_number} 
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${selectedSeason === season.season_number ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {season.name}
                </button>
              ))}
            </div>
            <div className="space-y-2 pr-2 mt-4">
              {currentEpisodes.map(episode => (
                <button onClick={()=>{
                  setContext({ type: 'series', metadata: { seriesInfo: series } });
                  play({
                    type: 'series',
                    episode: episode,
                  })}} 
                  key={episode.id} className="w-full text-left p-3 bg-gray-800/80 rounded hover:bg-gray-700 transition-colors flex items-center space-x-4">
                  <img src={episode.info.movie_image} alt="" className="w-32 h-auto aspect-video object-cover rounded shadow-md" />
                  <div className="flex-1">
                    <p className="font-semibold">{episode.episode_num}. {episode.title}</p>
                  </div>
                  <FiPlay className="text-2xl text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {isTrailerPlaying && info.youtube_trailer && (
        <TrailerPlayerModal
          youtubeId={info.youtube_trailer}
          onClose={() => setIsTrailerPlaying(false)}
        />
      )}
    </div>
  );
};