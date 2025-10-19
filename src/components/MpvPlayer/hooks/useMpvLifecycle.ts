// src/components/MpvPlayer/hooks/useMpvLifecycle.ts

import { useState, useEffect } from 'react';
import {
  type MpvConfig, init, observeProperties, command, getProperty, destroy
} from 'tauri-plugin-libmpv-api';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { OBSERVED_PROPERTIES, type Track, type MpvPlayerProps } from '../MpvPlayer.types';

export const useMpvLifecycle = ({ src, onStop }: MpvPlayerProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [audioTracks, setAudioTracks] = useState<Track[]>([]);
  const [subTracks, setSubTracks] = useState<Track[]>([]);
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [selectedSid, setSelectedSid] = useState<number | null>(null);
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

  // --- Main Lifecycle: Initialization and Destruction ---
  useEffect(() => {
    const mpvConfig: MpvConfig = {
      initialOptions: { 'vo': 'gpu-next', 'hwdec': 'auto-safe', 'keep-open': 'yes', 'force-window': 'yes' },
      observedProperties: OBSERVED_PROPERTIES,
    };

    const initialize = async () => {
      try {
        await init(mpvConfig);
        setIsInitialized(true);
        const win = getCurrentWindow();
        const isFs = await win.isFullscreen();
        setIsWindowFullscreen(isFs);
        await observeProperties(OBSERVED_PROPERTIES, async ({ name, data }) => {
          switch (name) {
            case 'pause': setIsPlaying(!data); break;
            case 'time-pos': setTimePos(data || 0); break;
            case 'duration': setDuration(data || 0); break;
            case 'mute': setIsMuted(data as boolean); break;
            case 'volume': setVolume(data as number); break;
            case 'aid': setSelectedAid(data as number | null); break;
            case 'sid': setSelectedSid(data as number | null); break;
            case 'filename':
              if (data) {
                const trackList = (await getProperty('track-list', 'node')) as Track[] | null;
                if (trackList) {
                  setAudioTracks(trackList.filter(t => t.type === 'audio'));
                  setSubTracks(trackList.filter(t => t.type === 'sub'));
                }
              } else {
                setAudioTracks([]); setSubTracks([]);
              }
              break;
          }
        });
        console.log("MpvLifecycle: Initialization successful.");
      } catch (error) { console.error("MpvLifecycle: Initialization failed.", error); }
    };
    initialize();
    
    const unlistenPromise = getCurrentWindow().onResized(async () => {
      const isFs = await getCurrentWindow().isFullscreen();
      setIsWindowFullscreen(isFs);
    });

    return () => {
      destroy().then(() => { if (onStop) onStop(); });
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [onStop]);

  // --- File Loading ---
  useEffect(() => {
    if (isInitialized && src) {
      command('loadfile', [src]);
    }
  }, [isInitialized, src]);

  // Return all the state and data needed by the UI
  return {
    isInitialized, isPlaying, timePos, duration, isMuted, volume,
    audioTracks, subTracks, selectedAid, selectedSid, isWindowFullscreen
  };
};