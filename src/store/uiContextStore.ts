// src/store/uiContextStore.ts

import { create } from 'zustand';
import type { LiveStream, Movie, Channel, MovieInfo, SeriesInfo } from '../types/playlist'; // Import M3U Channel type

// This defines the intelligence reports our player can understand.
export type PlaybackContext = 
  | { type: 'livetv-xtream'; channels: LiveStream[]; currentStreamId?: number; }
  | { type: 'livetv-m3u'; channels: Channel[]; }
  | { type: 'movie'; movie: Movie; movieInfo?: MovieInfo['info']; }
  | { type: 'series'; metadata: { seriesInfo: SeriesInfo } }
  | null;

interface UiContextState {
  context: PlaybackContext;
  setContext: (context: PlaybackContext) => void;
  clearContext: () => void;
}

export const useUiContextStore = create<UiContextState>((set) => ({
  context: null,
  setContext: (context) => {
    set({ context });
  },
  clearContext: () => {
    set({ context: null });
  },
}));