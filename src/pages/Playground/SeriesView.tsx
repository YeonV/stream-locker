import { useState, useMemo, useRef } from 'react';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { StreamRow } from './components/StreamRow';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Serie, PosterItem, Category, SeriesInfo } from '../../types/playlist';

const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
    const aHasValidImage = a.imageUrl && (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) && !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    const bHasValidImage = b.imageUrl && (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) && !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
    if (aHasValidImage && !bHasValidImage) { return -1; }
    if (!aHasValidImage && bHasValidImage) { return 1; }
    return 0;
};

const ROW_GAP = 32;
const ROW_ESTIMATED_HEIGHT = 450 + 36 + 32 + ROW_GAP;

export const SeriesView = () => {
    const seriesCategories: Category[] = useDataStore(state => state.seriesCategories);
    const series: Serie[] = useDataStore(state => state.series);
    const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);

    const xtreamApi = useApiStore((state) => state.xtreamApi);


    const seriesById = useMemo(() => {
        const map = new Map<number, Serie>();
        for (const s of series) {
            map.set(s.series_id, s);
        }
        return map;
    }, [series]);
    
    const seriesItemsBase: PosterItem[] = useMemo(() => series.map(s => ({
        id: s.series_id, name: s.name, imageUrl: s.cover, rating: parseFloat(s.rating_5based) || 0, added: s.last_modified,
    })), [series]);

    const seriesByCategory = useMemo(() => {
        const map = new Map<string, PosterItem[]>();
        for (const category of seriesCategories) {
            const items: PosterItem[] = [];
            for (const item of seriesItemsBase) {
                const rawItem = seriesById.get(item.id);
                if (rawItem?.category_ids?.includes(Number(category.category_id))) {
                    items.push(item);
                }
            }
            map.set(category.category_id, items);
        }
        return map;
    }, [seriesCategories, seriesItemsBase, seriesById]);

    const handleSeriesPosterClick = async (seriesId: number) => { const info = await xtreamApi?.getSeriesInfo(seriesId); setSelectedSeries(info as SeriesInfo); };
    const handleCloseModals = () => { setSelectedSeries(null);};

    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: seriesCategories.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_ESTIMATED_HEIGHT,
        overscan: 5,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();

    return (
        <div ref={parentRef} className="h-full w-full px-4 overflow-auto">

            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {virtualRows.map(virtualRow => {
                    const category = seriesCategories[virtualRow.index];
                    if (!category) return null;

                    const items = seriesByCategory.get(category.category_id) || [];
                    if (items.length === 0) return null;

                    const sortedItems = [...items].sort(sortByImagePresence);

                    return (
                        <div
                            key={category.category_id}
                            className="absolute top-0 left-0 w-full pb-8"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <StreamRow
                                title={category.category_name}
                                streams={sortedItems}
                                onPosterClick={handleSeriesPosterClick}
                            />
                        </div>
                    );
                })}
            </div>

            {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
        </div>
    );
};