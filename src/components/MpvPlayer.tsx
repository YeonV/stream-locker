// src/components/MpvPlayer.tsx

import { useEffect, useState } from 'react';
import {
  type MpvObservableProperty,
  type MpvConfig,
  init,
  observeProperties,
  command,
  setProperty,
  destroy,
} from 'tauri-plugin-libmpv-api';

const OBSERVED_PROPERTIES = [
  ['pause', 'flag'],
  ['time-pos', 'double', 'none'],
  ['duration', 'double', 'none'],
] as const satisfies MpvObservableProperty[];

interface MpvPlayerProps {
  src: string;
  onStop?: () => void; // A way to signal back that playback has stopped
}

export const MpvPlayer = ({ src, onStop }: MpvPlayerProps) => {
  // --- INTERNAL STATE: This legion manages its own intel ---
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- LIFECYCLE MANAGEMENT: Forging and Breaking the Weapon ---
  useEffect(() => {
    const mpvConfig: MpvConfig = {
      initialOptions: {
        'vo': 'gpu-next',
        'hwdec': 'auto-safe',
        'keep-open': 'yes',
        'fullscreen': 'yes', // Command fullscreen on start
      },
      observedProperties: OBSERVED_PROPERTIES,
    };

    const initialize = async () => {
      try {
        await init(mpvConfig);
        await observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
          switch (name) {
            case 'pause': setIsPlaying(!data); break;
            case 'time-pos': setTimePos(data || 0); break;
            case 'duration': setDuration(data || 0); break;
          }
        });
        setIsInitialized(true);
        console.log("MpvPlayer: Initialization successful.");
      } catch (error) {
        console.error("MpvPlayer: Initialization failed.", error);
      }
    };

    initialize();

    // The cleanup function: This runs when the component is unmounted.
    return () => {
      console.log("MpvPlayer: Shutting down...");
      destroy();
      setIsInitialized(false);
      if (onStop) onStop();
    };
  }, [onStop]); // Empty array means this runs only once on mount/unmount

  // --- COMMAND: Reacting to new orders (new stream URL) ---
  useEffect(() => {
    if (isInitialized && src) {
      console.log(`MpvPlayer: Loading file: ${src}`);
      command('loadfile', [src]);
    }
  }, [isInitialized, src]);

  // --- The UI: The legion's armor and weapons ---
  return (
    <div className="w-full h-full bg-black relative">
      {/* Video renders behind. The UI is the overlay. */}
      {isInitialized && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 text-white">
          <div className="flex items-center space-x-4">
            <button onClick={() => command('cycle', ['pause'])}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span className="font-mono">{timePos.toFixed(0)}s / {duration.toFixed(0)}s</span>
            <button onClick={() => setProperty('fullscreen', 'no')} className="ml-auto">
              Exit Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};