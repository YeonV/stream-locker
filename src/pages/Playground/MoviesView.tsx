import { useState, useMemo, useRef, useEffect } from 'react';
import { MovieDetailModal } from './components/MovieDetailModal';
import { StreamRow } from './components/StreamRow';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Movie, PosterItem, Category, MovieInfo } from '../../types/playlist';
import { useElementSize } from '../../hooks/useElementSize';
import { useUiContextStore } from '../../store/uiContextStore';
import { useHotkeys } from 'react-hotkeys-hook';
import { sortByImagePresence } from '../../utils/sortByImagePresence';

const ROW_GAP_UNIT = 12;
const ROW_GAP_CLASS = `space-y-${ROW_GAP_UNIT}`;


export const MoviesView = () => {
    const parentRef = useRef<HTMLDivElement>(null);
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const xtreamApi = useApiStore((state) => state.xtreamApi);
    const [rowSizerRef, rowSizerMetrics] = useElementSize();
    const measuredRowHeight = rowSizerMetrics.height;
    const isReady = measuredRowHeight > 0;
    const focusedCoordinate = useUiContextStore(state => state.focusedCoordinate);
    const setFocusedCoordinate = useUiContextStore(state => state.setFocusedCoordinate);

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

    const sortedMoviesByCategory = useMemo(() => {
        const sortedMap = new Map<string, PosterItem[]>();
        for (const [categoryId, items] of moviesByCategory.entries()) {
            const sortedItems = [...items].sort(sortByImagePresence);
            sortedMap.set(categoryId, sortedItems);
        }
        return sortedMap;
    }, [moviesByCategory]);

    const handleMoviePosterClick = async (vodId: number) => { const info = await xtreamApi?.getMovieInfo(vodId); setSelectedMovie(info as MovieInfo); };
    const handleCloseModals = () => { setSelectedMovie(null);};

    const sizerCategory = moviesCategories[0];
    const sizerItems = sizerCategory ? (moviesByCategory.get(sizerCategory.category_id) || []).slice(0, 1) : [];



    useEffect(() => {
        if (focusedCoordinate === null) {
            setFocusedCoordinate({ row: 0, col: 0 });
        }
    }, []);

    useHotkeys('arrowup', (e) => {
        e.preventDefault();
        const currentRow = focusedCoordinate!.row;
        
        if (currentRow === 0) {
            // Exit to header
            // setFocusedCoordinate(null);
            // const headerLink = document.querySelector('#main-nav a') as HTMLElement;
            // headerLink?.focus();
        } else {
            const newRow = currentRow - 1;
            setFocusedCoordinate({ row: newRow, col: focusedCoordinate!.col });
        }
    }, { 
        enabled: (focusedCoordinate !== null) && (selectedMovie === null)
    });

        useHotkeys('arrowdown', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation()
        const maxIndex = moviesCategories.length - 1;
        const currentRow = focusedCoordinate!.row;

        if (currentRow < maxIndex) {
            const newRow = currentRow + 1;
            const itemWidth = 160; // w-40 = 160px
            const itemGap = 16; // mx-2 = 8px margin on each side = 16px total
            const containerWidth = parentRef.current?.clientWidth || 0;
            const itemsPerPage = Math.floor(containerWidth / (itemWidth + itemGap));
            setFocusedCoordinate({ row: newRow, col: focusedCoordinate!.col > itemsPerPage - 1 ? 0 : focusedCoordinate!.col });
        }
    }, { 
        enabled: (focusedCoordinate !== null) && (selectedMovie === null)
    });

    return (
        <div ref={parentRef}
            className={`h-full w-full px-4 overflow-auto focus:outline-none ${ROW_GAP_CLASS}`}
        >
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
                <>
                    {moviesCategories.map((category, index) => {
                        const sortedItems = sortedMoviesByCategory.get(category.category_id) || [];
                        if (sortedItems.length === 0) return null;

                        return (
                            <StreamRow
                                key={category.category_id}
                                title={category.category_name}
                                streams={sortedItems}
                                onPosterClick={handleMoviePosterClick}
                                rowIndex={index}
                                selected={selectedMovie}
                            />
                        );
                    })}
                </>
            )}
            
            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
        </div>
    );
};