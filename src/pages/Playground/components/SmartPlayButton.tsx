import { usePlayerStore } from '../../../store/playerStore';
import { FiPlay, FiLoader } from 'react-icons/fi';
import { FaUnlockAlt } from 'react-icons/fa';
import { useShallow } from 'zustand/react/shallow';

interface SmartPlayButtonProps {
  onPlay: () => void; // A function to call when the button is in a "Play" state
  variant?: 'button' | 'icon';
  className?: string;
}

export const SmartPlayButton = ({ onPlay, variant = 'button', className }: SmartPlayButtonProps) => {
  // We only need the lockStatus and requestLock function
  const { lockStatus, requestLock } = usePlayerStore(useShallow(state => ({
    lockStatus: state.lockStatus,
    requestLock: state.requestLock,
  })));

  const handleTakeover = () => {
    if (lockStatus === 'LOCKED_BY_OTHER') {
      requestLock();
    }
  };

  // --- Determine Button State based on lockStatus ---
  let content, action, style;

  switch (lockStatus) {
    case 'ACQUIRED':
    case 'AVAILABLE':
      content = <><FiPlay className="mr-2" /> Play</>;
      action = onPlay;
      style = 'bg-play text-on-play hover:bg-play-hover';
      break;

    case 'REQUESTING':
    case 'PENDING':
      content = <><FiLoader className="animate-spin mr-2" /> Requesting...</>;
      action = () => {}; // No action
      style = 'bg-background-secondary text-text-secondary cursor-not-allowed';
      break;

    case 'LOCKED_BY_OTHER':
      content = <><FaUnlockAlt className="mr-2" /> Takeover Stream</>;
      action = handleTakeover;
      style = 'bg-error/80 text-on-primary hover:bg-error';
      break;
      
    default: // ERROR or any other state
      content = 'Unavailable';
      action = () => {};
      style = 'bg-background-secondary text-text-tertiary cursor-not-allowed';
  }

  // --- Render based on Variant ---
  if (variant === 'icon') {
    // A smaller, icon-only version for lists
    return (
      <button onClick={action} className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-focus ${style} ${className}`}>
        {lockStatus === 'ACQUIRED' || lockStatus === 'AVAILABLE' ? <FiPlay /> :
         lockStatus === 'LOCKED_BY_OTHER' ? <FaUnlockAlt /> :
         <FiLoader className="animate-spin" />}
      </button>
    );
  }

  // The default, full-button version
  return (
    <button
      onClick={action}
      disabled={lockStatus !== 'ACQUIRED' && lockStatus !== 'AVAILABLE' && lockStatus !== 'LOCKED_BY_OTHER'}
      className={`w-full flex items-center justify-center p-2.5 rounded-lg font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary focus:ring-primary-focus ${style} ${className}`}
    >
      {content}
    </button>
  );
};