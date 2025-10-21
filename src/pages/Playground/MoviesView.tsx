import { useState, useMemo, useRef, useCallback } from 'react'; // Added useCallback
import { MovieDetailModal } from './components/MovieDetailModal';
import { StreamRow } from './components/StreamRow';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Movie, PosterItem, Category, MovieInfo } from '../../types/playlist';
import { useElementSize } from '../../hooks/useElementSize';
import { usePlaygroundContext } from '../../context/PlaygroundContext'; // Import our context hook

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

// We no longer need ROW_ESTIMATED_HEIGHT or ROW_GAP constants.

export const MoviesView = () => {
    // --- All original state and memoization is unchanged ---
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

    // --- NEW: Connect to the Parent's Navigation System ---
    const { registerContentRef } = usePlaygroundContext();
    const virtualizerParentRef = useRef<HTMLDivElement>(null);

    // This callback ref is the magic. It assigns the DOM node to BOTH refs.
    const combinedRef = useCallback((node: HTMLDivElement | null) => {
        // 1. Assign to the ref for the virtualizer
        virtualizerParentRef.current = node;
        // 2. Register this node with the parent layout
        registerContentRef(node);
    }, [registerContentRef]);
    // --- END NEW ---

    const rowVirtualizer = useVirtualizer({
        count: moviesCategories.length,
        // The virtualizer now gets its ref from our local variable
        getScrollElement: () => virtualizerParentRef.current,
        estimateSize: () => isReady ? measuredRowHeight + ROW_GAP_PX : 300 + ROW_GAP_PX,
        overscan: 3,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    const sizerCategory = moviesCategories[0];
    const sizerItems = sizerCategory ? (moviesByCategory.get(sizerCategory.category_id) || []).slice(0, 5) : [];

    return (
        // Assign the combinedRef and add tabIndex to make the container focusable
        <div ref={combinedRef} tabIndex={-1} className={`h-full w-full px-4 overflow-auto focus:outline-none ${ROW_GAP_CLASS}`}>
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
                    {virtualRows.map((virtualRow, rowIndex) => {
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
                                    rowIndex={rowIndex}
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