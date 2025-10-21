import { useState } from 'react';
import { FiPlay, FiPause, FiVolumeX, FiVolume2, FiMinimize, FiMaximize, FiRadio, FiMessageSquare, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { command, setProperty } from 'tauri-plugin-libmpv-api';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePlayerStore } from '../../store/playerStore';
import { formatTime } from './MpvPlayer.utils';
import { type Track } from './MpvPlayer.types';

interface ControlsProps {
  isPlaying: boolean;
  timePos: number;
  duration: number;
  isMuted: boolean;
  volume: number;
  audioTracks: Track[];
  subTracks: Track[];
  selectedAid: number | null;
  selectedSid: number | null;
  isWindowFullscreen: boolean;
}

export const Controls = (props: ControlsProps) => {
  const { isPlaying, timePos, duration, isMuted, volume, audioTracks, subTracks, selectedAid, selectedSid, isWindowFullscreen } = props;
  
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const stopAndRelease = usePlayerStore(state => state.stopAndRelease);

  const remainingTime = duration > timePos ? duration - timePos : 0;
  const progressPercent = duration > 0 ? (timePos / duration) * 100 : 0;
  
  const handleToggleFullscreen = async () => {
    await getCurrentWindow().setFullscreen(!isWindowFullscreen);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    command('seek', [String(percentage), 'absolute-percent']);
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={stopAndRelease} 
          // THEMED
          className="p-3 bg-black/50 rounded-full text-text-primary hover:bg-background-glass transition-colors cursor-pointer" 
          title="Go Back"
        >
          <FiArrowLeft size={24} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-text-primary">
        
        <div className="flex items-center space-x-4">
          <div className="w-full group/progress cursor-pointer" onClick={handleSeek}>
            <div className="w-full bg-white/20 h-1 group-hover/progress:h-2 transition-all">
              {/* THEMED */}
              <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <span className="font-mono text-xs text-text-secondary">-{formatTime(remainingTime)}</span>
        </div>

        <div className="flex items-center space-x-2 mt-2">
              <button onClick={() => command('cycle', ['pause'])} className="p-2 text-3xl cursor-pointer">
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>

              {/* YOUR BRILLIANT VOLUME SLIDER LOGIC - ONLY COLORS CHANGED */}
              <div className="relative group/volume flex items-center justify-center p-2">
                <div 
                  // THEMED
                  className="absolute bottom-0 left-1/2 -translate-x-1/2
                                w-10 h-44 bg-background-secondary/80 rounded-xl
                                opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible
                                transition-all duration-200"
                >
                </div>
                <button
                  onClick={() => command('cycle', ['mute'])}
                  className="relative z-10 text-2xl cursor-pointer"
                >
                  {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2
                                h-32 flex justify-center items-center
                                opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible
                                transition-all duration-200">
                  <input
                    type="range"
                    min="0"
                    max="130"
                    value={isMuted ? 0 : volume}
                    onInput={(e) => {
                      setProperty('volume', Number((e.target as HTMLInputElement).value));
                      if (isMuted) command('cycle', ['mute']);
                    }}
                    // THEMED
                    className="w-24 h-2 bg-background-primary rounded-lg  [accent-color:var(--color-accent)] cursor-pointer transform -rotate-90"
                  />
                </div>
              </div>
              
              <div className="flex-grow" />

              <div className="flex items-center space-x-2">
                {audioTracks.length > 1 && (
                  <button onClick={() => { setIsAudioMenuOpen(!isAudioMenuOpen); setIsSubMenuOpen(false); }} className="p-2 text-2xl cursor-pointer"><FiRadio /></button>
                )}
                {subTracks.length > 0 && (
                  <button onClick={() => { setIsSubMenuOpen(!isSubMenuOpen); setIsAudioMenuOpen(false); }} className="p-2 text-2xl cursor-pointer"><FiMessageSquare /></button>
                )}
                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 text-2xl cursor-pointer"
                  title={isWindowFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isWindowFullscreen ? <FiMinimize /> : <FiMaximize />}
                </button>
              </div>
        </div>
      </div>
      
      {/* --- AUDIO TRACK DIALOG --- */}
      {isAudioMenuOpen && (
        // THEMED
        <div className="absolute bottom-20 right-4 bg-background-secondary/90 rounded-md shadow-lg p-2 max-h-64 overflow-y-auto border border-border-primary">
          <ul className="text-sm">
            {audioTracks.map(track => (
              <li key={track.id} onClick={() => { setProperty('aid', track.id); setIsAudioMenuOpen(false); }} className="px-3 py-2 hover:bg-primary rounded cursor-pointer flex items-center justify-between">
                <span>{track.title || track.lang || `Track ${track.id}`} ({track.codec})</span>
                {track.id === selectedAid && <FiCheck className="ml-4 text-primary-focus" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- SUBTITLE TRACK DIALOG --- */}
      {isSubMenuOpen && (
        // THEMED
        <div className="absolute bottom-20 right-4 bg-background-secondary/90 rounded-md shadow-lg p-2 max-h-64 overflow-y-auto border border-border-primary">
          <ul className="text-sm">
            <li onClick={() => { setProperty('sid', 'no'); setIsSubMenuOpen(false); }} className="px-3 py-2 hover:bg-primary rounded cursor-pointer flex items-center justify-between">
              <span>Disable Subtitles</span>
              {selectedSid === null && <FiCheck className="ml-4 text-primary-focus" />}
            </li>
            {subTracks.map(track => (
              <li key={track.id} onClick={() => { setProperty('sid', track.id); setIsSubMenuOpen(false); }} className="px-3 py-2 hover:bg-primary rounded cursor-pointer flex items-center justify-between">
                <span>{track.title || track.lang || `Track ${track.id}`}</span>
                {track.id === selectedSid && <FiCheck className="ml-4 text-primary-focus" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};