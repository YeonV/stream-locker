import { useRef, useState, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster';
import type { PosterItem } from '../../../types/playlist';

interface StreamGridProps {
  streams: PosterItem[];
  onPosterClick: (streamId: number) => void;
}

// --- CONFIGURATION CONSTANTS ---
const POSTER_WIDTH = 300; // The base width of a poster
const POSTER_GAP = 16;   // The space between posters

export const StreamGrid = ({ streams, onPosterClick }: StreamGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // State to hold the dynamically calculated number of columns
  const [columns, setColumns] = useState(6);

  // This effect runs before the browser paints to calculate how many columns can fit.
  // This is the key to making the grid responsive AND virtualized correctly.
  useLayoutEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    // A function to perform the calculation
    const handleResize = () => {
      const parentWidth = parent.clientWidth;
      // Calculate how many full posters (plus their gap) can fit
      const newCols = Math.floor(parentWidth / (POSTER_WIDTH + POSTER_GAP));
      setColumns(Math.max(2, newCols)); // Always show at least 2 columns
    };

    handleResize(); // Run once on mount

    // Set up a ResizeObserver to re-calculate whenever the container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(parent);

    // Cleanup on unmount
    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = Math.ceil(streams.length / columns);

  // The virtualizer for our rows (vertical scrolling)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    // Calculate row height: Poster Height (width * 1.5) + Gap
    estimateSize: () => (POSTER_WIDTH * 1.5) + POSTER_GAP,
    overscan: 3, // Render 3 extra rows for smooth scrolling
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    // The main scrollable container
    <div
      ref={parentRef}
      className="h-[80vh] w-full overflow-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* The giant virtual-height container */}
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {/* We only render the virtual rows */}
        {virtualRows.map(virtualRow => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* This inner div is a flex container for the posters in the current row */}
            <div className="flex justify-start" style={{ gap: `${POSTER_GAP}px`, padding: `0 ${POSTER_GAP / 2}px` }}>
              {Array.from({ length: columns }).map((_, colIndex) => {
                const itemIndex = virtualRow.index * columns + colIndex;
                const item = streams[itemIndex];

                // Render a placeholder div to maintain grid structure in the last row
                if (!item) {
                  return <div key={colIndex} style={{ width: `${POSTER_WIDTH}px` }} />;
                }

                // Render the actual poster
                return (
                  <div key={item.id} style={{ width: `${POSTER_WIDTH}px` }}>
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