// src/store/FooterStore.ts

import { create } from 'zustand';


interface FooterState {
    play: string
    rewind: string
    forward: string
    setPlay: (label: string) => void
    setRewind: (label: string) => void
    setForward: (label: string) => void
}

export const useFooterStore = create<FooterState>((set) => ({
    play: 'Play / Pause',
    rewind: 'Rewind',
    forward: 'Fast Forward',
    setPlay: (label) => set({ play: label }),
    setRewind: (label) => set({ rewind: label }),
    setForward: (label) => set({ forward: label }),
}));