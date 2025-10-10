import ReactPlayer from 'react-player';
import { usePlayerStore } from '../store/playerStore';
import { useStreamLock } from '../hooks/useStreamLock'; // 1. Import the lock management hook
import { invoke } from '@tauri-apps/api/core'

const Player = () => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  const { stopAndRelease } = useStreamLock(); // 3. Get the function to stop the ReactPlayer

  const handleOpenNativePlayer = () => {
    if (!currentStreamUrl) return;

    // 4. First, stop the current web-based stream and release the lock
    stopAndRelease();

    // 5. Invoke the native player
    console.log(`Invoking native player for URL: ${currentStreamUrl}`);
    invoke('plugin:streamlocker-player|play_fullscreen_command', { streamUrl: currentStreamUrl })
      .catch(err => {
          console.error("Failed to invoke native player:", err);
          alert(`Error: Could not start native player. ${err}`);
      });
  };
  
  // The idle state remains the same
  if (lockStatus !== 'ACQUIRED' || !currentStreamUrl) {
    const statusMessage = () => {
        switch (lockStatus) {
            case 'LOCKED_BY_OTHER': return 'Streaming on another device or tab.';
            case 'AVAILABLE': return 'Select a channel to play.';
            case 'REQUESTING': return 'Requesting stream lock...';
            default: return `Lock status: ${lockStatus}`;
        }
    };
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
    // We wrap everything in a relative container to position the button
    <div className="relative w-full h-full">
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
      
      {/* --- START OF NEW BUTTON --- */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={handleOpenNativePlayer}
          className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 shadow-lg"
          title="Open in high-performance native player"
        >
          Open in Native Player
        </button>
      </div>
      {/* --- END OF NEW BUTTON --- */}
    </div>
  );
};

export default Player;