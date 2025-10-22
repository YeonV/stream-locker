import { useState, useMemo, useRef, useEffect, useCallback  } from 'react'; // --- NEW: Added useEffect ---
import { MovieDetailModal } from './components/MovieDetailModal';
import { StreamRow } from './components/StreamRow';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Movie, PosterItem, Category, MovieInfo } from '../../types/playlist';
import { useElementSize } from '../../hooks/useElementSize';

// --- No changes to this section ---
const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
    const aHasValidImage = a.imageUrl && (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) && !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    const bHasValidImage = b.imageUrl && (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) && !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    if (aHasValidImage && !bHasValidImage) { return -1; }
    if (!aHasValidImage && bHasValidImage) { return 1; }
    return 0;
};

const ROW_GAP_UNIT = 12;
const ROW_GAP_PX = ROW_GAP_UNIT * 4;
const ROW_GAP_CLASS = `space-y-${ROW_GAP_UNIT}`;
// --- End of unchanged section ---


export const MoviesView = () => {
    // --- All state and memoization is unchanged ---
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const xtreamApi = useApiStore((state) => state.xtreamApi);
    const [rowSizerRef, rowSizerMetrics] = useElementSize();
    const measuredRowHeight = rowSizerMetrics.height;
    const isReady = measuredRowHeight > 0;
    // --- END NEW ---

    // Data memoization logic is unchanged and correct
    const moviesStreamsById = useMemo(() => {
        const map = new Map<number, Movie>();
        for (const stream of moviesStreams) {
            map.set(stream.stream_id, stream);
        }
        return map;
    }, [moviesStreams]);
    
    const movieItemsBase: PosterItem[] = useMemo(() => moviesStreams.map(movie => ({
        id: movie.stream_id, name: movie.name, imageUrl: movie.stream_icon, rating: movie.rating_5based, added: movie.added,
    })), [moviesStreams]);

    const moviesByCategory = useMemo(() => {
        const map = new Map<string, PosterItem[]>();
        for (const category of moviesCategories) {
            const items: PosterItem[] = [];
            for (const item of movieItemsBase) {
                const rawItem = moviesStreamsById.get(item.id);
                if (rawItem?.category_ids?.includes(Number(category.category_id))) {
                    items.push(item);
                }
            }
            map.set(category.category_id, items);
        }
        return map;
    }, [moviesCategories, movieItemsBase, moviesStreamsById]);

    const handleMoviePosterClick = async (vodId: number) => { const info = await xtreamApi?.getMovieInfo(vodId); setSelectedMovie(info as MovieInfo); };
    const handleCloseModals = () => { setSelectedMovie(null);};

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: moviesCategories.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => isReady ? measuredRowHeight + ROW_GAP_PX : 300 + ROW_GAP_PX,
        overscan: 3,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    const sizerCategory = moviesCategories[0];
    const sizerItems = sizerCategory ? (moviesByCategory.get(sizerCategory.category_id) || []).slice(0, 5) : [];

    // useEffect(() => {
    //     if (isReady && moviesCategories.length > 0) {
    //         const firstCategoryName = moviesCategories[0].category_name;
    //         const sanitizedName = firstCategoryName.replace(/\s+/g, '-');
    //         const selector = `[data-testid="trap-button-${sanitizedName}"]`;
            
    //         const firstTrapButton = document.querySelector(selector) as HTMLElement;

    //         if (firstTrapButton) {
    //             firstTrapButton.focus();
    //         }
    //     }
    // }, [isReady, moviesCategories]);

    const [needsFocus, setNeedsFocus] = useState(false);
  
    const handleHeaderKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setNeedsFocus(true);
      }
    }, []);

    useEffect(() => {
      const headerNavElement = document.getElementById('main-nav');
      if (!headerNavElement) return;

      headerNavElement.addEventListener('keydown', handleHeaderKeyDown);
      return () => {
        headerNavElement.removeEventListener('keydown', handleHeaderKeyDown);
      };
    }, [handleHeaderKeyDown]);

    // This is the "effector" useEffect, now using the correct ref.
    useEffect(() => {
      if (needsFocus) {
        const timer = setTimeout(() => {
          // --- CHANGE IS HERE: Use the existing parentRef ---
          const targetElement = parentRef.current?.querySelector('[data-testid^="trap-button-"]') as HTMLElement | null;
          
          if (targetElement) {
            targetElement.focus();
          }
          setNeedsFocus(false);
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [needsFocus]);

    // This is your original useEffect for initial focus on load.
    // Let's now COMBINE it with the needsFocus logic to avoid conflicts.
    // We can set needsFocus to true on initial load.

    // --- REVISED INITIAL FOCUS ---
    useEffect(() => {
      if (isReady && moviesCategories.length > 0) {
        // Instead of focusing directly, we trigger our robust Dashboard-style mechanism.
        setNeedsFocus(true);
      }
    // We remove the direct focus logic from here.
    }, [isReady, moviesCategories.length]);

    return (
        <div ref={parentRef} className={`h-full w-full px-4 overflow-auto focus:outline-none ${ROW_GAP_CLASS}`}>
            <div ref={rowSizerRef} className="invisible absolute -z-10 w-full">
                {sizerItems.length > 0 && (
                    <StreamRow
                        title="Sizer"
                        streams={sizerItems}
                        onPosterClick={() => {}}
                    />
                )}
            </div>

            {isReady && (
                <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    {virtualRows.map((virtualRow) => {
                        const category = moviesCategories[virtualRow.index];
                        if (!category) return null;

                        const items = moviesByCategory.get(category.category_id) || [];
                        if (items.length === 0) return null;

                        const sortedItems = [...items].sort(sortByImagePresence);

                        return (
                            <div
                                key={category.category_id}
                                className="absolute top-0 left-0 w-full"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <StreamRow
                                    title={category.category_name}
                                    streams={sortedItems}
                                    onPosterClick={handleMoviePosterClick}
                                />
                            </div>
                        )
                    })}
                </div>
            )}
            
            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
        </div>
    );
};