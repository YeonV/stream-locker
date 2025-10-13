import { create } from 'zustand';
import { useAuthStore } from './authStore';

export type LockStatus =
  | 'INITIAL'
  | 'AVAILABLE'
  | 'LOCKED_BY_OTHER'
  | 'REQUESTING'
  | 'ACQUIRED'
  | 'PENDING'
  | 'AWAITING_MY_RELEASE'
  | 'RELEASING'
  | 'ERROR';

interface PlayerState {
  lockStatus: LockStatus;
  currentStreamUrl: string | null;
  lockAcquiredByInstanceId: string | null;
  isNativePlayerActive: boolean;
}

interface PlayerActions {
  setLockStatus: (status: LockStatus) => void;
  playStream: (url: string) => void;
  stopStream: () => void;
  setIsNativePlayerActive: (isActive: boolean) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  lockStatus: 'INITIAL',
  currentStreamUrl: null,
  lockAcquiredByInstanceId: null,
  isNativePlayerActive: false,

  setLockStatus: (status) => set({ lockStatus: status }),
  setIsNativePlayerActive: (isActive: boolean) => set({ isNativePlayerActive: isActive }),

  playStream: (url) => set(() => ({
    // This action still sets ACQUIRED because it's the successful outcome of a lock request.
    lockStatus: 'ACQUIRED',
    currentStreamUrl: url,
    lockAcquiredByInstanceId: useAuthStore.getState().instanceId,
  })),

  // --- THIS IS THE CRITICAL FIX ---
  // stopStream will now ONLY affect the stream URL and native flag.
  // It will NOT touch the lockStatus anymore.
  stopStream: () => set({
    currentStreamUrl: null,
    lockAcquiredByInstanceId: null,
    isNativePlayerActive: false,
  }),
}));