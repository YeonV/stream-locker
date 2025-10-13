import { BsPlayBtnFill } from 'react-icons/bs';
import { usePlayerStore } from '../store/playerStore';
import { HlsPlayer } from './HlsPlayer'; // <-- Import our new component

// Define the props it will receive from its parent
interface PlayerProps {
  onRequestTakeover: () => void;
}

const Player = ({ onRequestTakeover }: PlayerProps) => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  const apk = !!import.meta.env.VITE_APK;

  // --- APK / Idle Logic (Unchanged and Correct) ---

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
      <div className="flex items-center justify-center w-full bg-black h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Native Player Mode</h2>
          <p className="text-gray-400">{statusMessage()}</p>
          <p className="text-gray-500 text-sm mt-4">Use the back button on your device to exit the video.</p>
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
      <div className="flex items-center justify-center w-full bg-black h-full">
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
      <HlsPlayer
        src={currentStreamUrl}
        onPlayerError={() => {
          console.error('HLS Player Error. Stopping stream.');
          usePlayerStore.getState().stopStream();
        }}
      />
    </div>
  );
};

export default Player;