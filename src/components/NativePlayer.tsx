import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

interface NativePlayerProps {
  url: string;
  playing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any) => void;
  // ... other props like onBuffer, onEnded
}

const NativePlayer = ({ url, playing, onError }: NativePlayerProps) => {
  useEffect(() => {
    // Send commands to the native side when props change
    if (playing) {
      invoke('plugin:media|play', { streamUrl: url });
    } else {
      invoke('plugin:media|stop');
    }
  }, [url, playing]);

  useEffect(() => {
    // Listen for events sent FROM the native side
    const unlisten = listen('media-player-event', (event) => {
      if (event.payload.type === 'error') {
        onError(event.payload.data);
      }
      // Handle other events like 'buffering', 'ended', etc.
    });

    return () => {
      // Cleanup: Stop the native player when the component unmounts
      invoke('plugin:media|destroy');
      unlisten.then(f => f());
    };
  }, [onError]);

  // This component renders NOTHING. The native player is drawn on a separate layer.
  return null; 
};

export default NativePlayer;