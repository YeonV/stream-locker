import { usePlayerStore } from '../store/playerStore';
import { FiStopCircle } from 'react-icons/fi';
import { FaUnlockAlt } from 'react-icons/fa';
import { useShallow } from 'zustand/react/shallow';

interface SmartStopButtonProps {
  size?: number; // Optional size prop for the icon
}

export const SmartStopButton = ({ size = 24 }: SmartStopButtonProps) => {
  // Get all necessary state and functions from the global store
  const { lockStatus, stopAndRelease, requestLock } = usePlayerStore(useShallow(state => ({
    lockStatus: state.lockStatus,
    stopAndRelease: state.stopAndRelease,
    requestLock: state.requestLock,
  })));

  // This component will only render something if the status is relevant.
  // Otherwise, it returns null.
  
  if (lockStatus === 'ACQUIRED') {
    return (
      <button 
        onClick={stopAndRelease} 
        title="Stop Stream" 
        className="p-2 rounded-full text-primary-focus hover:bg-background-glass focus:outline-none focus:ring-2 focus:ring-primary-focus"
      >
        <FiStopCircle size={size} />
      </button>
    );
  }

  if (lockStatus === 'LOCKED_BY_OTHER') {
    return (
      <button
        onClick={requestLock}
        autoFocus
        title="Play Here (Takeover)"
        className="p-2 rounded-full text-primary-focus hover:bg-background-glass focus:outline-none focus:ring-2 focus:ring-primary-focus"
      >
        <FaUnlockAlt size={size} />
      </button>
    );
  }

  // For any other status ('AVAILABLE', 'REQUESTING', etc.), render nothing.
  return null;
};