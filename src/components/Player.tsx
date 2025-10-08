import ReactPlayer from 'react-player';
import { usePlayerStore } from '../store/playerStore';

const Player = () => {
  const { currentStreamUrl, lockStatus } = usePlayerStore();
  
  if (lockStatus !== 'ACQUIRED' || !currentStreamUrl) {
    const statusMessage = () => {
        switch (lockStatus) {
            case 'LOCKED_BY_OTHER':
                return 'Streaming on another device or tab.';
            case 'AVAILABLE':
                return 'Select a channel to play.';
            case 'REQUESTING':
                return 'Requesting stream lock...';
            // Add other cases as needed
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

  // Check if HLS.js can play this URL. ReactPlayer does this internally,
  // but this is a good check to have for debugging.
  const canPlay = ReactPlayer && ReactPlayer.canPlay && ReactPlayer.canPlay(currentStreamUrl);
  console.log(`ReactPlayer can play ${currentStreamUrl}: ${canPlay}`);

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