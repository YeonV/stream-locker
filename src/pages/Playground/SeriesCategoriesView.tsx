import { useState, useMemo } from 'react';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { CategoryBrowser } from './components/CategoryBrowser';
import { CategoryView } from './components/CategoryView';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { PosterItem, Serie, Category, SeriesInfo } from '../../types/playlist';

export const SeriesCategoriesView = () => {
    const seriesCategories: Category[] = useDataStore(state => state.seriesCategories);
    const series: Serie[] = useDataStore(state => state.series);
    const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' } | null>(null);
    const xtreamApi = useApiStore((state) => state.xtreamApi);

    const handleCategoryClick = (categoryId: string, categoryName: string) => {
        setActiveCategory({ id: categoryId, name: categoryName, type: 'series' });
    };

    const seriesItemsBase: PosterItem[] = useMemo(() => series.map(s => ({
        id: s.series_id, name: s.name, imageUrl: s.cover, rating: parseFloat(s.rating_5based) || 0, added: s.last_modified,
    })), [series]);

    const itemsForActiveCategory = useMemo((): PosterItem[] => {
        if (!activeCategory) return [];
        if (activeCategory.id === 'all') {
            return seriesItemsBase;
        }
        if (activeCategory.type === 'series') {
            return series
                .filter(s => s.category_ids?.includes(Number(activeCategory.id)))
                .map(s => ({ id: s.series_id, name: s.name, imageUrl: s.cover, rating: parseFloat(s.rating_5based) || 0, added: s.last_modified }));
        }
        return [];
    }, [activeCategory, series, seriesItemsBase]);

    const seriesCategoriesWithAll = useMemo(() => [{ category_id: 'all', category_name: 'ALL SERIES', parent_id: 0 }, ...seriesCategories], [seriesCategories]);

    const handleSeriesPosterClick = async (seriesId: number) => { const info = await xtreamApi?.getSeriesInfo(seriesId); setSelectedSeries(info as SeriesInfo); };
    const handleCloseModals = () => { setSelectedSeries(null); };

    if (activeCategory) {
        return (
            <CategoryView
            categoryName={activeCategory.name}
                items={itemsForActiveCategory}
                onBack={() => setActiveCategory(null)}
                onPosterClick={handleSeriesPosterClick}
                renderModal={() => (
                    <>
                        {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
                    </>
                )}
            />
        );
    }

    return (
        <div className="h-full w-full p-8 overflow-auto focus:outline-none bg-background-primary text-text-primary">
            <div className="max-w-md">
                <CategoryBrowser categories={seriesCategoriesWithAll} onCategoryClick={(id, name) => handleCategoryClick(id, name)} />
            </div>            
            {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
        </div>
    );
};