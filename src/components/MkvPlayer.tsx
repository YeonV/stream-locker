import { useEffect, useRef } from 'react';

interface MkvPlayerProps {
  src: string;
  onError?: (e: Event) => void; // Add an error callback prop
}

export const MkvPlayer = ({ src, onError }: MkvPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // --- Add an error listener ---
    const handleError = (e: Event) => {
      console.error("Native video player error:", video.error);
      if (onError) {
        onError(e);
      }
    };

    video.addEventListener('error', handleError);
    
    // Set the source and play
    video.src = src;
    video.play().catch(e => console.log("Autoplay may require user interaction:", e));

    // Cleanup function
    return () => {
      video.removeEventListener('error', handleError);
    };

  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', height: '100%' }}
      playsInline
    />
  );
};