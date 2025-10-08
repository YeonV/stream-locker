import { create } from 'zustand'
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
  | 'ERROR'         // An error occurred

interface PlayerState {
  lockStatus: LockStatus
  currentStreamUrl: string | null
  lockAcquiredByInstanceId: string | null;
  setLockStatus: (status: LockStatus) => void
  playStream: (url: string) => void
  stopStream: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  lockStatus: 'INITIAL',
  currentStreamUrl: null,
  lockAcquiredByInstanceId: null,
  setLockStatus: (status) => set({ lockStatus: status }),
  playStream: (url) => set(() => ({ 
    lockStatus: 'ACQUIRED', 
    currentStreamUrl: url, 
    lockAcquiredByInstanceId: useAuthStore.getState().instanceId 
  })),

  stopStream: () => set({ 
    lockStatus: 'AVAILABLE', 
    currentStreamUrl: null, 
    lockAcquiredByInstanceId: null 
  }),
}))