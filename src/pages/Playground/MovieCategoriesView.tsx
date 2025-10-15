import { useState, useMemo } from 'react';
import { MovieDetailModal, type MovieInfo } from './components/MovieDetailModal';
import { CategoryBrowser } from './components/CategoryBrowser';
import { CategoryView } from './components/CategoryView';
import { useDataStore } from '../../store/dataStore';
import type { Movie, PosterItem, Category } from '../../types/playlist';
import { useApiStore } from '../../store/apiStore';

export const MovieCategoriesView = () => {
    // const [moviesCategories, setMoviesCategories] = useState<Category[]>([]);
    // const [moviesStreams, setMoviesStreams] = useState<Movie[]>([]);
    const moviesStreams: Movie[] = useDataStore(state => state.movies);
    const moviesCategories: Category[] = useDataStore(state => state.moviesCategories);
    const [selectedMovie, setSelectedMovie] = useState<MovieInfo | null>(null);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' } | null>(null);

    const xtreamApi = useApiStore((state) => state.xtreamApi);

    const handleCategoryClick = (categoryId: string, categoryName: string, type: 'movie' | 'series') => {
        setActiveCategory({ id: categoryId, name: categoryName, type });
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
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-md">
                <CategoryBrowser title="Movies Categories" categories={moviesCategoriesWithAll} onCategoryClick={(id, name) => handleCategoryClick(id, name, 'movie')} />
            </div>
            {selectedMovie && <MovieDetailModal movie={selectedMovie} onClose={handleCloseModals} />}
        </div>
    );
};