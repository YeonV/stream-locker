import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Movie, Serie, Category, LiveStream } from '../types/playlist';

// 1. Create a custom storage object that uses idb-keyval.
// This tells Zustand's persist middleware how to talk to IndexedDB.
const indexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // console.log(name, 'has been retrieved');
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // console.log(name, 'with value', value, 'has been saved');
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    // console.log(name, 'has been deleted');
    await del(name);
  },
};

// 2. Define the shape of our data store
interface DataState {
  movies: Movie[];
  series: Serie[];
  liveStreams: LiveStream[];
  moviesCategories: Category[];
  seriesCategories: Category[];
  liveCategories: Category[];
  lastUpdated: string | null;
}

interface DataActions {
  setMovies: (movies: Movie[]) => void;
  setSeries: (series: Serie[]) => void;
  setLiveStreams: (streams: LiveStream[]) => void;
  setMoviesCategories: (categories: Category[]) => void;
  setSeriesCategories: (categories: Category[]) => void;
  setLiveCategories: (categories: Category[]) => void;
  setLastUpdated: (timestamp: string | null) => void;
}

// 3. Create the store
export const useDataStore = create<DataState & DataActions>()(
  persist(
    (set) => ({
      // --- Initial State ---
      movies: [],
      series: [],
      liveStreams: [],
      moviesCategories: [],
      seriesCategories: [],
      liveCategories: [],
      lastUpdated: null,
      // --- Actions ---
      setMovies: (movies) => set({ movies }),
      setSeries: (series) => set({ series }),
      setLiveStreams: (streams) => set({ liveStreams: streams }),
      setMoviesCategories: (categories) => set({ moviesCategories: categories }),
      setSeriesCategories: (categories) => set({ seriesCategories: categories }),
      setLiveCategories: (categories) => set({ liveCategories: categories }),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
    }),
    {
      name: 'stream-locker-data-storage', // A unique name for the IndexedDB store
      storage: createJSONStorage(() => indexedDbStorage), // Use our custom IndexedDB storage
    }
  )
);