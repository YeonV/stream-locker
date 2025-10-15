import { useMemo } from 'react';
import { StreamRow } from './StreamRow';
import type { PosterItem } from '../../../types/playlist';
import { FiArrowLeft } from 'react-icons/fi';

/**
 * A smart sorter that prioritizes items with images.
 * Items without an imageUrl are moved to the end of the list.
 */
const sortByImagePresence = (a: PosterItem, b: PosterItem): number => {
  const aHasValidImage = a.imageUrl && 
                         (a.imageUrl.endsWith('.jpg') || a.imageUrl.endsWith('.png')) &&
                         !a.imageUrl.startsWith('http://cover.diatunnel.link:80/images');
                         
  const bHasValidImage = b.imageUrl && 
                         (b.imageUrl.endsWith('.jpg') || b.imageUrl.endsWith('.png')) &&
                         !b.imageUrl.startsWith('http://cover.diatunnel.link:80/images');

  if (aHasValidImage && !bHasValidImage) {
    return -1; // a comes first
  }
  if (!aHasValidImage && bHasValidImage) {
    return 1; // b comes first
  }
  return 0; // order doesn't matter
};

/**
 * Creates a "sortable" version of a name by removing bracketed/parenthesized prefixes.
 * Example: "[DE] City Hunter (1993)" becomes "City Hunter (1993)"
 */
const getSortableName = (name: string): string => {
  if (!name) return '';

  let cleanName = name.trim();
  // eslint-disable-next-line no-useless-escape
  const prefixRegex = /^[\[(].*?[\])]\s*/;

  // Keep stripping prefixes as long as the string starts with one
  while (prefixRegex.test(cleanName)) {
    cleanName = cleanName.replace(prefixRegex, '');
  }

  return cleanName;
};

interface CategoryViewProps {
  categoryName: string;
  items: PosterItem[]; // It now receives the CLEAN, ADAPTED data
  onBack: () => void;
  onPosterClick: (id: number) => void;
  // We need a way to render the correct modal
  renderModal: () => React.ReactNode; 
}

export const CategoryView = ({ categoryName, items, onBack, onPosterClick, renderModal }: CategoryViewProps) => {
  // All sorting logic is GENERIC and works perfectly here.
  const itemsUnsorted: PosterItem[] = useMemo(() => [...items].sort(sortByImagePresence), [items]);
  const itemsAlphaAsc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return getSortableName(a.name).localeCompare(getSortableName(b.name)); }), [items]);
  const itemsAlphaDesc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return getSortableName(b.name).localeCompare(getSortableName(a.name)); }), [items]);
  const itemsByDateDesc: PosterItem[] = useMemo(() => [...items].sort((a, b) => { const imageSort = sortByImagePresence(a, b); if (imageSort !== 0) return imageSort; return parseInt(b.added) - parseInt(a.added); }), [items]);

  return (
    <div className="w-full h-full flex flex-col">
      <header className="flex items-center p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0 z-10">
        <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600">
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-bold mx-auto">{categoryName}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-full mx-auto space-y-8 px-4">
          <StreamRow title="Default Order" streams={itemsUnsorted} onPosterClick={onPosterClick} />
          <StreamRow title="Alphabetical (A-Z)" streams={itemsAlphaAsc} onPosterClick={onPosterClick} />
          <StreamRow title="Alphabetical (Z-A)" streams={itemsAlphaDesc} onPosterClick={onPosterClick} />
          <StreamRow title="Recently Added" streams={itemsByDateDesc} onPosterClick={onPosterClick} />
        </div>
      </main>

      {/* The parent now controls which modal is rendered */}
      {renderModal()}
    </div>
  );
};