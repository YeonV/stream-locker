import { useState, useEffect } from 'react';
import type { Profile } from '../types/playlist';
import { ProfileInfo } from '../pages/Playground/components/ProfileInfo';
import { FiLoader } from 'react-icons/fi';
import { useApiStore } from '../store/apiStore';
import { DataSyncPanel } from '../pages/Playground/components/DataSyncPanel';

export const XtreamPlaylistManager = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const { xtreamApi } = useApiStore();

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

  if (isLoadingProfile) {
    return (
      <div className="p-4 border-t border-border-primary text-text-tertiary flex items-center gap-2">
        <FiLoader className="animate-spin" />
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 border-t border-border-primary text-error">
        Invalid Playlist Configuration. Could not load profile.
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border-primary">
      <ProfileInfo profile={profile} />

      {profile.user_info.status === 'Active' && <div className="mt-4"><DataSyncPanel defaultExpanded={true} /></div>}
    </div>
  );
};