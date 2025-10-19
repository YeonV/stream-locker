import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { useEnvStore } from './envStore';
import { useUiContextStore } from './uiContextStore';

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
  isMpvActive: boolean;
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
  setIsMpvActive: (isActive: boolean) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  lockStatus: 'INITIAL',
  currentStreamUrl: null,
  lockAcquiredByInstanceId: null,
  isNativePlayerActive: false,
  channel: null,
  isMpvActive: false,

  setLockStatus: (status) => set({ lockStatus: status }),
  setIsNativePlayerActive: (isActive: boolean) => set({ isNativePlayerActive: isActive }),

 setIsMpvActive: (isActive) => set({ isMpvActive: isActive }),

  playStream: (url) => {
    const { device, engine } = useEnvStore.getState();
    const shouldUseMpv = engine === 'native' && device === 'windows';
    
    set(() => ({
      lockStatus: 'ACQUIRED',
      currentStreamUrl: url,
      lockAcquiredByInstanceId: useAuthStore.getState().instanceId,
      isMpvActive: shouldUseMpv,
    }));
  },

  stopStream: () => {
    // When we stop, we must also clear the UI context.
    useUiContextStore.getState().clearContext();
    set({
      currentStreamUrl: null,
      lockAcquiredByInstanceId: null,
      isNativePlayerActive: false,
      isMpvActive: false,
    });
  },

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
        if (lockData.locked_by_device_id === myDeviceId && (get().lockStatus === 'REQUESTING' || get().lockStatus === 'PENDING')) {
          set({ lockStatus: 'ACQUIRED' });
        } else if (get().lockStatus !== 'LOCKED_BY_OTHER') {
          get().stopStream(); 
          set({ lockStatus: 'LOCKED_BY_OTHER' });
        }
      } 
      else if (lockData.status === 'AWAITING_RELEASE') {
        // --- THIS IS THE RESTORED, FINAL, CORRECT LOGIC ---
        // If I am the device that owns the lock AND I am the specific instance playing...
        if (lockData.locked_by_device_id === myDeviceId && get().lockAcquiredByInstanceId === myInstanceId) {
          // ...then it is MY duty to release.
          set({ lockStatus: 'AWAITING_MY_RELEASE' });
        }
        // If I am the device that is waiting for the lock...
        else if (lockData.requested_by_device_id === myDeviceId && get().lockStatus === 'REQUESTING') {
          // ...then my status is PENDING.
          set({ lockStatus: 'PENDING' });
        }
      } 
      // --- END OF FIX ---
      else if (lockData.status === 'AVAILABLE') {
        get().stopStream();
        set({ lockStatus: 'AVAILABLE' });
      }
    };

    const newChannel = supabase.channel(`stream-lock-${session.user.id}`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newChannel.on('postgres_changes' as any, { event: '*', schema: 'public', table: 'stream_lock', filter: `user_id=eq.${session.user.id}` }, handleLockUpdate)
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('SUCCESS: SINGLETON SUBSCRIPTION ESTABLISHED. Performing initial state check...');
        supabase.from('stream_lock').select('*').eq('user_id', session.user.id).maybeSingle()
          .then(({ data }) => {
            if (!data) {
                set({ lockStatus: 'AVAILABLE' });
                return;
            }
            if (data.status === 'LOCKED' || data.status === 'AWAITING_RELEASE') {
                if (data.locked_by_device_id === useAuthStore.getState().deviceId) {
                    get().releaseLock();
                } else {
                    set({ lockStatus: 'LOCKED_BY_OTHER' });
                }
            } else {
                set({ lockStatus: 'AVAILABLE' });
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
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },
}));


// The state machine is now correct because the state will be set correctly.
usePlayerStore.subscribe((state, prevState) => {
  if (state.lockStatus === 'AWAITING_MY_RELEASE' && prevState.lockStatus !== 'AWAITING_MY_RELEASE') {
    const { stopStream, releaseLock } = usePlayerStore.getState();
    if (state.currentStreamUrl) {
      stopStream();
    }
    releaseLock();
  }
});