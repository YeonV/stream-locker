import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';

// --- Types are correct ---
interface StreamLockData {
  user_id: string;
  status: 'AVAILABLE' | 'LOCKED' | 'AWAITING_RELEASE';
  locked_by_device_id: string | null;
  requested_by_device_id: string | null;
}
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

// --- Interfaces are correct ---
interface PlayerState {
  lockStatus: LockStatus;
  currentStreamUrl: string | null;
  lockAcquiredByInstanceId: string | null;
  isNativePlayerActive: boolean;
  channel: RealtimeChannel | null;
}

interface PlayerActions {
  setLockStatus: (status: LockStatus) => void;
  playStream: (url: string) => void;
  stopStream: () => void;
  setIsNativePlayerActive: (isActive: boolean) => void;
  subscribeToLock: (session: Session) => void;
  unsubscribeFromLock: () => void;
  requestLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
  stopAndRelease: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  lockStatus: 'INITIAL',
  currentStreamUrl: null,
  lockAcquiredByInstanceId: null,
  isNativePlayerActive: false,
  channel: null,

  setLockStatus: (status) => set({ lockStatus: status }),
  setIsNativePlayerActive: (isActive: boolean) => set({ isNativePlayerActive: isActive }),

  playStream: (url) => set(() => ({
    lockStatus: 'ACQUIRED',
    currentStreamUrl: url,
    lockAcquiredByInstanceId: useAuthStore.getState().instanceId,
  })),

  stopStream: () => set({
    currentStreamUrl: null,
    lockAcquiredByInstanceId: null,
    isNativePlayerActive: false,
  }),

  requestLock: async () => {
    const { session, deviceId } = useAuthStore.getState();
    if (!session) return;
    set({ lockStatus: 'REQUESTING' });
    const { error } = await supabase.functions.invoke('request-stream-lock', {
      body: { requestingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error requesting lock:", error);
      set({ lockStatus: 'ERROR' });
    }
  },

  releaseLock: async () => {
    const { session, deviceId } = useAuthStore.getState();
    if (!session) return;
    set({ lockStatus: 'RELEASING' });
    const { error } = await supabase.functions.invoke('release-stream-lock', {
      body: { releasingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error releasing lock:", error);
      set({ lockStatus: 'ERROR' });
    }
  },

  stopAndRelease: () => {
    if (get().lockStatus === 'ACQUIRED') {
      console.log('User initiated stop. Stopping stream and releasing lock.');
      get().stopStream();
      get().releaseLock();
    }
  },

  subscribeToLock: (session) => {
    if (get().channel) return;

    const handleLockUpdate = (payload: { new: StreamLockData }) => {
      const lockData = payload.new;
      const myDeviceId = useAuthStore.getState().deviceId;
      const myInstanceId = useAuthStore.getState().instanceId;

      if (lockData.status === 'LOCKED') {
        if (lockData.locked_by_device_id === myDeviceId && get().lockStatus === 'REQUESTING') {
          set({ lockStatus: 'ACQUIRED' });
        } else if (get().lockStatus !== 'LOCKED_BY_OTHER') {
          get().stopStream(); 
          set({ lockStatus: 'LOCKED_BY_OTHER' });
        }
      } else if (lockData.status === 'AWAITING_RELEASE') {
        if (lockData.locked_by_device_id === myDeviceId && get().lockAcquiredByInstanceId === myInstanceId) {
          set({ lockStatus: 'AWAITING_MY_RELEASE' });
        }
      } else if (lockData.status === 'AVAILABLE') {
        get().stopStream();
        set({ lockStatus: 'AVAILABLE' });
      }
    };

    const newChannel = supabase.channel(`stream-lock-${session.user.id}`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newChannel.on('postgres_changes' as any, { event: '*', schema: 'public', table: 'stream_lock', filter: `user_id=eq.${session.user.id}` }, handleLockUpdate)
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('SUCCESS: SINGLETON SUBSCRIPTION ESTABLISHED.');
        supabase.from('stream_lock').select('*').eq('user_id', session.user.id).maybeSingle().then(({ data }) => {
            if (!data) {
                set({ lockStatus: 'AVAILABLE' });
            } else if (data.status === 'LOCKED' && data.locked_by_device_id !== useAuthStore.getState().deviceId) {
                set({ lockStatus: 'LOCKED_BY_OTHER'});
            } else {
                set({ lockStatus: 'AVAILABLE'});
            }
        });
      } else if (err) {
        console.error('CRITICAL SUBSCRIPTION ERROR:', err);
        set({ lockStatus: 'ERROR' });
      }
    });
    set({ channel: newChannel });
  },

  unsubscribeFromLock: () => {
    const channel = get().channel;
    if (channel) {
      console.log('UNSUBSCRIBING SINGLETON CHANNEL.');
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));


// --- The State Machine, listening to the store itself ---
usePlayerStore.subscribe((state, prevState) => {
  if (state.lockStatus === 'AWAITING_MY_RELEASE' && prevState.lockStatus !== 'AWAITING_MY_RELEASE') {
    console.log('State machine: Detected AWAITING_MY_RELEASE. Auto-releasing lock.');
    const { stopStream, releaseLock } = usePlayerStore.getState();
    if (state.currentStreamUrl) {
      stopStream();
    }
    releaseLock();
  }
});