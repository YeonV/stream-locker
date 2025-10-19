// src/components/MpvPlayer/MpvPlayer.tsx

import { useState, useRef } from 'react';
import { useMpvLifecycle } from './hooks/useMpvLifecycle';
import { Controls } from './Controls';
import { type MpvPlayerProps } from './MpvPlayer.types';
import { ContextWidget } from './ContextWidget';

export const MpvPlayer = (props: MpvPlayerProps) => {
  const { isInitialized, ...playerState } = useMpvLifecycle(props);
  
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const inactivityTimer = useRef<number | null>(null);

  const handleActivity = () => {
    setAreControlsVisible(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      setAreControlsVisible(false);
    }, 3000);
  };

  return (
    <div
      className="w-full h-full bg-transparent relative"
      onMouseMove={handleActivity} 
      onMouseLeave={() => setAreControlsVisible(false)} 
    >
      {isInitialized && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={handleActivity}
        >
          <ContextWidget />
          <Controls {...playerState} />
        </div>
      )}
    </div>
  );
};