import { BsPlayBtnFill } from 'react-icons/bs';
import { usePlayerStore } from '../store/playerStore';
import { HlsPlayer } from './HlsPlayer';
import { MkvPlayer } from './MkvPlayer';
import { useCallback } from 'react';

// Define the props it will receive from its parent
interface PlayerProps {
  onRequestTakeover: () => void;
  hideWhenIdle?: boolean; // New prop to control visibility when idle
}

const Player = ({ onRequestTakeover, hideWhenIdle }: PlayerProps) => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  const apk = !!import.meta.env.VITE_APK;

  const isMkv = currentStreamUrl?.includes('.mkv');
  const handlePlayerError = useCallback(() => {
    console.error('Player Error. Stopping stream.');
    // Using getState() is safe inside useCallback without adding dependencies
    usePlayerStore.getState().stopStream();
  }, []);

  if (apk) {
    const statusMessage = () => {
      switch (lockStatus) {
        case 'ACQUIRED': return 'Playing stream in native player...';
        case 'LOCKED_BY_OTHER': return 'Streaming on another device or tab.';
        case 'AVAILABLE': return 'Select a channel to begin.';
        case 'REQUESTING': return 'Requesting stream lock...';
        default: return `Lock status: ${lockStatus}`;
      }
    };
    return (
      <div className={`flex items-center justify-center w-full bg-black h-full ${hideWhenIdle ? 'hidden' : 'block'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Native Player Mode</h2>
          <p className="text-gray-400">{statusMessage()}</p>
          {lockStatus === 'LOCKED_BY_OTHER' 
            ? (<>
            <p className="text-gray-500 text-sm mt-2">The stream is currently active on another device.</p>
            <button
                onClick={onRequestTakeover}
                title="Stop all and Steal Lock"
                className={`mt-4 p-2 rounded-full hover:bg-gray-700 text-blue-400 animate-pulse`}
              >
                <BsPlayBtnFill size={24} />
              </button>
            </>) : <p className="text-gray-500 text-sm mt-4">Use the back button on your device to exit the video.</p>}
        </div>
      </div>
    );
  }

  if (lockStatus !== 'ACQUIRED' || !currentStreamUrl) {
    const statusMessage = () => {
      switch (lockStatus) {
        case 'LOCKED_BY_OTHER': return 'Streaming on another device or tab.';
        case 'AVAILABLE': return 'Select a channel to play.';
        case 'REQUESTING': return 'Requesting stream lock...';
        case 'ERROR': return 'An error occurred. Please try reloading.';
        default: return `Lock status: ${lockStatus}`;
      }
    };
    return (
      <div className={`flex items-center justify-center w-full bg-black h-full ${hideWhenIdle ? 'hidden' : 'block'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Player Idle</h2>
          <p className="text-gray-400">{statusMessage()}</p>
          <button
            onClick={onRequestTakeover}
            title="Stop all and Steal Lock"
            className={`mt-4 p-2 rounded-full hover:bg-gray-700 ${lockStatus === 'LOCKED_BY_OTHER' ? 'text-blue-400 animate-pulse' : 'hidden'}`}
          >
            <BsPlayBtnFill size={24} />
          </button>
        </div>
      </div>
    );
  }

  // --- THIS IS THE FINAL REPLACEMENT ---
  // We render our new, clean, reliable HlsPlayer.
  return (
    <div className="w-full h-full bg-black">
      {isMkv
        ? <MkvPlayer src={currentStreamUrl} onError={handlePlayerError} />
        : <HlsPlayer src={currentStreamUrl} onPlayerError={handlePlayerError} />}
    </div>
  );
};

export default Player;