import { createContext, useContext } from 'react';

// 1. The Type Definition
export interface PlaygroundContextType {
  registerContentRef: (node: HTMLElement | null) => void;
}

// 2. The Context Object
export const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

// 3. The Custom Hook
export const usePlaygroundContext = () => {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlaygroundContext must be used within a PlaygroundProvider');
  }
  return context;
};