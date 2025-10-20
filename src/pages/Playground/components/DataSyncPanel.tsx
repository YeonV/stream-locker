import { useState } from 'react';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import { useDataStore } from '../../../store/dataStore';
import { useApiStore } from '../../../store/apiStore';

export const DataSyncPanel = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { lastUpdated, setLastUpdated, setMovies, setSeries, setLiveStreams, setMoviesCategories, setSeriesCategories, setLiveCategories } = useDataStore();
  const { xtreamApi } = useApiStore();

  const handleSync = async () => {
    if (!xtreamApi) return;
    setIsSyncing(true);
    try {
      setMovies(await xtreamApi.getMoviesStreams('all'));
      setSeries(await xtreamApi.getSeries());
      setLiveStreams(await xtreamApi.getLiveStreams('all'));
      setMoviesCategories(await xtreamApi.getMoviesCategories());
      setSeriesCategories(await xtreamApi.getSeriesCategories());
      setLiveCategories(await xtreamApi.getLiveCategories());
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Full sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!xtreamApi) {
    return null; // Don't render if no API
  }

  return (
    <div className="p-6 bg-background-secondary rounded-lg border border-border-primary">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Data Sync</h2>
          <p className="text-xs text-text-tertiary mt-1">Last Updated: {lastUpdated || 'Never'}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 w-36 h-10 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-hover disabled:bg-background-glass disabled:text-text-tertiary disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <><FiLoader className="animate-spin" /><span>Syncing...</span></>
          ) : (
            <><FiRefreshCw /><span>{lastUpdated ? 'Re-Sync' : 'Sync All'}</span></>
          )}
        </button>
      </div>
    </div>
  );
};

