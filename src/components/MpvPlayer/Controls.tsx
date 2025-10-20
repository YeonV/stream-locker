// src/components/MpvPlayer/Controls.tsx

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
        <button onClick={stopAndRelease} className="p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer" title="Go Back">
          <FiArrowLeft size={24} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white">
        
        {/* --- OBJECTIVE 1: REPOSITIONED TIME --- */}
        <div className="flex items-center space-x-4">
          <div className="w-full group/progress cursor-pointer" onClick={handleSeek}>
            <div className="w-full bg-white/20 h-1 group-hover/progress:h-2 transition-all">
              <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <span className="font-mono text-xs">-{formatTime(remainingTime)}</span>
        </div>

        <div className="flex items-center space-x-2 mt-2">
              <button onClick={() => command('cycle', ['pause'])} className="p-2 text-3xl cursor-pointer">
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>

              {/* --- OBJECTIVE 2 & 3: VOLUME SYMBIOSIS & ALIGNMENT --- */}
             {/* --- THIS IS THE FINAL WEAPON, FORGED FROM YOUR COMMANDS --- */}
              {/*
                This is the main container. It is the GROUP.
                It is positioned relative so its children can be absolute.
                It is flex-container to center the button.
              */}
              <div className="relative group/volume flex items-center justify-center p-2">
                
                {/* 
                  ELEMENT 3: THE FUCKING OVERLAY AS A BACKGROUND.
                  It is absolute, positioned to fill the space for BOTH the button and the slider.
                  It appears on group-hover.
                */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2
                                w-10 h-44 bg-gray-800/80 rounded-xl
                                opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible
                                transition-all duration-200">
                </div>

                {/* 
                  ELEMENT 2: THE BUTTON.
                  It is relative + z-10 so it is ALWAYS on top and clickable.
                  It is positioned at the bottom of the container.
                */}
                <button
                  onClick={() => command('cycle', ['mute'])}
                  className="relative z-10 text-2xl cursor-pointer"
                >
                  {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                </button>

                {/* 
                  ELEMENT 1: THE VERTICAL SLIDER.
                  It is absolute, positioned inside the overlay area.
                  It also appears on group-hover.
                */}
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
                    className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer transform -rotate-90"
                  />
                </div>
              </div>
              
              {/* Spacer to push remaining controls to the right */}
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
    </>
  );
};