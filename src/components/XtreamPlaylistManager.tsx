import { useState, useEffect } from 'react';
import type { XtreamPlaylist, Movie, Serie, LiveStream, Category, Profile } from '../types/playlist';
import { ProfileInfo } from '../pages/Playground/components/ProfileInfo';
import { FiTrash2, FiLoader } from 'react-icons/fi';
import { useDataStore } from '../store/dataStore';
import { useApiStore } from '../store/apiStore';

interface XtreamPlaylistManagerProps {
  playlist: XtreamPlaylist;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export const XtreamPlaylistManager = ({ playlist, onDelete, isLoading }: XtreamPlaylistManagerProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { lastUpdated, setLastUpdated, setMovies, setSeries, setLiveStreams, setMoviesCategories, setSeriesCategories, setLiveCategories } = useDataStore();

  // --- THIS IS THE NEW LOGIC ---
  // Get the shared API instance and the functions to control it from the global store.
  const { xtreamApi } = useApiStore();

  // This effect now reacts to changes in the global `xtreamApi` instance.
  useEffect(() => {
    const fetchProfile = async () => {
      if (!xtreamApi) {
        setProfile(null);
        return;
      }
      setProfile(null); // Set to null while loading new profile
      const profileData = await xtreamApi.getProfile();
      setProfile(profileData as Profile);
    };
    fetchProfile();
  }, [xtreamApi]);

  const handleSync = async () => {
    // The guard checks the global instance.
    if (!xtreamApi) {
      alert("Cannot sync: Playlist credentials are invalid.");
      return;
    }
    setIsSyncing(true);

    try {
      console.log('Starting full sync...');
      const [
        movies,
        seriesData,
        live,
        movieCats,
        seriesCats,
        liveCats
      ] = await Promise.all([
        xtreamApi.getMoviesStreams('all'),
        xtreamApi.getSeries(),
        xtreamApi.getLiveStreams('all'),
        xtreamApi.getMoviesCategories(),
        xtreamApi.getSeriesCategories(),
        xtreamApi.getLiveCategories(),
      ]);

      setMovies(movies as Movie[]);
      setSeries(seriesData as Serie[]);
      setLiveStreams(live as LiveStream[]);
      setMoviesCategories(movieCats as Category[]);
      setSeriesCategories(seriesCats as Category[]);
      setLiveCategories(liveCats as Category[]);

      console.log(`Sync complete.`);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Full sync failed:", error);
      alert("An error occurred during the sync process.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-20 text-center py-0.5 text-xs font-semibold rounded-full bg-green-600">
              XTREAM
            </span>
            <h3 className="text-xl font-bold">{playlist.name}</h3>
          </div>
          <p className="text-sm text-gray-400">{playlist.serverUrl}</p>
        </div>
        {onDelete && <button onClick={() => onDelete(playlist.id)} disabled={isLoading} className="cursor-pointer p-2 text-gray-400 hover:bg-red-500 hover:text-white rounded-full">
          <FiTrash2 size={18} />
        </button>}
      </div>

      {!xtreamApi ? (
        <div className="mt-4 border-t border-gray-700 pt-4 text-red-400">Invalid Playlist Configuration.</div>
      ) : profile ? (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <ProfileInfo profile={profile} />

          {profile.user_info.status === 'Active' && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">Data Sync</h4>
                  <p className="text-xs text-gray-400">Last Updated: {lastUpdated || 'Never'}</p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm bg-${lastUpdated !== null ? 'green' : 'blue'}-600 rounded-md font-semibold disabled:bg-gray-500 cursor-pointer hover:bg-${lastUpdated !== null ? 'green' : 'blue'}-700`}
                >
                  {isSyncing ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <span>{lastUpdated !== null ? 'Re-' : ''}Sync All Data</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-gray-700 pt-4 text-gray-400">Loading profile...</div>
      )}
    </div>
  );
};