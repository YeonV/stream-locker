import { useState, useMemo } from 'react';
import { CategoryBrowser } from './components/CategoryBrowser';
import { LiveCategoryView } from './components/LiveCategoryView';
import { useDataStore } from '../../store/dataStore';
import type { LiveStream, Category } from '../../types/playlist';

export const LiveTvView = () => {
    const liveCategories: Category[] = useDataStore(state => state.liveCategories);
    const liveStreams: LiveStream[] = useDataStore(state => state.liveStreams);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' | 'livetv' } | null>(null);

    const handleCategoryClick = (categoryId: string, categoryName: string, type: 'livetv') => {
        setActiveCategory({ id: categoryId, name: categoryName, type });
    };
 
    const liveStreamsForActiveCategory = useMemo((): LiveStream[] => {
        if (activeCategory?.type !== 'livetv') return [];
        return liveStreams.filter(stream => stream.category_ids?.includes(Number(activeCategory.id)));
    }, [activeCategory, liveStreams]);

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
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-8 overflow-auto">
            <div className="max-w-md">
                <CategoryBrowser title="Live TV Categories" categories={liveCategories} onCategoryClick={(id, name) => handleCategoryClick(id, name, 'livetv')} />
            </div>   
        </div>
    );
};