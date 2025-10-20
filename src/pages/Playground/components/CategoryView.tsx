import { forwardRef, useMemo } from 'react';
import { StreamRow } from './StreamRow';
import type { PosterItem } from '../../../types/playlist';
import { FiArrowLeft } from 'react-icons/fi';

const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
  const aHasValidImage = a.imageUrl && 
                         (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) &&
                         !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
                         
  const bHasValidImage = b.imageUrl && 
                         (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) &&
                         !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');

  if (aHasValidImage && !bHasValidImage) return -1;
  if (!aHasValidImage && bHasValidImage) return 1;
  return 0;
};

const getSortableName = (name: string): string => {
  if (!name) return '';
  let cleanName = name.trim();
  // eslint-disable-next-line no-useless-escape
  const prefixRegex = /^[\[(].*?[\])]\s*/;
  while (prefixRegex.test(cleanName)) {
    cleanName = cleanName.replace(prefixRegex, '');
  }
  return cleanName;
};

interface CategoryViewProps {
  categoryName: string;
  items: PosterItem[];
  onBack: () => void;
  onPosterClick: (id: number) => void;
  renderModal: () => React.ReactNode; 
}

export const CategoryView = forwardRef<HTMLDivElement, CategoryViewProps>(
  ({ categoryName, items, onBack, onPosterClick, renderModal }, ref) => {
    const itemsUnsorted: PosterItem[] = useMemo(() => [...items].sort(sortByImagePresence), [items]);
    const itemsAlphaAsc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return getSortableName(a.name).localeCompare(getSortableName(b.name)); }), [items]);
    const itemsAlphaDesc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return getSortableName(b.name).localeCompare(getSortableName(a.name)); }), [items]);
    const itemsByDateDesc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return parseInt(b.added) - parseInt(a.added); }), [items]);

    return (
      <div ref={ref} tabIndex={-1} className="w-full h-full flex flex-col focus:outline-none bg-background-primary">
        <header className="flex items-center p-4 border-b border-border-primary bg-background-secondary flex-shrink-0 z-10">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 font-semibold text-text-primary bg-background-glass rounded-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary-focus"
          >
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold mx-auto text-text-primary">{categoryName}</h1>
          {/* A placeholder div to keep the title perfectly centered */}
          <div style={{ width: '100px' }} /> 
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-full mx-auto space-y-8">
            <StreamRow title="Default Order" streams={itemsUnsorted} onPosterClick={onPosterClick} />
            <StreamRow title="Alphabetical (A-Z)" streams={itemsAlphaAsc} onPosterClick={onPosterClick} />
            <StreamRow title="Alphabetical (Z-A)" streams={itemsAlphaDesc} onPosterClick={onPosterClick} />
            <StreamRow title="Recently Added" streams={itemsByDateDesc} onPosterClick={onPosterClick} />
          </div>
        </main>
        
        {renderModal()}
      </div>
    );
  }
);