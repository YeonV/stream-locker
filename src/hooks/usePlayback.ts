import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useApiStore } from '../store/apiStore';
import { playVideo as playVideoAndroid } from 'tauri-plugin-videoplayer-api';
import type { PlayableItem } from '../types/playlist';
import { useShallow } from 'zustand/react/shallow';

export const usePlayback = () => {
  const { lockStatus, setIsNativePlayerActive } = usePlayerStore(useShallow(state => ({
    lockStatus: state.lockStatus,
    setIsNativePlayerActive: state.setIsNativePlayerActive,
  })));

  const requestLock = usePlayerStore(state => state.requestLock);
  const xtreamApi = useApiStore((state) => state.xtreamApi);
  const apk = !!import.meta.env.VITE_APK;

  useEffect(() => {
    const nextUrl = sessionStorage.getItem('nextStreamUrl');
    if (lockStatus === 'ACQUIRED' && nextUrl) {
      if (apk) {
        setIsNativePlayerActive(true);
        playVideoAndroid(nextUrl);
        sessionStorage.removeItem('nextStreamUrl');
      } else {
        usePlayerStore.getState().playStream(nextUrl);
        sessionStorage.removeItem('nextStreamUrl');
      }
    }
  }, [lockStatus, apk, setIsNativePlayerActive]);

  const play = (item: PlayableItem) => {
    if (!xtreamApi) { alert('API is not ready.'); return; }
    if (lockStatus !== 'AVAILABLE' && lockStatus !== 'ACQUIRED') { alert(`Cannot play stream, lock status is: ${lockStatus}`); return; }

    // --- THIS IS THE FIX ---
    // We create the correct `StreamURLRequest` object before calling the function.
    let streamUrlRequest;
    if (item.type === 'movie') {
      if (!item.movie.container_extension) {
        alert('Movie container extension is missing.');
        return;
      }
      streamUrlRequest = {
        type: 'movie' as const,
        streamId: item.movie.stream_id,
        extension: item.movie.container_extension,
      };
    } else if (item.type === 'series') {
      if (!item.episode.container_extension) {
        alert('Episode container extension is missing.');
        return;
      }      
      streamUrlRequest = {
        type: 'episode' as const,
        streamId: item.episode.id,
        extension: item.episode.container_extension,
      };
    } else if (item.type === 'livetv') {
      streamUrlRequest = {
        type: 'channel' as const,
        streamId: item.channel.stream_id,
      };
    } else {
      alert('Unknown item type for playback.');
      return;
    }
    
    const streamUrl = xtreamApi.generateStreamUrl(streamUrlRequest);
    // --- END OF FIX ---
    
    if (!streamUrl) { alert('Failed to generate a playable URL for this item.'); return; }

    if (lockStatus === 'ACQUIRED') {
      if (apk) {
        playVideoAndroid(streamUrl);
      } else {
        usePlayerStore.getState().playStream(streamUrl);
      }
    } else {
      sessionStorage.setItem('nextStreamUrl', streamUrl);
      requestLock();
    }
  };

  return { play };
};