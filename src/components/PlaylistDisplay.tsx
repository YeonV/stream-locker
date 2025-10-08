import type { Playlist, XtreamPlaylist } from '../types/playlist';

// This is a Type Guard. It's a special function that returns a boolean
// AND informs TypeScript about the type if it returns true.
function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

interface PlaylistDisplayProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const PlaylistDisplay = ({ playlist, onDelete, isLoading }: PlaylistDisplayProps) => {
  // Use the type guard to determine which properties are available
  const displayUrl = isXtreamPlaylist(playlist) ? playlist.serverUrl : playlist.url;
  const playlistTypeLabel = isXtreamPlaylist(playlist) ? 'Xtream' : 'M3U';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
      <div className="flex-1 min-w-0"> {/* Add min-w-0 to allow truncation */}
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isXtreamPlaylist(playlist) ? 'bg-purple-600' : 'bg-green-600'}`}>
            {playlistTypeLabel}
          </span>
          <p className="font-semibold text-white truncate">{playlist.name}</p>
        </div>
        <p className="mt-1 text-sm text-gray-400 truncate">{displayUrl}</p>
      </div>
      <button
        onClick={() => onDelete(playlist.id)}
        disabled={isLoading}
        className="ml-4 px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 shrink-0"
      >
        Delete
      </button>
    </div>
  );
};

export default PlaylistDisplay;