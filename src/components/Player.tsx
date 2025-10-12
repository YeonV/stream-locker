import { useEffect } from 'react';
import ReactPlayer from 'react-player';
import { usePlayerStore } from '../store/playerStore';
import { playVideo } from 'tauri-plugin-videoplayer-api';

const Player = () => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  const apk = !!import.meta.env.VITE_APK;

  // This effect is the core of our native integration.
  // It triggers whenever the stream URL changes while the lock is acquired on an APK build.
  useEffect(() => {
    if (apk && lockStatus === 'ACQUIRED' && currentStreamUrl) {
      console.log(`[Native] Triggering native player with URL: ${currentStreamUrl}`);
      playVideo(currentStreamUrl);
      
      // We don't need the JS player, so we can tell the store to clear the URL.
      // This prevents the effect from re-running if the component re-renders.
      usePlayerStore.getState().stopStream(); 
    }
  }, [apk, currentStreamUrl, lockStatus]);


  // --- RENDER LOGIC ---

  // 1. Render a specific UI for APK builds
  if (apk) {
    const statusMessage = () => {
      switch (lockStatus) {
        case 'ACQUIRED':
          return 'Attempting to play stream in native player...';
        case 'LOCKED_BY_OTHER':
          return 'Streaming on another device or tab.';
        case 'AVAILABLE':
          return 'Select a channel to begin.';
        case 'REQUESTING':
          return 'Requesting stream lock...';
        default:
          return `Lock status: ${lockStatus}`;
      }
    };
    
    return (
      <div className="flex items-center justify-center w-full bg-black h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Native Player Mode</h2>
          <p className="text-gray-400">{statusMessage()}</p>
          <p className="text-gray-500 text-sm mt-4">If a stream is active, use the back button on your device to exit.</p>
        </div>
      </div>
    );
  }

  // 2. Render the existing UI for Web/Desktop builds
  if (lockStatus !== 'ACQUIRED' || !currentStreamUrl) {
    const statusMessage = () => {
        switch (lockStatus) {
            case 'LOCKED_BY_OTHER':
                return 'Streaming on another device or tab.';
            case 'AVAILABLE':
                return 'Select a channel to play.';
            case 'REQUESTING':
                return 'Requesting stream lock...';
            default:
                return `Lock status: ${lockStatus}`;
        }
    }
    return (
      <div className="flex items-center justify-center w-full bg-black h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Player Idle</h2>
          <p className="text-gray-400">{statusMessage()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black aspect-video" style={{ height: '100%'}}>
      <ReactPlayer
        src={currentStreamUrl}
        playing={true}
        controls={true}
        width="100%"
        height="100%"
        onError={(e) => {
          console.error('Player Error:', e);
          // Calling stopStream will also release the lock via the store's logic
          usePlayerStore.getState().stopStream();
        }}
      />
    </div>
  );
};

export default Player;