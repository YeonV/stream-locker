import { useState, useMemo, useRef, useEffect } from 'react';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { StreamRow } from './components/StreamRow';
import { useDataStore } from '../../store/dataStore';
import { useApiStore } from '../../store/apiStore';
import type { Serie, PosterItem, Category, SeriesInfo } from '../../types/playlist';
import { useElementSize } from '../../hooks/useElementSize';
import { useUiContextStore } from '../../store/uiContextStore';
import { useHotkeys } from 'react-hotkeys-hook';
import { sortByImagePresence } from '../../utils/sortByImagePresence';

const ROW_GAP_UNIT = 12;
const ROW_GAP_CLASS = `space-y-${ROW_GAP_UNIT}`;

export const SeriesView = () => {
    const parentRef = useRef<HTMLDivElement>(null);
    const series: Serie[] = useDataStore(state => state.series);
    const seriesCategories: Category[] = useDataStore(state => state.seriesCategories);
    const [selectedSeries, setSelectedSeries] = useState<SeriesInfo | null>(null);
    const xtreamApi = useApiStore((state) => state.xtreamApi);
    const [rowSizerRef, rowSizerMetrics] = useElementSize();
    const measuredRowHeight = rowSizerMetrics.height;
    const isReady = measuredRowHeight > 0;
    const focusedCoordinate = useUiContextStore(state => state.focusedCoordinate);
    const setFocusedCoordinate = useUiContextStore(state => state.setFocusedCoordinate);

    const seriesById = useMemo(() => {
        const map = new Map<number, Serie>();
        for (const s of series) {
            map.set(s.series_id, s);
        }
        return map;
    }, [series]);

    const seriesItemsBase: PosterItem[] = useMemo(() => series.map(s => ({
        id: s.series_id,
        name: s.name,
        imageUrl: s.cover,
        rating: parseFloat(s.rating_5based) || 0,
        added: s.last_modified,
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

    const sortedSeriesByCategory = useMemo(() => {
        const sortedMap = new Map<string, PosterItem[]>();
        for (const [categoryId, items] of seriesByCategory.entries()) {
            const sortedItems = [...items].sort(sortByImagePresence);
            sortedMap.set(categoryId, sortedItems);
        }
        return sortedMap;
    }, [seriesByCategory]);

    const handleSeriesPosterClick = async (seriesId: number) => {
        const info = await xtreamApi?.getSeriesInfo(seriesId);
        setSelectedSeries(info as SeriesInfo);
    };
    
    const handleCloseModals = () => {
        setSelectedSeries(null);
    };

    const sizerCategory = seriesCategories[0];
    const sizerItems = sizerCategory ? (seriesByCategory.get(sizerCategory.category_id) || []).slice(0, 1) : [];

    useEffect(() => {
        if (focusedCoordinate === null) {
            setFocusedCoordinate({ row: 0, col: 0 });
        }
    }, []);

    useHotkeys('arrowup', (e) => {
        e.preventDefault();
        const currentRow = focusedCoordinate!.row;

        if (currentRow === 0) {
            // Future: Could implement exit to header here if desired.
            // For now, it respects the boundary.
        } else {
            const newRow = currentRow - 1;
            setFocusedCoordinate({ row: newRow, col: 0 });
        }
    }, {
        enabled: (focusedCoordinate !== null) && (selectedSeries === null)
    });

    useHotkeys('arrowdown', (e) => {
        e.preventDefault();
        const maxIndex = seriesCategories.length - 1;
        const currentRow = focusedCoordinate!.row;

        if (currentRow < maxIndex) {
            const newRow = currentRow + 1;
            // const itemWidth = 160;
            // const itemGap = 16;
            // const containerWidth = parentRef.current?.clientWidth || 0;
            // const itemsPerPage = Math.floor(containerWidth / (itemWidth + itemGap));
            setFocusedCoordinate({ row: newRow, col: 0 });
            // setFocusedCoordinate({ row: newRow, col: focusedCoordinate!.col > itemsPerPage - 1 ? 0 : focusedCoordinate!.col });
        }
    }, {
        enabled: (focusedCoordinate !== null) && (selectedSeries === null)
    });

    return (
        <div ref={parentRef} className={`h-full w-full px-4 overflow-auto focus:outline-none ${ROW_GAP_CLASS}`}>
            <div ref={rowSizerRef} className="invisible absolute -z-10 w-full">
                {sizerItems.length > 0 && (
                    <StreamRow
                        title="Sizer"
                        streams={sizerItems}
                        onPosterClick={() => { }}
                    />
                )}
            </div>

            {isReady && (
                <>
                    {seriesCategories.map((category, index) => {
                        const sortedItems = sortedSeriesByCategory.get(category.category_id) || [];
                        if (sortedItems.length === 0) return null;

                        return (
                            <StreamRow
                                key={category.category_id}
                                title={category.category_name}
                                streams={sortedItems}
                                onPosterClick={handleSeriesPosterClick}
                                rowIndex={index}
                                selected={selectedSeries}
                            />
                        );
                    })}
                </>
            )}

            {selectedSeries && <SeriesDetailModal series={selectedSeries} onClose={handleCloseModals} />}
        </div>
    );
};