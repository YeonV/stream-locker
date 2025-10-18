// src/components/MpvPlayer.tsx

import { useEffect, useState, useRef } from 'react';
import {
  type MpvObservableProperty,
  type MpvConfig,
  init,
  observeProperties,
  command,
  setProperty,
  destroy,
  getProperty,
} from 'tauri-plugin-libmpv-api';
import {
  FiPlay, FiPause, FiVolumeX, FiVolume2, FiMinimize,
  FiRadio, FiMessageSquare, FiCheck,
  FiMaximize,
  FiArrowLeft
} from 'react-icons/fi';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePlayerStore } from '../store/playerStore';


// Types and Constants are unchanged
interface Track { id: number; type: 'video' | 'audio' | 'sub'; lang?: string; title?: string; codec?: string; }
const OBSERVED_PROPERTIES = [
  ['pause', 'flag'], ['time-pos', 'double', 'none'], ['duration', 'double', 'none'],
  ['mute', 'flag'], ['volume', 'int64'], ['filename', 'string', 'none'],
  ['aid', 'int64', 'none'], ['sid', 'int64', 'none'],
] as const satisfies MpvObservableProperty[];

interface MpvPlayerProps {
  src: string;
  onStop?: () => void;
}

export const MpvPlayer = ({ src, onStop }: MpvPlayerProps) => {
  // All state is the same, with one new addition
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [audioTracks, setAudioTracks] = useState<Track[]>([]);
  const [subTracks, setSubTracks] = useState<Track[]>([]);
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [selectedSid, setSelectedSid] = useState<number | null>(null);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

  // --- PHASE 2: NEW STATE FOR AUTO-HIDING ---
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const inactivityTimer = useRef<number | null>(null);
  const stopAndRelease = usePlayerStore(state => state.stopAndRelease);

  // --- Lifecycles are unchanged ---
  useEffect(() => {
    const mpvConfig: MpvConfig = {
      initialOptions: { 'vo': 'gpu-next', 'hwdec': 'auto-safe', 'keep-open': 'yes', 'force-window': 'yes' },
      observedProperties: OBSERVED_PROPERTIES,
    };

    const initialize = async () => {
      try {
        await init(mpvConfig);
        setIsInitialized(true);
        const win = getCurrentWindow();
        const isFs = await win.isFullscreen();
        setIsWindowFullscreen(isFs);
        await observeProperties(OBSERVED_PROPERTIES, async ({ name, data }) => {
          switch (name) {
            case 'pause': setIsPlaying(!data); break;
            case 'time-pos': setTimePos(data || 0); break;
            case 'duration': setDuration(data || 0); break;
            case 'mute': setIsMuted(data as boolean); break;
            case 'volume': setVolume(data as number); break;
            case 'aid': setSelectedAid(data as number | null); break;
            case 'sid': setSelectedSid(data as number | null); break;
            case 'filename':
              // A new file has been loaded. We must gather new intelligence.
              if (data) {
                const trackList = (await getProperty('track-list', 'node')) as Track[] | null;
                if (trackList) {
                  setAudioTracks(trackList.filter(t => t.type === 'audio'));
                  setSubTracks(trackList.filter(t => t.type === 'sub'));
                }
              } else {
                // File unloaded, clear the tracks
                setAudioTracks([]);
                setSubTracks([]);
              }
              break;
          }
        });
        console.log("MpvPlayer: Initialization successful.");
      } catch (error) {
        console.error("MpvPlayer: Initialization failed.", error);
      }
    };
    initialize();
    const unlisten = getCurrentWindow().onResized(async () => {
      const isFs = await getCurrentWindow().isFullscreen();
      setIsWindowFullscreen(isFs);
    });

    return () => {
      destroy().then(() => { if (onStop) onStop() });
      unlisten.then((f: () => void) => f()); // Clean up the listener
    };
  }, [onStop]);

  useEffect(() => {
    if (isInitialized && src) {
      command('loadfile', [src]);
    }
  }, [isInitialized, src]);

  // --- PHASE 2: THE INACTIVITY HANDLER ---
  const handleActivity = () => {
    // Make controls visible
    setAreControlsVisible(true);

    // Clear any existing timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    // Start a new timer to hide the controls
    inactivityTimer.current = window.setTimeout(() => {
      setAreControlsVisible(false);
    }, 3000); // Hide after 3 seconds
  };

  // --- DERIVED STATE is unchanged ---
  const remainingTime = duration > timePos ? duration - timePos : 0;
  const progressPercent = duration > 0 ? (timePos / duration) * 100 : 0;

  // A helper to format time nicely
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
      h > 0 ? h : null,
      m,
      s < 10 ? `0${s}` : s,
    ].filter(v => v !== null).join(':');
  };
  const handleToggleFullscreen = async () => {
    await getCurrentWindow().setFullscreen(!isWindowFullscreen);
    setIsWindowFullscreen(!isWindowFullscreen);
  };

  return (
    <div
      className="w-full h-full bg-transparent relative"
      onMouseMove={handleActivity} // Trigger activity on mouse move
      onMouseLeave={() => setAreControlsVisible(false)} // Hide when mouse leaves
    >
      {isInitialized && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 
                      ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}
          onMouseEnter={handleActivity}
        >
          {/* Top-left back button */}
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={stopAndRelease} 
              className="p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
              title="Go Back"
            >
              <FiArrowLeft size={24} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
            {/* Progress bar logic is unchanged */}
            <div className="w-full group/progress cursor-pointer">
              <div className="w-full bg-white/20 h-1 group-hover/progress:h-2 transition-all">
                <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <button onClick={() => command('cycle', ['pause'])} className="p-2 text-2xl cursor-pointer">
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>

              {/* --- PHASE 1: THE "GHOST PLATE" FIX --- */}
              <div className="relative group/volume p-2"> {/* This is the invisible plate */}
                <button
                  onClick={() => command('cycle', ['mute'])}
                  className="text-xl cursor-pointer" // No padding needed here
                >
                  {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                {/* The slider is positioned relative to the plate */}
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 
                              w-8 h-32 bg-gray-800/80 rounded-md p-2 
                              flex justify-center items-center 
                              opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible 
                              transition-opacity">
                  <input
                    type="range"
                    min="0"
                    max="130"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setProperty('volume', Number(e.target.value));
                      if (isMuted) command('cycle', ['mute']);
                    }}
                    className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer transform -rotate-90"
                  />
                </div>
              </div>

              <span className="font-mono text-xs">-{formatTime(remainingTime)}</span>

              <div className="ml-auto flex items-center space-x-2">
                {audioTracks.length > 1 && (
                  <button onClick={() => { setIsAudioMenuOpen(!isAudioMenuOpen); setIsSubMenuOpen(false); }} className="p-2 text-xl cursor-pointer"><FiRadio /></button>
                )}
                {subTracks.length > 0 && (
                  <button onClick={() => { setIsSubMenuOpen(!isSubMenuOpen); setIsAudioMenuOpen(false); }} className="p-2 text-xl cursor-pointer"><FiMessageSquare /></button>
                )}
                <button
                  onClick={() => {
                    // We will command MPV to resize to 400x225 and move to position 50,50
                    const newGeometry = '400x225+50+50';
                    console.log(`Commanding new geometry: ${newGeometry}`);
                    setProperty('geometry', newGeometry);
                  }}
                  className="p-2 bg-yellow-500 text-black font-bold"
                >
                  Test Geometry
                </button>
                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 text-xl cursor-pointer"
                  title={isWindowFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isWindowFullscreen ? <FiMinimize /> : <FiMaximize />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- AUDIO TRACK DIALOG --- */}
      {isAudioMenuOpen && (
        <div className="absolute bottom-20 right-4 bg-gray-800/90 rounded-md shadow-lg p-2 max-h-64 overflow-y-auto">
          <ul className="text-sm">
            {audioTracks.map(track => (
              <li key={track.id} onClick={() => { setProperty('aid', track.id); setIsAudioMenuOpen(false); }} className="px-3 py-2 hover:bg-blue-600 rounded cursor-pointer flex items-center justify-between">
                <span>{track.title || track.lang || `Track ${track.id}`} ({track.codec})</span>
                {track.id === selectedAid && <FiCheck className="ml-4" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- SUBTITLE TRACK DIALOG --- */}
      {isSubMenuOpen && (
        <div className="absolute bottom-20 right-4 bg-gray-800/90 rounded-md shadow-lg p-2 max-h-64 overflow-y-auto">
          <ul className="text-sm">
            <li onClick={() => { setProperty('sid', 'no'); setIsSubMenuOpen(false); }} className="px-3 py-2 hover:bg-blue-600 rounded cursor-pointer flex items-center justify-between">
              <span>Disable Subtitles</span>
              {selectedSid === null && <FiCheck className="ml-4" />}
            </li>
            {subTracks.map(track => (
              <li key={track.id} onClick={() => { setProperty('sid', track.id); setIsSubMenuOpen(false); }} className="px-3 py-2 hover:bg-blue-600 rounded cursor-pointer flex items-center justify-between">
                <span>{track.title || track.lang || `Track ${track.id}`}</span>
                {track.id === selectedSid && <FiCheck className="ml-4" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};