import { useState, useMemo } from 'react';
import { MovieDetailModal } from './components/MovieDetailModal';
import { CategoryBrowser } from './components/CategoryBrowser';
import { CategoryView } from './components/CategoryView';
import { useDataStore } from '../../store/dataStore';
import type { Movie, PosterItem, Category, MovieInfo } from '../../types/playlist';
import { useApiStore } from '../../store/apiStore';

export const MovieCategoriesView = () => {
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' } | null>(null);
    const xtreamApi = useApiStore((state) => state.xtreamApi);

    const handleCategoryClick = (categoryId: string, categoryName: string) => {
        setActiveCategory({ id: categoryId, name: categoryName, type: 'movie' });
    };

    const movieItemsBase: PosterItem[] = useMemo(() => moviesStreams.map(movie => ({
        id: movie.stream_id, name: movie.name, imageUrl: movie.stream_icon, rating: movie.rating_5based, added: movie.added,
    })), [moviesStreams]);

    const itemsForActiveCategory = useMemo((): PosterItem[] => {
        if (!activeCategory) return [];
        if (activeCategory.id === 'all') {
            return movieItemsBase;
        }
        if (activeCategory.type === 'movie') {
            return moviesStreams
                .filter(stream => stream.category_ids?.includes(Number(activeCategory.id)))
                .map(movie => ({ id: movie.stream_id, name: movie.name, imageUrl: movie.stream_icon, rating: movie.rating_5based, added: movie.added }));
        }
        return [];
    }, [activeCategory, moviesStreams, movieItemsBase]);

    const moviesCategoriesWithAll = useMemo(() => [{ category_id: 'all', category_name: 'ALL MOVIES', parent_id: 0 }, ...moviesCategories], [moviesCategories]);

    const handleMoviePosterClick = async (vodId: number) => { const info = await xtreamApi?.getMovieInfo(vodId); setSelectedMovie(info as MovieInfo); };
    const handleCloseModals = () => { setSelectedMovie(null); };

    if (activeCategory) {
        return (
            <CategoryView
                categoryName={activeCategory.name}
                items={itemsForActiveCategory}
                onBack={() => setActiveCategory(null)}
                onPosterClick={handleMoviePosterClick}
                renderModal={() => (
                    <>
                        {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
                    </>
                )}
            />
        );
    }

    return (
        <div className="h-full w-full p-8 overflow-auto focus:outline-none bg-background-primary text-text-primary">
            <div className="max-w-md">
                <CategoryBrowser categories={moviesCategoriesWithAll} onCategoryClick={(id, name) => handleCategoryClick(id, name)} />
            </div>
            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
        </div>
    );
};