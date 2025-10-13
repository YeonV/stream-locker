import { create } from 'zustand';
import { useAuthStore } from './authStore';

export type LockStatus =
  | 'INITIAL'       // App has just started
  | 'AVAILABLE'     // Lock is free for us to take
  | 'LOCKED_BY_OTHER' // Another device has the lock
  | 'REQUESTING'    // We have asked for the lock
  | 'ACQUIRED'      // We own the lock and can stream
  | 'PENDING'       // We are waiting for another device to release it
  | 'AWAITING_MY_RELEASE' // Another device wants the lock, we must stop
  | 'RELEASING'     // We are in the process of stopping our stream
  | 'ERROR'         // An error occurred;

// Define the shape of our state
interface PlayerState {
  lockStatus: LockStatus;
  currentStreamUrl: string | null;
  lockAcquiredByInstanceId: string | null;
  isNativePlayerActive: boolean; // <-- Add the new flag
}

// Define the shape of our actions
interface PlayerActions {
  setLockStatus: (status: LockStatus) => void;
  playStream: (url: string) => void;
  stopStream: () => void;
  setIsNativePlayerActive: (isActive: boolean) => void; // <-- Add the new action
}

// Create the store by combining the state and actions
export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  // --- INITIAL STATE ---
  lockStatus: 'INITIAL',
  currentStreamUrl: null,
  lockAcquiredByInstanceId: null,
  isNativePlayerActive: false,

  // --- ACTIONS ---
  setLockStatus: (status) => set({ lockStatus: status }),
  
  setIsNativePlayerActive: (isActive: boolean) => set({ isNativePlayerActive: isActive }),

  playStream: (url) => set(() => ({ 
    lockStatus: 'ACQUIRED', 
    currentStreamUrl: url, 
    lockAcquiredByInstanceId: useAuthStore.getState().instanceId 
  })),

  stopStream: () => set({ 
    lockStatus: 'AVAILABLE', 
    currentStreamUrl: null, 
    lockAcquiredByInstanceId: null,
    isNativePlayerActive: false // <-- IMPORTANT: Always reset the flag when stopping
  }),
}));