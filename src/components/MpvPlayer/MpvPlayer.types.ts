// src/components/MpvPlayer/MpvPlayer.types.ts

import { type MpvObservableProperty } from 'tauri-plugin-libmpv-api';

export interface Track {
  id: number;
  type: 'video' | 'audio' | 'sub';
  lang?: string;
  title?: string;
  codec?: string;
}

export const OBSERVED_PROPERTIES = [
  ['pause', 'flag'],
  ['time-pos', 'double', 'none'],
  ['duration', 'double', 'none'],
  ['mute', 'flag'],
  ['volume', 'int64'],
  ['filename', 'string', 'none'],
  ['aid', 'int64', 'none'],
  ['sid', 'int64', 'none'],
] as const satisfies MpvObservableProperty[];

export interface MpvPlayerProps {
  src: string;
  onStop?: () => void;
}