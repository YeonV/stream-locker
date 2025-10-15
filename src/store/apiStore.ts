import { create } from 'zustand';
import { Xtream } from '../lib/xtream';
import type { XtreamPlaylist } from '../types/playlist';

interface ApiState {
  xtreamApi: Xtream | null;
  initializeApi: (playlist: XtreamPlaylist) => void;
  clearApi: () => void;
}

export const useApiStore = create<ApiState>((set) => ({
  xtreamApi: null,

  initializeApi: (playlist) => {
    if (!playlist.serverUrl?.trim() || !playlist.username?.trim()) {
      console.error("Initialization failed: Server URL or Username is missing.");
      set({ xtreamApi: null });
      return;
    }
    const api = new Xtream({
      mode: 'prod',
      url: playlist.serverUrl,
      username: playlist.username,
      password: playlist.password,
    });
    set({ xtreamApi: api });
  },

  clearApi: () => {
    set({ xtreamApi: null });
  },
}));