import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { usePlayback } from '../../../hooks/usePlayback';
import { useUiContextStore } from '../../../store/uiContextStore';
import { WatchTrailerButton } from './WatchTrailerButton';
import { SmartPlayButton } from './SmartPlayButton';
import * as Dialog from '@radix-ui/react-dialog';
import type { SeriesInfo, Episode } from '../../../types/playlist';

interface SeriesDetailModalProps {
  series: SeriesInfo;
  onClose: () => void;
}

export const SeriesDetailModal = ({ series, onClose }: SeriesDetailModalProps) => {
  const { info, seasons, episodes } = series;
  
  const firstRealSeason = seasons.find(s => s.season_number !== 0)?.season_number || seasons[0]?.season_number || 1;
  const [selectedSeason, setSelectedSeason] = useState<number>(firstRealSeason);
  const currentEpisodes = episodes[selectedSeason] || [];

  const [activeBackdropIndex, setActiveBackdropIndex] = useState(0);
  const { play } = usePlayback();
  const setContext = useUiContextStore(state => state.setContext);

  useEffect(() => {
    if (!info.backdrop_path || info.backdrop_path.length <= 1) return;
    const intervalId = setInterval(() => {
      setActiveBackdropIndex((prevIndex) => (prevIndex + 1) % info.backdrop_path.length);
    }, 7000);
    return () => clearInterval(intervalId);
  }, [info.backdrop_path]);

  const handleEpisodePlay = (episode: Episode) => {
    setContext({ type: 'series', metadata: { seriesInfo: series } });
    play({ type: 'series', episode: episode });
    onClose();
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content 
          className="fixed inset-8 z-50 bg-background-primary rounded-lg overflow-hidden shadow-2xl shadow-primary/20 flex flex-col animate-in fade-in-0 zoom-in-95 max-w-desktop"
        >
          <Dialog.Title className="sr-only">Series Details: {info.name}</Dialog.Title>
          <Dialog.Description className="sr-only">Details and episodes for the series {info.name}</Dialog.Description>
          <Dialog.Close asChild>
            <button className="absolute top-3 right-3 z-30 p-2 bg-black/50 rounded-full text-text-primary hover:bg-white hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary-focus">
              <FiX size={20} />
            </button>
          </Dialog.Close>

          {/* --- THE FIX: ONE SINGLE SCROLLABLE CONTAINER --- */}
          <div className="h-full w-full overflow-y-auto">
            {/* --- SECTION 1: HEADER (Now scrolls with the content) --- */}
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-[40vh]">
                {info.backdrop_path?.map((url, index) => (
                  <img key={url + index} src={url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: index === activeBackdropIndex ? 0.2 : 0 }} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-background-primary via-background-primary/80 to-transparent" />
              </div>
              <div className="relative pt-24 px-6 pb-6">
                <div className="md:flex md:gap-6">
                  <div className="w-full md:w-48 lg:w-56 flex-shrink-0 text-center md:text-left">
                    <img src={info.cover} alt={info.name} className="rounded-lg shadow-lg w-1/2 md:w-full mx-auto" />
                  </div>
                  <div className="flex-1 mt-6 md:mt-0 text-text-primary self-end">
                    <h1 className="text-3xl lg:text-4xl font-extrabold">{info.name}</h1>
                    <div className="flex items-center flex-wrap gap-x-3 text-sm text-text-secondary mt-2">
                      <span>{info.releaseDate?.split('-')[0]}</span>
                      <span>•</span>
                      <span>{info.genre}</span>
                      <span>•</span>
                      <span className="font-bold text-primary-focus flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>
                        {parseFloat(info.rating_5based).toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-text-secondary max-w-3xl leading-relaxed line-clamp-3">{info.plot}</p>
                    <WatchTrailerButton youtubeId={info.youtube_trailer} className="max-w-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: EPISODE BROWSER (Now seamlessly part of the scroll) --- */}
            <div className="px-6 pb-6">
              <div className="border-t border-border-primary/50 pt-4">
                <h2 className="text-xl font-bold mb-4 text-text-primary">Seasons</h2>
                <div className="flex items-center gap-2 pb-4 -mx-2 px-2 overflow-x-auto">
                  {seasons.sort((a,b) => a.season_number - b.season_number).map(season => (
                    <button 
                      key={season.season_number} 
                      onClick={() => setSelectedSeason(season.season_number)}
                      className={`px-4 py-2 text-sm font-semibold rounded-md whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-focus ${selectedSeason === season.season_number ? 'bg-primary text-on-primary' : 'bg-background-secondary text-text-secondary hover:bg-background-glass'}`}
                    >
                      {season.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 pr-2 mt-4">
                  {currentEpisodes.map(episode => (
                    <>
                    <div 
                      key={episode.id} 
                      className="w-full text-left p-2 bg-background-secondary/80 rounded-lg hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary-focus transition-colors flex items-center gap-4"
                    >
                      <img src={episode.info.movie_image} alt="" className="w-28 h-auto aspect-video object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate">{episode.episode_num}. {episode.title}</p>
                      </div>
                      <SmartPlayButton variant='icon' onPlay={() => handleEpisodePlay(episode)} />
                    </div>
                    
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};