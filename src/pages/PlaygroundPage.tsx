import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MovieDetailModal, type MovieInfo } from './Playground/components/MovieDetailModal';
import { SeriesDetailModal, type SeriesInfo } from './Playground/components/SeriesDetailModal';
import { CategoryBrowser } from './Playground/components/CategoryBrowser';
import { StreamRow } from './Playground/components/StreamRow';
import { CategoryView } from './Playground/components/CategoryView';
import { LiveCategoryView } from './Playground/components/LiveCategoryView';
import { useDataStore } from '../store/dataStore';
import type { LiveStream, Movie, PosterItem, Serie, Category } from '../types/playlist';
import { useApiStore } from '../store/apiStore';

const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
    const aHasValidImage = a.imageUrl && (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) && !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    const bHasValidImage = b.imageUrl && (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) && !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    if (aHasValidImage && !bHasValidImage) { return -1; }
    if (!aHasValidImage && bHasValidImage) { return 1; }
    return 0;
};

export const PlaygroundPage = () => {
    const liveStreams: LiveStream[] = useDataStore(state => state.liveStreams);
    const liveCategories: Category[] = useDataStore(state => state.liveCategories);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const series: Serie[] = useDataStore(state => state.series);
    const seriesCategories: Category[] = useDataStore(state => state.seriesCategories);
   
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' | 'livetv' } | null>(null);

    const xtreamApi = useApiStore((state) => state.xtreamApi);

    const handleCategoryClick = (categoryId: string, categoryName: string, type: 'movie' | 'series' | 'livetv') => {
        setActiveCategory({ id: categoryId, name: categoryName, type });
    };

    const movieItemsBase: PosterItem[] = useMemo(() => moviesStreams.map(movie => ({
        id: movie.stream_id, name: movie.name, imageUrl: movie.stream_icon, rating: movie.rating_5based, added: movie.added,
    })), [moviesStreams]);

    const seriesItemsBase: PosterItem[] = useMemo(() => series.map(s => ({
        id: s.series_id, name: s.name, imageUrl: s.cover, rating: parseFloat(s.rating_5based) || 0, added: s.last_modified,
    })), [series]);

    const itemsForActiveCategory = useMemo((): PosterItem[] => {
        if (!activeCategory || activeCategory.type === 'livetv') return [];
        if (activeCategory.id === 'all') {
            return activeCategory.type === 'movie' ? movieItemsBase : seriesItemsBase;
        }
        if (activeCategory.type === 'movie') {
            return moviesStreams
                .filter(stream => stream.category_ids?.includes(Number(activeCategory.id)))
                .map(movie => ({ id: movie.stream_id, name: movie.name, imageUrl: movie.stream_icon, rating: movie.rating_5based, added: movie.added }));
        }
        if (activeCategory.type === 'series') {
            return series
                .filter(s => s.category_ids?.includes(Number(activeCategory.id)))
                .map(s => ({ id: s.series_id, name: s.name, imageUrl: s.cover, rating: parseFloat(s.rating_5based) || 0, added: s.last_modified }));
        }
        return [];
    }, [activeCategory, moviesStreams, series, movieItemsBase, seriesItemsBase]);
    
    // --- THIS IS THE NEW LOGIC ---
    const liveStreamsForActiveCategory = useMemo((): LiveStream[] => {
        if (activeCategory?.type !== 'livetv') return [];
        return liveStreams.filter(stream => stream.category_ids?.includes(Number(activeCategory.id)));
    }, [activeCategory, liveStreams]);
    // --- END OF NEW LOGIC ---

    const moviesCategoriesWithAll = useMemo(() => [{ category_id: 'all', category_name: 'ALL MOVIES', parent_id: 0 }, ...moviesCategories], [moviesCategories]);
    const seriesCategoriesWithAll = useMemo(() => [{ category_id: 'all', category_name: 'ALL SERIES', parent_id: 0 }, ...seriesCategories], [seriesCategories]);

    const moviesByCategory = useMemo(() => {
        const map = new Map<string, PosterItem[]>();
        for (const category of moviesCategories) {
            const items = movieItemsBase.filter(item => {
                const rawItem = moviesStreams.find(s => s.stream_id === item.id);
                return rawItem?.category_ids?.includes(Number(category.category_id));
            });
            map.set(category.category_id, items);
        }
        return map;
    }, [moviesCategories, movieItemsBase, moviesStreams]);

    const handleMoviePosterClick = async (vodId: number) => { const info = await xtreamApi?.getMovieInfo(vodId); setSelectedMovie(info as MovieInfo); };
    const handleSeriesPosterClick = async (seriesId: number) => { const info = await xtreamApi?.getSeriesInfo(seriesId); setSelectedSeries(info as SeriesInfo); };
    const handleCloseModals = () => { setSelectedMovie(null); setSelectedSeries(null); };

    // --- THIS IS THE FINAL RENDER LOGIC ---
    if (activeCategory) {
        if (activeCategory.type === 'livetv') {
            return (
                <LiveCategoryView
                    categoryName={activeCategory.name}
                    channels={liveStreamsForActiveCategory}
                    onBack={() => setActiveCategory(null)}
                    onChannelClick={(channel) => console.log('Play live channel:', channel.name)}
                />
            );
        }
        return (
            <CategoryView
                categoryName={activeCategory.name}
                items={itemsForActiveCategory}
                onBack={() => setActiveCategory(null)}
                onPosterClick={activeCategory.type === 'movie' ? handleMoviePosterClick : handleSeriesPosterClick}
                renderModal={() => (
                    <>
                        {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
                        {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
                    </>
                )}
            />
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-full mx-auto space-y-8 px-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Xtream API Playground</h1>
                    <Link to="/dashboard" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Back to Dashboard
                    </Link>
                </div>                

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CategoryBrowser title="Live TV Categories" categories={liveCategories} onCategoryClick={(id, name) => handleCategoryClick(id, name, 'livetv')} />
                    <CategoryBrowser title="Movies Categories" categories={moviesCategoriesWithAll} onCategoryClick={(id, name) => handleCategoryClick(id, name, 'movie')} />
                    <CategoryBrowser title="Series Categories" categories={seriesCategoriesWithAll} onCategoryClick={(id, name) => handleCategoryClick(id, name, 'series')} />
                </div>

                {moviesCategories.slice(0, 15).map(category => {
                    const items = moviesByCategory.get(category.category_id) || [];
                    if (items.length === 0) return null;
                    const sortedItems = [...items].sort(sortByImagePresence);
                    return (
                        <StreamRow
                            key={`movie-cat-${category.category_id}`}
                            title={category.category_name}
                            streams={sortedItems}
                            onPosterClick={handleMoviePosterClick}
                        />
                    );
                })}
            </div>

            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
            {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
        </div>
    );
};