// src/components/PlayerWidget.tsx

import { BsPlayBtnFill } from 'react-icons/bs';
import { usePlayerStore } from '../store/playerStore';
import { useEnvStore } from '../store/envStore';
import { useCallback } from 'react';

interface PlayerWidgetProps {
  hideWhenIdle?: boolean;
}

export const PlayerWidget = ({ hideWhenIdle }: PlayerWidgetProps) => {
  // --- GATHER INTELLIGENCE ---
  // We get ALL the state we need from the stores.
  const { lockStatus, requestLock, currentStreamUrl } = usePlayerStore();
  const { device, engine } = useEnvStore();

  const onRequestTakeover = useCallback(() => {
    if (lockStatus === 'LOCKED_BY_OTHER') {
      requestLock();
    }
  }, [lockStatus, requestLock]);

  const isAndroidNative = engine === 'native' && (device === 'android' || device === 'androidtv' || device === 'firetv');

  // --- RENDER NATIVE ANDROID UI ---
  if (isAndroidNative) {
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
      <div className={`flex items-center justify-center w-full bg-black h-full ${hideWhenIdle && lockStatus !== 'LOCKED_BY_OTHER' ? 'hidden' : 'block'}`}>
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

  // --- RENDER IDLE / STATUS UI for all other platforms ---
  if (lockStatus !== 'ACQUIRED' || !currentStreamUrl) {
    const statusMessage = () => {
      switch (lockStatus) {
        case 'LOCKED_BY_OTHER': return 'Streaming on another device or tab.';
        case 'AVAILABLE': return 'Select a channel to play.';
        case 'REQUESTING': return 'Requesting stream lock...';
        case 'PENDING': return 'Takeover initiated, awaiting release...';
        case 'ERROR': return 'An error occurred. Please try reloading.';
        default: return `Lock status: ${lockStatus}`;
      }
    };
    return (
      <div className={`flex items-center justify-center w-full bg-black h-full ${hideWhenIdle && lockStatus !== 'LOCKED_BY_OTHER' ? 'hidden' : 'block'}`}>
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

  // If a stream is playing (and we're not on Android native), this widget's job is done.
  // It renders nothing, because the "Ghost" (VideoPlayer.tsx) is in command.
  return null;
};