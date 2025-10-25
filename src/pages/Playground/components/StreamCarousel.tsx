import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { MovieInfo, PosterItem, SeriesInfo } from '../../../types/playlist';
import { useElementSize } from '../../../hooks/useElementSize';
import { useEnvStore } from '../../../store/envStore';
import { useUiContextStore } from '../../../store/uiContextStore';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFooterStore } from '../../../store/footerStore';

interface StreamCarouselProps {
  streams: PosterItem[];
  onPosterClick: (id: number) => void;
  rowIndex?: number;
  selected?: MovieInfo | SeriesInfo | null;
}

// === CONFIGURATION ===
const ITEM_CLASSES = "w-40 aspect-[2/3] mx-2"; 

// --- DYNAMIC GUESS CALCULATION (RESTORED AND CORRECTED) ---
const widthMatch = ITEM_CLASSES.match(/w-(\d+)/);
const INITIAL_WIDTH_GUESS = widthMatch ? parseInt(widthMatch[1], 10) * 4 : 160; // 160px is w-40

export const StreamCarousel = ({ streams, rowIndex, onPosterClick, selected }: StreamCarouselProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sizerRef, sizerMetrics] = useElementSize();
  const device = useEnvStore(state => state.device);

  const focusedCoordinate = useUiContextStore(state => state.focusedCoordinate);
  const setFocusedCoordinate = useUiContextStore(state => state.setFocusedCoordinate);
  const itemWidth = sizerMetrics.width;
  const itemGap = sizerMetrics.marginLeft + sizerMetrics.marginRight;
  const setRewind = useFooterStore(state => state.setRewind);
  const setForward = useFooterStore(state => state.setForward);

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const isReady = itemWidth > 0;

  const columnVirtualizer = useVirtualizer({
    count: streams.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isReady ? itemWidth : INITIAL_WIDTH_GUESS, 
    horizontal: true,
    overscan: 5,
    gap: isReady ? itemGap : 16, // Fallback is less critical but should match mx-2
  });

  const virtualItems = columnVirtualizer.getVirtualItems();

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
    handleScroll();
    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [isReady, streams.length]);

  const handleScrollByPage = (direction: 'next' | 'prev') => {
    const parent = parentRef.current;
    if (!parent || !isReady) return;
    
    const itemSizeWithGap = itemWidth + itemGap;
    const itemsPerPage = Math.floor(parent.clientWidth / itemSizeWithGap);
    const scrollAmount = (itemsPerPage > 1 ? itemsPerPage - 1 : 1) * itemSizeWithGap;
    
    const newScrollOffset = parent.scrollLeft + (direction === 'next' ? scrollAmount : -scrollAmount);
    columnVirtualizer.scrollToOffset(newScrollOffset, { align: 'start', behavior: 'smooth' });
  };



  const handleScrollByPageWithFocus = (direction: 'next' | 'prev') => {
    // const visibleItems = columnVirtualizer.getVirtualItems();
    // if (visibleItems.length === 0) return;

    const currentIndex = focusedCoordinate?.col ?? 0;
    
    const itemsPerPage = Math.floor((parentRef.current?.clientWidth || 0) / (itemWidth + itemGap));
    const pageJumpSize = itemsPerPage > 1 ? itemsPerPage - 1 : 1;

    let targetIndex;

    if (direction === 'next') {
        // Calculate the target based on the CURRENT state, not the visual state.
        targetIndex = currentIndex + pageJumpSize;
    } else { // 'prev'
        // Calculate the target based on the CURRENT state.
        targetIndex = currentIndex - pageJumpSize;
    }
    
    // The rest of the function is already perfect.
    const maxIndex = streams.length - 1;
    const clampedTargetIndex = Math.max(0, Math.min(targetIndex, maxIndex));

    if (rowIndex === undefined) return;
    setFocusedCoordinate({ row: rowIndex, col: clampedTargetIndex });
    columnVirtualizer.scrollToIndex(clampedTargetIndex, { align: 'start', behavior: 'smooth' });
  }

  // CORRECTED: The height is now simply the measured height of the poster.
  // The py-2 on the parent div handles the vertical padding for the row.
  const innerContainerStyle = {
    width: `${columnVirtualizer.getTotalSize()}px`,
    height: isReady ? `${sizerMetrics.height}px` : `${INITIAL_WIDTH_GUESS * 1.5}px`,
  };

  useHotkeys('MediaFastForward', (e) => {
    e.preventDefault();
      handleScrollByPageWithFocus('next');
  }, { 
      enabled: (focusedCoordinate?.row === rowIndex) && selected === null 
  });
  
  useHotkeys('MediaRewind', (e) => {
    e.preventDefault();
      handleScrollByPageWithFocus('prev');
  }, { 
      enabled: (focusedCoordinate?.row === rowIndex) && selected === null 
  });

  useEffect(() => {
    setRewind('Scroll Left');
    setForward('Scroll Right');
    return () => {
      setRewind('');
      setForward('');
    }
  }, [setRewind, setForward]);

  return (
    <div className="relative group/arrows group/fades">
      <div ref={sizerRef} className={`${ITEM_CLASSES} invisible absolute -z-10`} aria-hidden="true" />
      
      <div
        ref={parentRef}
        data-testid="stream-row" 
        className="w-full overflow-x-auto py-2" // This py-2 provides the vertical padding
        style={{ scrollbarWidth: 'none' }}
      >
        {isReady && (
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
                  <div className={ITEM_CLASSES}>
                    <Poster stream={item} onClick={() => onPosterClick(item.id)} rowIndex={rowIndex} colIndex={virtualItem.index} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {device !== 'firetv' && <>
        <button
          onClick={() => handleScrollByPage('prev')}
          disabled={isAtStart}
          className="absolute top-0 left-0 bottom-0 h-full z-10 px-4 bg-gradient-to-r from-background-primary to-transparent text-text-primary opacity-0 group-hover/arrows:opacity-100 disabled:opacity-0 focus:opacity-100 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-focus rounded-r-lg transition-all duration-200 flex items-center justify-center group"
        >
          <FiChevronLeft size={52} className="transition-transform duration-200 group-hover:scale-125" />
        </button>
        <button
          onClick={() => handleScrollByPage('next')}
          disabled={isAtEnd}
          className="absolute top-0 right-0 bottom-0 h-full z-10 px-4 bg-gradient-to-l from-background-primary to-transparent text-text-primary opacity-0 group-hover/arrows:opacity-100 disabled:opacity-0 focus:opacity-100 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-focus rounded-l-lg transition-all duration-200 flex items-center justify-center group"
        >
          <FiChevronRight size={52} className="transition-transform duration-200 group-hover:scale-125" />
        </button>
      </>}

      <>
        <div className={`absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-background-primary to-transparent transition-opacity duration-300 pointer-events-none ${isAtStart ? 'opacity-0' : 'opacity-100 group-hover/fades:opacity-0'}`} />
        <div className={`absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-background-primary to-transparent transition-opacity duration-300 pointer-events-none ${isAtEnd ? 'opacity-0' : 'opacity-100 group-hover/fades:opacity-0'}`} />
      </>
    </div>
  );
};