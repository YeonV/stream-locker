import { useState, useMemo, useEffect } from 'react';
import { CategoryBrowser } from './components/CategoryBrowser';
import { LiveCategoryView } from './components/LiveCategoryView';
import { useDataStore } from '../../store/dataStore';
import type { LiveStream, Category } from '../../types/playlist';
import { useUiContextStore } from '../../store/uiContextStore';

export const LiveTvView = () => {
    const liveCategories: Category[] = useDataStore(state => state.liveCategories);
    const liveStreams: LiveStream[] = useDataStore(state => state.liveStreams);
    const [activeCategory, setActiveCategory] = useState<{ id: string; name: string; type: 'movie' | 'series' | 'livetv' } | null>(null);
    const setUiContext = useUiContextStore(state => state.setContext);
  
    const handleCategoryClick = (categoryId: string, categoryName: string) => {
        setActiveCategory({ id: categoryId, name: categoryName, type: 'livetv' });
    };
 
    const liveStreamsForActiveCategory = useMemo((): LiveStream[] => {
        if (activeCategory?.type !== 'livetv') return [];
        return liveStreams.filter(stream => stream.category_ids?.includes(Number(activeCategory.id)));
    }, [activeCategory, liveStreams]);

    
    useEffect(() => {
        if (activeCategory) {
          setUiContext({ 
            type: 'livetv-xtream', 
            channels: liveStreamsForActiveCategory, 
          });
        }
    }, [activeCategory, liveStreamsForActiveCategory, setUiContext]);

    if (activeCategory) {
        if (activeCategory.type === 'livetv') {
            return (
                // We pass the ref down to the LiveCategoryView
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
        <div className="h-full w-full p-8 overflow-auto focus:outline-none">
            <div className="max-w-md">
                <CategoryBrowser categories={liveCategories} onCategoryClick={(id, name) => handleCategoryClick(id, name)} />
            </div>   
        </div>
    );
};