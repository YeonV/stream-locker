import { create } from 'zustand';
import { arch, type, exeExtension } from '@tauri-apps/plugin-os';

// Your perfect Device type
export type Device = 'linux' | 'windows' | 'macos' | 'ios' | 'android' | 'androidtv' | 'firetv' | 'unknown' | 'web';

// The shape of our intelligence report
export interface EnvState {
  arch: string | null;
  device: Device;
  exeExtension: string | null;
  mode: 'development' | 'production';
  engine: 'native' | 'web';
  isInitialized: boolean;
  initializeEnv: () => Promise<void>; // The one-time action
}

export const useEnvStore = create<EnvState>((set, get) => ({
  // Initial placeholder state
  arch: null,
  device: 'unknown',
  exeExtension: null,
  mode: import.meta.env.DEV ? 'development' : 'production',
  engine: 'web', // Default to web until initialized
  isInitialized: false,

  // This is the "Spartan Strike" logic, now an action in our store.
  initializeEnv: async () => {
    // Prevent re-initialization
    if (get().isInitialized) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__TAURI__) {
      // --- NATIVE LOGIC ---
      const osType = await type();
      const osArch = await arch();
      const osExeExtension = await exeExtension();
      
      let specificDevice: Device = 'unknown';
      if (osType === 'android') {
        const userAgent = navigator.userAgent.toLowerCase();
        specificDevice = (userAgent.includes('tv') || userAgent.includes('aftkm')) 
          ? (userAgent.includes('firetv') ? 'firetv' : 'androidtv') 
          : 'android';
      } else {
        specificDevice = osType as Device;
      }
      
      set({
        arch: osArch,
        device: specificDevice,
        exeExtension: osExeExtension,
        engine: 'native',
        isInitialized: true,
      });

    } else {
      // --- WEB LOGIC ---
      const userAgent = navigator.userAgent.toLowerCase();
      let specificDevice: Device = 'unknown';
      if (userAgent.includes('windows')) specificDevice = 'windows';
      else if (userAgent.includes('macintosh')) specificDevice = 'macos';
      else if (userAgent.includes('linux')) specificDevice = 'linux';
      else if (userAgent.includes('iphone') || userAgent.includes('ipad')) specificDevice = 'ios';
      else if (userAgent.includes('android')) {
        specificDevice = (userAgent.includes('tv') || userAgent.includes('firetv')) 
          ? (userAgent.includes('firetv') ? 'firetv' : 'androidtv') 
          : 'android';
      } else {
        specificDevice = 'web'; // Final fallback for web
      }

      set({
        arch: null, // Not available in web
        device: specificDevice,
        exeExtension: null, // Not available in web
        engine: 'web',
        isInitialized: true,
      });
    }

    // Log the final, stored state for confirmation
    // console.log("Global Env Initialized:", useEnvStore.getState());
  },
}));