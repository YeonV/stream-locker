import ReactPlayer from 'react-player';
import { usePlayerStore } from '../store/playerStore';

const Player = () => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  const apk = !!import.meta.env.VITE_APK;

  // The incorrect useEffect that called playVideo and stopStream has been REMOVED.
  // All playback initiation logic now lives in DashboardPage.tsx.

  // --- RENDER LOGIC ---

  // 1. Render a specific UI for APK builds (this component is now just a status display on APK)
  if (apk) {
    const statusMessage = () => {
      switch (lockStatus) {
        case 'ACQUIRED':
          return 'Playing stream in native player...';
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
          <p className="text-gray-500 text-sm mt-4">Use the back button on your device to exit the video.</p>
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
          usePlayerStore.getState().stopStream();
        }}
      />
    </div>
  );
};

export default Player;