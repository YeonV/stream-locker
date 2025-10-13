import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  src: string; // The URL of the stream to play
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPlayerError?: (event: any) => void; // Optional error handler
}

export const HlsPlayer = ({ src, onPlayerError }: HlsPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // --- This is the core logic ---

    if (Hls.isSupported()) {
      // If HLS is supported, create and configure the hls.js instance
      const hls = new Hls();
      hlsRef.current = hls; // Capture the instance in our ref

      hls.loadSource(src);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(() => {
          console.log('User interaction might be needed to play the video.');
        });
      });

      // Listen for fatal errors and pass them up
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS.js fatal error:', data);
          if (onPlayerError) onPlayerError(data);
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // For platforms like Safari that have native HLS support
      videoElement.src = src;
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(() => {
          console.log('User interaction might be needed to play the video.');
        });
      });
    }

    // --- THIS IS THE GUARANTEED CLEANUP ---
    return () => {
      if (hlsRef.current) {
        console.log('[HlsPlayer] Destroying HLS.js instance.');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onPlayerError]); // Re-run this effect if the `src` URL changes

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', height: '100%' }}
      // This helps with autoplay policies on some browsers
      playsInline
      muted={false}
    />
  );
};