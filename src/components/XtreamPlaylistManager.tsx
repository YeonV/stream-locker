import { useState, useEffect } from 'react';
import type { Profile } from '../types/playlist';
import { ProfileInfo } from '../pages/Playground/components/ProfileInfo';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import { useDataStore } from '../store/dataStore';
import { useApiStore } from '../store/apiStore';

export const XtreamPlaylistManager = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { lastUpdated, setLastUpdated, setMovies, setSeries, setLiveStreams, setMoviesCategories, setSeriesCategories, setLiveCategories } = useDataStore();

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

  const handleSync = async () => {
    if (!xtreamApi) return;
    setIsSyncing(true);

    try {
      // We no longer need Promise.all as it hides individual failures.
      // Fetching one by one gives better debuggability.
      setMovies(await xtreamApi.getMoviesStreams('all'));
      setSeries(await xtreamApi.getSeries());
      setLiveStreams(await xtreamApi.getLiveStreams('all'));
      setMoviesCategories(await xtreamApi.getMoviesCategories());
      setSeriesCategories(await xtreamApi.getSeriesCategories());
      setLiveCategories(await xtreamApi.getLiveCategories());
      
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Full sync failed:", error);
      // We can add a user-facing error message here in the future
    } finally {
      setIsSyncing(false);
    }
  };

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

      {profile.user_info.status === 'Active' && (
        <div className="mt-4 p-4 bg-background-secondary rounded-lg border border-border-primary">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg text-text-primary">Data Sync</h4>
              <p className="text-xs text-text-tertiary">Last Updated: {lastUpdated || 'Never'}</p>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              // Themed button classes using our theme variables
              className="flex items-center justify-center gap-2 w-36 h-10 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-hover disabled:bg-background-glass disabled:text-text-tertiary disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <FiRefreshCw />
                  <span>{lastUpdated ? 'Re-Sync' : 'Sync All'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};