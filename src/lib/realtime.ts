// src/lib/realtime.ts

import { supabase } from './supabase';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';

interface StreamLockData {
  user_id: string;
  status: 'AVAILABLE' | 'LOCKED' | 'AWAITING_RELEASE';
  locked_by_device_id: string | null;
  requested_by_device_id: string | null;
}

// The singleton instance. It lives here, outside of any component.
let channel: RealtimeChannel | null = null;

export const subscribeToLock = (session: Session) => {
  if (channel) return; // If it already exists, do nothing.

  const { getState, setState } = usePlayerStore;
  const { getState: getAuth } = useAuthStore;

  const handleLockUpdate = (payload: { new: StreamLockData }) => {
    const lockData = payload.new;
    const myDeviceId = getAuth().deviceId;
    const myInstanceId = getAuth().instanceId;

    if (lockData.status === 'LOCKED') {
      if (lockData.locked_by_device_id === myDeviceId && getState().lockStatus === 'REQUESTING') {
        setState({ lockStatus: 'ACQUIRED' });
      } else if (getState().lockStatus !== 'LOCKED_BY_OTHER') {
        getState().stopStream(); 
        setState({ lockStatus: 'LOCKED_BY_OTHER' });
      }
    } else if (lockData.status === 'AWAITING_RELEASE') {
      if (lockData.locked_by_device_id === myDeviceId && getState().lockAcquiredByInstanceId === myInstanceId) {
        setState({ lockStatus: 'AWAITING_MY_RELEASE' });
      }
    } else if (lockData.status === 'AVAILABLE') {
      getState().stopStream();
      setState({ lockStatus: 'AVAILABLE' });
    }
  };

  const channelName = `stream-lock-${session.user.id}`;
  channel = supabase.channel(channelName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel.on('postgres_changes' as any, { event: '*', schema: 'public', table: 'stream_lock', filter: `user_id=eq.${session.user.id}` }, handleLockUpdate)
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('SUCCESS: SINGLETON SUBSCRIPTION ESTABLISHED.');
      // Perform the initial state check ONCE upon successful subscription.
      supabase.from('stream_lock').select('*').eq('user_id', session.user.id).maybeSingle().then(({ data }) => {
          if (!data) setState({ lockStatus: 'AVAILABLE' });
          else if (data.status === 'LOCKED' && data.locked_by_device_id !== getAuth().deviceId) setState({ lockStatus: 'LOCKED_BY_OTHER'});
          else setState({ lockStatus: 'AVAILABLE'});
      });
    } else if (err) {
      console.error('CRITICAL SUBSCRIPTION ERROR:', err);
      setState({ lockStatus: 'ERROR' });
    }
  });
};

export const unsubscribeFromLock = () => {
  if (channel) {
    console.log('UNSUBSCRIBING SINGLETON CHANNEL.');
    supabase.removeChannel(channel);
    channel = null;
  }
};