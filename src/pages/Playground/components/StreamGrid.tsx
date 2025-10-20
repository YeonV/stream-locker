import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster';
import type { PosterItem } from '../../../types/playlist';
import { useElementSize } from '../../../hooks/useElementSize';

interface StreamGridProps {
  streams: PosterItem[];
  onPosterClick: (streamId: number) => void;
}

// THIS IS THE SINGLE SOURCE OF TRUTH for poster sizing in the grid.
const GRID_ITEM_CLASSES = "w-32 aspect-[2/3]";

export const StreamGrid = ({ streams, onPosterClick }: StreamGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // --- DYNAMIC MEASUREMENT ---
  const [sizerRef, sizerMetrics] = useElementSize();
  const posterWidth = sizerMetrics.width;
  const posterHeight = sizerMetrics.height;
  const posterGap = 16; // We can use a fixed gap for the grid (equivalent to gap-4)

  const columns = Math.max(2, posterWidth > 0 ? Math.floor((parentRef.current?.clientWidth || 0) / (posterWidth + posterGap)) : 3);
  const rowCount = Math.ceil(streams.length / columns);
  
  // --- END DYNAMIC MEASUREMENT ---

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => posterHeight > 0 ? posterHeight + posterGap : 240 + posterGap,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto p-4">
      {/* Sizer element for measurement */}
      <div ref={sizerRef} className={`${GRID_ITEM_CLASSES} invisible absolute -z-10`} />

      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {virtualRows.map(virtualRow => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full"
            style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
          >
            <div className="flex justify-start" style={{ gap: `${posterGap}px` }}>
              {Array.from({ length: columns }).map((_, colIndex) => {
                const itemIndex = virtualRow.index * columns + colIndex;
                const item = streams[itemIndex];
                if (!item) {
                  return <div key={colIndex} style={{ width: `${posterWidth}px` }} />;
                }
                return (
                  <div key={item.id} style={{ width: `${posterWidth}px` }}>
                    <Poster stream={item} onClick={() => onPosterClick(item.id)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};