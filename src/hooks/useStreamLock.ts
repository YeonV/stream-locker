/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { RealtimeChannel } from '@supabase/supabase-js';
import { forceFocus } from 'tauri-plugin-videoplayer-api';

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
      usePlayerStore.getState().stopStream();
      releaseLock();
    }
  }, [releaseLock]);

  const forceRelease = useCallback(async () => {
    if (!useAuthStore.getState().session) return;
    
    if (import.meta.env.VITE_APK) {
      // NOTE: Replace this with your app's actual main activity class name.
      const mainActivityClassName = "com.streamlocker.app.MainActivity";
      await forceFocus(mainActivityClassName);
    } else {
      console.log('Invoking release-stream-lock to force release...');
      // NOTE: This assumes your edge function can handle a forced release.
      // You may need to create a new `force-release-lock` function as we brainstormed.
      await supabase.functions.invoke('release-stream-lock', {
        body: { force: true, releasingDeviceId: deviceId },
      });
    }
  }, [deviceId]);

  // --- Realtime Subscription Effect ---
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
          console.log(`[${myInstanceId}] I was requesting and I won the lock!`);
          setLockStatus('ACQUIRED');
        } else {
          if (myCurrentStatus !== 'ACQUIRED') {
            console.log(`[${myInstanceId}] Another instance acquired the lock.`);
            setLockStatus('LOCKED_BY_OTHER');
          }
        }
      } else if (lockData.status === 'AWAITING_RELEASE') {
        if (lockData.locked_by_device_id === myDeviceId && usePlayerStore.getState().lockAcquiredByInstanceId === myInstanceId) {
          console.log(`[${myInstanceId}] Commanded to release lock.`);
          setLockStatus('AWAITING_MY_RELEASE');
        }
      } else if (lockData.status === 'AVAILABLE') {
        console.log(`[${myInstanceId}] Lock is now available.`);
        usePlayerStore.getState().stopStream();
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
        supabase.from('stream_lock').select('status').eq('user_id', session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data?.status === 'LOCKED' || data?.status === 'AWAITING_RELEASE') {
              setLockStatus('AVAILABLE');
            } else {
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

  // --- Automatic Release Effect ---
  useEffect(() => {
    if (lockStatus === 'AWAITING_MY_RELEASE') {
      const currentStream = usePlayerStore.getState().currentStreamUrl;
      if (currentStream) {
        console.log('Hook is stopping stream due to AWAITING_MY_RELEASE');
        usePlayerStore.getState().stopStream();
      }
      releaseLock();
    }
  }, [lockStatus, releaseLock]); // <-- CRITICAL FIX: Added releaseLock to dependency array

  // --- "TRIPWIRE" EFFECT ---
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