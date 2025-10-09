import { useEffect, useRef } from 'react' // Import useRef
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { RealtimeChannel } from '@supabase/supabase-js'

interface StreamLockData {
  user_id: string
  status: 'AVAILABLE' | 'LOCKED' | 'AWAITING_RELEASE'
  locked_by_device_id: string | null
  requested_by_device_id: string | null
}

export const useStreamLock = () => {
  const { session, deviceId } = useAuthStore()
  const { setLockStatus, lockStatus } = usePlayerStore()

  // Use a ref to hold the channel so we can access it in the cleanup function
  const channelRef = useRef<RealtimeChannel | null>(null);

  // --- Edge Function Invokers ---
const requestLock = async () => {
    if (!session) return;
    setLockStatus('REQUESTING');
    // No more sessionStorage! We just set our internal state.
    const { error } = await supabase.functions.invoke('request-stream-lock', {
      body: { requestingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error requesting lock:", error);
      setLockStatus('ERROR');
    }
  };

  const releaseLock = async () => {
    if (!session) return;
    setLockStatus('RELEASING');
    const { error } = await supabase.functions.invoke('release-stream-lock', {
      body: { releasingDeviceId: deviceId },
    });
    if (error) {
      console.error("Error releasing lock:", error);
      setLockStatus('ERROR');
    }
  };

    const stopAndRelease = () => {
    // Only do something if we are actually streaming
    if (usePlayerStore.getState().lockStatus === 'ACQUIRED') {
      console.log('User initiated stop. Stopping stream and releasing lock.');
      // 1. Stop the player in the UI
      usePlayerStore.getState().stopStream(); 
      // 2. Tell the backend we are done
      releaseLock();
    }
  };

  // --- Realtime Subscription Effect ---
  useEffect(() => {
    // Exit if there's no active session
    if (!session) return;

    // Prevent creating duplicate channels
    if (channelRef.current) return;

const handleLockUpdate = (payload: { new: StreamLockData }) => {
  const lockData = payload.new;

  const myDeviceId = useAuthStore.getState().deviceId;
  const myInstanceId = useAuthStore.getState().instanceId;
  const myCurrentStatus = usePlayerStore.getState().lockStatus;   
  // const requestingInstanceId = sessionStorage.getItem('requestingInstanceId');

  console.log(`[${myInstanceId}] Realtime Update:`, lockData);

  // Case A: Lock is busy
  if (lockData.status === 'LOCKED') {
        // Did WE get the lock?
        if (lockData.locked_by_device_id === myDeviceId && myCurrentStatus === 'REQUESTING') {
          console.log(`[${myInstanceId}] I was requesting and I won the lock!`);
          setLockStatus('ACQUIRED');
        } 
        // Did someone else get the lock?
        else {
          // If our current state isn't ACQUIRED, we mark it as locked by other.
          // This prevents a tab that already holds the lock from demoting itself.
          if (myCurrentStatus !== 'ACQUIRED') {
             console.log(`[${myInstanceId}] Another instance acquired the lock.`);
             setLockStatus('LOCKED_BY_OTHER');
          }
        }
      }
      // Case 2: A handover is being requested.
      else if (lockData.status === 'AWAITING_RELEASE') {
        // Is it US who needs to release the lock? We only act if we are the one currently playing.
        if (lockData.locked_by_device_id === myDeviceId && usePlayerStore.getState().lockAcquiredByInstanceId === myInstanceId) {
          console.log(`[${myInstanceId}] Commanded to release lock.`);
          setLockStatus('AWAITING_MY_RELEASE');
        }
      }
      // Case 3: The lock is free.
      else if (lockData.status === 'AVAILABLE') {
        console.log(`[${myInstanceId}] Lock is now available.`);
        // Reset our instance tracking when the lock becomes globally free
        usePlayerStore.getState().stopStream(); 
        setLockStatus('AVAILABLE');
      }
    
};



    
    // Create the channel instance
    const channel = supabase.channel(`stream-lock-${session.user.id}`);
    channelRef.current = channel; // Store it in the ref

    channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'stream_lock',
          filter: `user_id=eq.${session.user.id}`,
        },
        handleLockUpdate
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to stream lock channel!');
          // Now that we are subscribed, we can safely set the initial state.
          // Let's query the current state to be sure.
          supabase.from('stream_lock').select('status').eq('user_id', session.user.id).maybeSingle()
            .then(({ data }) => {
                if (data?.status === 'LOCKED' || data?.status === 'AWAITING_RELEASE') {
                    // Another device might already be streaming, let's request the lock.
                    // Or more safely, just reflect the 'available' status and let the user click.
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
    
    // Cleanup function to remove the channel and subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('Unsubscribed from stream lock channel.');
      }
    };
  }, [session, setLockStatus]); // Removed deviceId from deps to prevent re-subscriptions
  
  // --- Heartbeat Effect ---
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      // Use getState to avoid re-triggering the effect when lockStatus changes
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
  }, []); // Run this effect only once

  // --- Automatic Release Effect ---
  useEffect(() => {
    if (lockStatus === 'AWAITING_MY_RELEASE') {
      // The Player.tsx component is responsible for stopping the stream
      // Once stopped, it calls releaseLock()
      // Let's add the logic to stop here to be safe
      const currentStream = usePlayerStore.getState().currentStreamUrl;
      if (currentStream) {
        console.log('Hook is stopping stream due to AWAITING_MY_RELEASE');
        usePlayerStore.getState().stopStream();
      }
      releaseLock();
    }
  }, [lockStatus]);

  return {
    requestLock,
    // : async () => {
    //   if (!session) return;
    //   const currentInstanceId = useAuthStore.getState().instanceId; // Get fresh instanceId
    //   const currentDeviceId = useAuthStore.getState().deviceId;
    //   setLockStatus('REQUESTING');
    //   sessionStorage.setItem('requestingInstanceId', currentInstanceId); 
    //   const { error } = await supabase.functions.invoke('request-stream-lock', {
    //     body: { requestingDeviceId: currentDeviceId },
    //   });
    //   if (error) {
    //     console.error("Error requesting lock:", error);
    //     setLockStatus('ERROR');
    //     sessionStorage.removeItem('requestingInstanceId'); // Clean up on error
    //   }
    // },
    releaseLock,
    stopAndRelease,
    lockStatus, // Expose lockStatus for components that might need it
  };
};