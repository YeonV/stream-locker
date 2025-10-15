import { useState, useMemo, useRef } from 'react';
import { MovieDetailModal, type MovieInfo } from './components/MovieDetailModal';
import { StreamRow } from './components/StreamRow';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Movie, PosterItem, Category } from '../../types/playlist';

const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
    const aHasValidImage = a.imageUrl && (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) && !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    const bHasValidImage = b.imageUrl && (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) && !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    if (aHasValidImage && !bHasValidImage) { return -1; }
    if (!aHasValidImage && bHasValidImage) { return 1; }
    return 0;
};

const ROW_GAP = 64;
const ROW_ESTIMATED_HEIGHT = 450 + 36 + 32 + ROW_GAP;

export const MoviesView = () => {
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);

    const xtreamApi = useApiStore((state) => state.xtreamApi);

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
        estimateSize: () => ROW_ESTIMATED_HEIGHT,
        overscan: 5,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    return (
        <div ref={parentRef} className="h-full w-full px-4 overflow-auto">
            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {virtualRows.map(virtualRow => {
                    const category = moviesCategories[virtualRow.index];
                    if (!category) return null;

                    const items = moviesByCategory.get(category.category_id) || [];
                    if (items.length === 0) return null;

                    const sortedItems = [...items].sort(sortByImagePresence);

                    return (
                        <div
                            key={category.category_id}
                            // --- THIS IS THE CHANGE (Part 2) ---
                            // We add padding-bottom to the virtual container to create the visual space.
                            className="absolute top-0 left-0 w-full pb-16"
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
                    );
                })}
            </div>

            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
        </div>
    );
};