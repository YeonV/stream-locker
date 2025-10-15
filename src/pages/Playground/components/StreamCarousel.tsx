import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Poster } from './Poster';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { PosterItem } from '../../../types/playlist';

interface StreamCarouselProps {
  streams: PosterItem[]; // It now ONLY accepts the clean, generic type
  onPosterClick: (id: number) => void;
}

const ITEM_WIDTH = 300;
const ITEM_GAP = 16;
const ESTIMATED_SIZE = ITEM_WIDTH + ITEM_GAP; 

export const StreamCarousel = ({ streams, onPosterClick }: StreamCarouselProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const columnVirtualizer = useVirtualizer({
    count: streams.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_SIZE, 
    horizontal: true,
    overscan: 5,
  });

  const virtualItems = columnVirtualizer.getVirtualItems();

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    const handleScroll = () => {
      const scrollOffset = parent.scrollLeft;
      const maxScroll = parent.scrollWidth - parent.clientWidth;
      setIsAtStart(scrollOffset <= 0);
      setIsAtEnd(scrollOffset >= maxScroll - 1);
    };
    handleScroll();
    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [streams.length]);

  const handleScrollByPage = (direction: 'next' | 'prev') => {
    const parent = parentRef.current;
    if (!parent) return;
    const visibleWidth = parent.clientWidth;
    const scrollAmount = (Math.floor(visibleWidth / ESTIMATED_SIZE) - 1) * ESTIMATED_SIZE;
    const newScrollOffset = parent.scrollLeft + (direction === 'next' ? scrollAmount : -scrollAmount);
    columnVirtualizer.scrollToOffset(newScrollOffset, { align: 'start', behavior: 'smooth' });
  };

  const containerHeight = ITEM_WIDTH * 1.5 + ITEM_GAP;

  return (
      <div className="relative group/arrows">
        <div
          ref={parentRef}
          className="w-full overflow-x-auto"
          style={{ height: `${containerHeight}px`, scrollbarWidth: 'none' }}
        >
          <div
            className="relative w-full h-full"
            style={{ width: `${columnVirtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualItem) => {
              const item  = streams[virtualItem.index];
              if (!item) return null;
              
              return (
                <div
                  key={virtualItem.key}
                  className="absolute top-0 left-0 h-full"
                  style={{ transform: `translateX(${virtualItem.start}px)` }}
                >
                  <div style={{ width: `${ITEM_WIDTH}px`, height: '100%', margin: `0 ${ITEM_GAP / 2}px` }}>
                    <Poster stream={item} onClick={() => onPosterClick(item.id)}  />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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