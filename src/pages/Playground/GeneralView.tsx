import { useState, useEffect } from 'react';
import { useEnvStore } from '../../store/envStore';
import { useApiStore } from '../../store/apiStore';
import type { Profile } from '../../types/playlist';
import { ConnectionStatus } from './components/ConnectionStatus';
import { DataSyncPanel } from './components/DataSyncPanel';
import { FiCpu, FiHardDrive, FiMonitor, FiLoader } from 'react-icons/fi';

export const GeneralView = () => {
  const device = useEnvStore(state => state.device);
  const engine = useEnvStore(state => state.engine);
  const mode = useEnvStore(state => state.mode);
  const { xtreamApi } = useApiStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!xtreamApi) {
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }
      setIsLoadingProfile(true);
      const profileData = await xtreamApi.getProfile();
      setProfile(profileData as Profile);
      setIsLoadingProfile(false);
    };
    fetchProfile();
  }, [xtreamApi]);

  // Loading and Error states are now handled within the main layout
  if (isLoadingProfile) {
    return (
      <div className="p-4 sm:p-8">
        <div className="p-6 bg-background-secondary rounded-lg border border-border-primary text-text-tertiary flex items-center gap-2">
          <FiLoader className="animate-spin" />
          Initializing Xtream Connection...
        </div>
      </div>
    );
  }

  if (!xtreamApi) {
    return (
       <div className="p-4 sm:p-8">
         <div className="p-6 bg-background-secondary rounded-lg border border-border-primary text-error">
           No active Xtream connection. Select a valid playlist from the header.
         </div>
       </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      
      {/* --- ROW 1: DATA SYNC (TOP) --- */}
      <DataSyncPanel />

      {/* --- ROW 2: TWO-COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMN 1: Connection Status */}
        <ConnectionStatus profile={profile} />

        {/* COLUMN 2: System Diagnostics */}
        <div className="p-6 bg-background-secondary rounded-lg border border-border-primary">
           <h2 className="text-xl font-bold mb-4">System Diagnostics</h2>
           <div className="space-y-3 text-sm">
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <FiMonitor className="text-text-tertiary" />
                 <span className="text-text-secondary">Device:</span>
               </div>
               <span className="font-mono">{device}</span>
             </div>
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <FiCpu className="text-text-tertiary" />
                 <span className="text-text-secondary">Engine:</span>
               </div>
               <span className="font-mono">{engine}</span>
             </div>
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <FiHardDrive className="text-text-tertiary" />
                 <span className="text-text-secondary">Mode:</span>
               </div>
               <span className="font-mono">{mode}</span>
             </div>

           </div>
        </div>
      </div>
    </div>
  );
};