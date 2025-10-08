import { create } from 'zustand'
import { type Session } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

interface AuthState {
  session: Session | null
  loading: boolean 
  deviceId: string
  instanceId: string;
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  getDeviceId: () => string
  getInstanceId: () => string;
}

// Function to get or create the deviceId from localStorage
const initializeDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

const initializeInstanceId = (): string => {
  let instanceId = sessionStorage.getItem('instanceId');
  if (!instanceId) {
    instanceId = uuidv4();
    sessionStorage.setItem('instanceId', instanceId);
  }
  return instanceId;
};


export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: true,
  deviceId: initializeDeviceId(),
  instanceId: initializeInstanceId(),
  setSession: (session) => set({ session, loading: false }), // Set loading to false when session is known
  setLoading: (loading) => set({ loading }),
  getDeviceId: () => get().deviceId,
  getInstanceId: () => get().instanceId,
}))