import { useState } from 'react';
import { FiLoader, FiRefreshCw, FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';
import { useDataStore } from '../../../store/dataStore';
import { useApiStore } from '../../../store/apiStore';

interface DataSyncPanelProps {
  defaultExpanded?: boolean;
}

export const DataSyncPanel = ({ defaultExpanded = false }: DataSyncPanelProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { lastUpdated, setLastUpdated, setMovies, setSeries, setLiveStreams, setMoviesCategories, setSeriesCategories, setLiveCategories, movies, series, liveStreams, moviesCategories, seriesCategories, liveCategories, syncProgress, updateSyncItemProgress } = useDataStore();
  const { xtreamApi } = useApiStore();

  const handleSyncItem = async (item: string) => {
    if (!xtreamApi) return;
    
    updateSyncItemProgress(item, true);
    const timestamp = new Date().toLocaleString();
    
    try {
      switch (item) {
        case 'movies':
          setMovies(await xtreamApi.getMoviesStreams('all'));
          break;
        case 'series':
          setSeries(await xtreamApi.getSeries());
          break;
        case 'liveStreams':
          setLiveStreams(await xtreamApi.getLiveStreams('all'));
          break;
        case 'moviesCategories':
          setMoviesCategories(await xtreamApi.getMoviesCategories());
          break;
        case 'seriesCategories':
          setSeriesCategories(await xtreamApi.getSeriesCategories());
          break;
        case 'liveCategories':
          setLiveCategories(await xtreamApi.getLiveCategories());
          break;
      }
      updateSyncItemProgress(item, false, timestamp);
    } catch (error) {
      console.error(`Sync failed for ${item}:`, error);
      updateSyncItemProgress(item, false);
    }
  };

  const handleDownloadJson = (item: string) => {
    let data: unknown;
    let filename: string;
    
    switch (item) {
      case 'movies':
        data = movies;
        filename = 'movies.json';
        break;
      case 'series':
        data = series;
        filename = 'series.json';
        break;
      case 'liveStreams':
        data = liveStreams;
        filename = 'live-streams.json';
        break;
      case 'moviesCategories':
        data = moviesCategories;
        filename = 'movies-categories.json';
        break;
      case 'seriesCategories':
        data = seriesCategories;
        filename = 'series-categories.json';
        break;
      case 'liveCategories':
        data = liveCategories;
        filename = 'live-categories.json';
        break;
      default:
        return;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`No data available for ${item}`);
      return;
    }

    // Create and download the JSON file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    if (!xtreamApi) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        handleSyncItem('movies'),
        handleSyncItem('series'),
        handleSyncItem('liveStreams'),
        handleSyncItem('moviesCategories'),
        handleSyncItem('seriesCategories'),
        handleSyncItem('liveCategories'),
      ]);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Full sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncItems = [
    { key: 'movies', label: 'Movies', icon: '🎬' },
    { key: 'series', label: 'Series', icon: '📺' },
    { key: 'liveStreams', label: 'Live Streams', icon: '📡' },
    { key: 'moviesCategories', label: 'Movie Categories', icon: '🏷️' },
    { key: 'seriesCategories', label: 'Series Categories', icon: '🏷️' },
    { key: 'liveCategories', label: 'Live Categories', icon: '🏷️' },
  ];

  if (!xtreamApi) {
    return null; // Don't render if no API
  }

  return (
    <div className="p-6 bg-background-secondary rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Data Sync</h2>
          <p className="text-xs text-text-tertiary mt-1">Last Updated: {lastUpdated || 'Never'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary hover:bg-background-glass rounded-md transition-colors"
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
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

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {syncItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-background-primary rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <h3 className="font-medium text-text-primary">{item.label}</h3>
                  <p className="text-xs text-text-tertiary">
                    {syncProgress[item.key].lastUpdated 
                      ? `Last synced: ${syncProgress[item.key].lastUpdated}`
                      : 'Never synced'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {syncProgress[item.key].isLoading && (
                  <FiLoader className="animate-spin text-primary" />
                )}
                <button
                  onClick={() => handleSyncItem(item.key)}
                  disabled={syncProgress[item.key].isLoading || isSyncing}
                  className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-primary hover:bg-background-glass rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Sync ${item.label}`}
                >
                  <FiRefreshCw />
                </button>
                <button
                  onClick={() => handleDownloadJson(item.key)}
                  disabled={!syncProgress[item.key].lastUpdated}
                  className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-primary hover:bg-background-glass rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Download ${item.label} as JSON`}
                >
                  <FiDownload />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

