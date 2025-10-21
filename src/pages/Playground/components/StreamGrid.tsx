import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster';
import type { PosterItem } from '../../../types/playlist';
import { useElementSize } from '../../../hooks/useElementSize';

interface StreamGridProps {
  streams: PosterItem[];
  onPosterClick: (streamId: number) => void;
  onFocusLeaveUp: () => void; // New prop for the "return journey"
}

const GRID_ITEM_CLASSES = "w-32 aspect-[2/3]";

export const StreamGrid = ({ streams, onPosterClick, onFocusLeaveUp }: StreamGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const [sizerRef, sizerMetrics] = useElementSize();
  const posterWidth = sizerMetrics.width;
  const posterHeight = sizerMetrics.height;
  const posterGap = 16;

  const columns = Math.max(2, posterWidth > 0 ? Math.floor((parentRef.current?.clientWidth || 0) / (posterWidth + posterGap)) : 3);
  const rowCount = Math.ceil(streams.length / columns);
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => posterHeight > 0 ? posterHeight + posterGap : 240 + posterGap,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // --- "RETURN JOURNEY" KEYDOWN HANDLER ---
  const handleGridKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>, itemIndex: number) => {
    // If the user is on any poster in the first row (index < number of columns)
    // and they press ArrowUp, trigger the callback to leave the grid.
    if (event.key === 'ArrowUp' && itemIndex < columns) {
      event.preventDefault();
      onFocusLeaveUp();
    }
  }, [columns, onFocusLeaveUp]);

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto p-4 focus:outline-none" tabIndex={-1}>
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
                  <div 
                    key={item.id} 
                    style={{ width: `${posterWidth}px` }}
                    // Add the onKeyDown listener to each poster's container
                    onKeyDown={(e) => handleGridKeyDown(e, itemIndex)}
                  >
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