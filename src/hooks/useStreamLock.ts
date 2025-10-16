/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { RealtimeChannel } from '@supabase/supabase-js';
// import { forceFocus } from 'tauri-plugin-videoplayer-api';

interface StreamLockData {
  user_id: string;
  status: 'AVAILABLE' | 'LOCKED' | 'AWAITING_RELEASE';
  locked_by_device_id: string | null;
  requested_by_device_id: string | null;
}

export const useStreamLock = () => {
  const { session, deviceId } = useAuthStore();
  const { setLockStatus, lockStatus } = usePlayerStore();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // --- Edge Function Invokers ---

  // Wrapped requestLock in useCallback for consistency and stability
  const requestLock = useCallback(async () => {
    if (!session) return;
    setLockStatus('REQUESTING');
    const { error } = await supabase.functions.invoke('request-stream-lock', {
      body: { requestingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error requesting lock:", error);
      setLockStatus('ERROR');
    }
  }, [session, deviceId, setLockStatus]);

  const releaseLock = useCallback(async () => {
    if (!session) return;
    setLockStatus('RELEASING');
    const { error } = await supabase.functions.invoke('release-stream-lock', {
      body: { releasingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error releasing lock:", error);
      setLockStatus('ERROR');
    }
  }, [session, deviceId, setLockStatus]);

  const stopAndRelease = useCallback(() => {
    if (usePlayerStore.getState().lockStatus === 'ACQUIRED') {
      console.log('User initiated stop. Stopping stream and releasing lock.');
      // 1. First, stop the player UI. This no longer changes the lock status.
      usePlayerStore.getState().stopStream();
      // 2. THEN, call the function that correctly sets the status to 'RELEASING' and talks to the backend.
      releaseLock();
    }
  }, [releaseLock]);

  // ... (forceRelease and all useEffects are correct as you have them) ...

  // I will include the full, correct file just in case.
  const forceRelease = useCallback(async () => {
    if (!useAuthStore.getState().session) return;
    if (import.meta.env.VITE_APK) {
      // const mainActivityClassName = "com.yeonv.stream_locker.MainActivity";
      // await forceFocus(mainActivityClassName);
    } else {
      console.log('Requesting lock to force a takeover...');
      requestLock(); // Re-using requestLock is safer than a new edge function
    }
  }, [requestLock]);

useEffect(() => {
    if (!session) return;
    if (channelRef.current) return;

    const handleLockUpdate = (payload: { new: StreamLockData }) => {
      const lockData = payload.new;
      const myDeviceId = useAuthStore.getState().deviceId;
      const myInstanceId = useAuthStore.getState().instanceId;
      const myCurrentStatus = usePlayerStore.getState().lockStatus;

      console.log(`[${myInstanceId}] Realtime Update:`, lockData);

      if (lockData.status === 'LOCKED') {
        if (lockData.locked_by_device_id === myDeviceId && myCurrentStatus === 'REQUESTING') {
          setLockStatus('ACQUIRED');
        } else {
          // --- THIS IS THE CRITICAL FIX (Part 1) ---
          if (myCurrentStatus !== 'LOCKED_BY_OTHER') {
             console.log(`[${myInstanceId}] Another instance acquired the lock. Stopping local player.`);
             // 1. Explicitly stop the player to clear the URL
             usePlayerStore.getState().stopStream(); 
             // 2. Then set the correct status
             setLockStatus('LOCKED_BY_OTHER');
          }
        }
      } else if (lockData.status === 'AWAITING_RELEASE') {
        if (lockData.locked_by_device_id === myDeviceId && usePlayerStore.getState().lockAcquiredByInstanceId === myInstanceId) {
          setLockStatus('AWAITING_MY_RELEASE');
        }
      } else if (lockData.status === 'AVAILABLE') {
        // --- THIS IS THE CRITICAL FIX (Part 2) ---
        console.log(`[${myInstanceId}] Lock is now available.`);
        // 1. Explicitly stop the player to clear the URL
        usePlayerStore.getState().stopStream();
        // 2. Then set the correct status
        setLockStatus('AVAILABLE');
      }
    };

    const channel = supabase.channel(`stream-lock-${session.user.id}`);
    channelRef.current = channel;

    channel.on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: 'stream_lock', filter: `user_id=eq.${session.user.id}` },
      handleLockUpdate
    ).subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to stream lock channel!');
        supabase.from('stream_lock').select('*').eq('user_id', session.user.id).maybeSingle()
          .then(({ data }) => {
              if (!data) {
                // No lock exists, so it's available
                setLockStatus('AVAILABLE');
                return;
              }

              if (data.status === 'LOCKED' || data.status === 'AWAITING_RELEASE') {
                // The lock is busy. Check if it's us from a previous crashed session.
                if (data.locked_by_device_id === useAuthStore.getState().deviceId) {
                  // It's our lock, but we just started the app. This is a stale lock.
                  // The safest thing is to release it.
                  console.log('Detected stale lock from this device. Releasing...');
                  releaseLock(); // releaseLock will eventually set state to AVAILABLE
                } else {
                  // It's locked by someone else. Correctly reflect this.
                  setLockStatus('LOCKED_BY_OTHER');
                }
              } else {
                // The status is AVAILABLE or something else, so we are available.
                setLockStatus('AVAILABLE');
              }
          });

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Subscription Error:', err);
        setLockStatus('ERROR');
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('Unsubscribed from stream lock channel.');
      }
    };
  }, [session, setLockStatus]);

  // --- Heartbeat Effect ---
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (usePlayerStore.getState().lockStatus === 'ACQUIRED' && useAuthStore.getState().session) {
        const currentSession = useAuthStore.getState().session;
        const currentDeviceId = useAuthStore.getState().deviceId;
        supabase.from('stream_lock')
          .update({ last_heartbeat_at: new Date().toISOString() })
          .eq('user_id', currentSession?.user.id)
          .eq('locked_by_device_id', currentDeviceId)
          .then();
        console.log('Sent heartbeat');
      }
    }, 8000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  // This effect also needs the `releaseLock` dependency now.
  useEffect(() => {
    if (lockStatus === 'AWAITING_MY_RELEASE') {
      if (usePlayerStore.getState().currentStreamUrl) {
        usePlayerStore.getState().stopStream();
      }
      releaseLock();
    }
  }, [lockStatus, releaseLock]);

    useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && usePlayerStore.getState().isNativePlayerActive) {
        console.log('[Tripwire] Webview became visible, assuming native player closed. Releasing lock.');
        stopAndRelease();
        usePlayerStore.getState().setIsNativePlayerActive(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopAndRelease]);

  return {
    requestLock,
    releaseLock,
    stopAndRelease,
    forceRelease,
    lockStatus,
  };
};