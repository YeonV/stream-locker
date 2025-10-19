import { useEffect, useState } from "react";

const getOrientation = () => window.screen.orientation.type.split('-')[0];
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());
  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);
  return orientation as 'portrait' | 'landscape';
};
