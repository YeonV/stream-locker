import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster'; // Assuming Poster component path is correct
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { PosterItem } from '../../../types/playlist'; // Assuming type path is correct
import { useElementSize } from '../../../hooks/useElementSize';

interface StreamCarouselProps {
  streams: PosterItem[];
  onPosterClick: (id: number) => void;
}

// === CONFIGURATION ===
// This is now the single source of truth for item styling.
// w-72 = 18rem (~288px). Adjust this class to resize your posters.
// aspect-[2/3] = Standard movie poster aspect ratio. This is crucial.
// mx-2 = 0.5rem margin on left/right, creating a 1rem (16px) gap between items.
const ITEM_CLASSES = "w-72 aspect-[2/3] mx-2";
const ITEM_GAP_PX = 16; // The gap in pixels, derived from mx-2 (0.5rem * 2 * 16px/rem)

export const StreamCarousel = ({ streams, onPosterClick }: StreamCarouselProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sizerRef, sizerSize] = useElementSize();

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Readiness check: We don't want to do anything until we've measured the sizer.
  const isReady = sizerSize.width > 0;

  const columnVirtualizer = useVirtualizer({
    count: streams.length,
    getScrollElement: () => parentRef.current,
    // Provide a non-zero estimate. When ready, use the hyper-accurate measured size.
    // Before it's ready, we provide a reasonable guess to prevent errors.
    estimateSize: () => isReady ? sizerSize.width : 300, 
    horizontal: true,
    overscan: 5,
    // Use the explicit gap property for accurate calculations.
    gap: ITEM_GAP_PX,
  });

  const virtualItems = columnVirtualizer.getVirtualItems();

  // Effect for updating the scroll buttons' disabled state
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent || !isReady) return;

    const handleScroll = () => {
      if (parent.scrollWidth === 0) return;
      const scrollOffset = parent.scrollLeft;
      const maxScroll = parent.scrollWidth - parent.clientWidth;
      setIsAtStart(scrollOffset <= 1);
      setIsAtEnd(scrollOffset >= maxScroll - 1);
    };

    handleScroll(); // Check initial state
    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [isReady, streams.length]); // Re-run when readiness changes

  // Handler for next/prev page scrolling
  const handleScrollByPage = (direction: 'next' | 'prev') => {
    const parent = parentRef.current;
    // Don't scroll if we haven't measured yet.
    if (!parent || !isReady) return;

    const itemSizeWithGap = sizerSize.width + ITEM_GAP_PX;
    const itemsPerPage = Math.floor(parent.clientWidth / itemSizeWithGap);
    // Scroll by slightly less than a full page to show a peek of the next item
    const scrollAmount = (itemsPerPage > 1 ? itemsPerPage - 1 : 1) * itemSizeWithGap;
    
    const newScrollOffset = parent.scrollLeft + (direction === 'next' ? scrollAmount : -scrollAmount);
    columnVirtualizer.scrollToOffset(newScrollOffset, { align: 'start', behavior: 'smooth' });
  };

  // Style for the inner container that holds the virtual items.
  // Its height MUST be based on the measured sizer.
  const innerContainerStyle = {
    width: `${columnVirtualizer.getTotalSize()}px`,
    height: isReady ? `${sizerSize.height}px` : '450px', // Fallback height
  };

  return (
    <div className="relative group/arrows">
      {/* The Sizer is always rendered but invisible. It's what useElementSize measures. */}
      <div ref={sizerRef} className={`${ITEM_CLASSES} invisible absolute -z-10`} aria-hidden="true" />
      
      <div
        ref={parentRef}
        className="w-full overflow-x-auto py-2" // The main scroll container
        style={{ scrollbarWidth: 'none' }} // Hides scrollbar on Firefox
      >
        {isReady && ( // Only render the virtualized content once we have a measurement
          <div className="relative w-full" style={innerContainerStyle}>
            {virtualItems.map((virtualItem) => {
              const item = streams[virtualItem.index];
              if (!item) return null;
              
              return (
                <div
                  key={virtualItem.key}
                  className="absolute top-0 left-0 h-full"
                  style={{ transform: `translateX(${virtualItem.start}px)` }}
                >
                  {/* The actual item uses the same classes as the sizer */}
                  <div className={ITEM_CLASSES}>
                    <Poster stream={item} onClick={() => onPosterClick(item.id)}  />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <>
        <button
          onClick={() => handleScrollByPage('prev')}
          disabled={isAtStart}
          className="absolute top-0 left-0 bottom-0 h-full z-10 px-4 bg-black/10 hover:bg-black/50 text-white opacity-0 group-hover/arrows:opacity-100 disabled:opacity-0 transition-all duration-200 flex items-center justify-center group"
        >
          <FiChevronLeft size={52} className="transition-transform duration-200 group-hover:scale-125" />
        </button>
        <button
          onClick={() => handleScrollByPage('next')}
          disabled={isAtEnd}
          className="absolute top-0 right-0 bottom-0 h-full z-10 px-4 bg-black/10 hover:bg-black/50 text-white opacity-0 group-hover/arrows:opacity-100 disabled:opacity-0 transition-all duration-200 flex items-center justify-center group"
        >
          <FiChevronRight size={52} className="transition-transform duration-200 group-hover:scale-125" />
        </button>
      </>
    </div>
  );
};