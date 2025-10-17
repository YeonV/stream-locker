import { FiTrash2 } from 'react-icons/fi';
import type { Playlist, XtreamPlaylist } from '../types/playlist';
import { XtreamPlaylistManager } from './XtreamPlaylistManager'; // Import our new component

// This is your excellent type guard. It stays exactly the same.
function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

interface PlaylistDisplayProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const PlaylistDisplay = ({ playlist, onDelete, isLoading }: PlaylistDisplayProps) => {
  // --- THIS IS THE NEW LOGIC ---
  // If it's an Xtream playlist, we now render our powerful manager component.
  if (isXtreamPlaylist(playlist)) {
    return <XtreamPlaylistManager playlist={playlist} onDelete={onDelete} isLoading={isLoading} />;
  }
  // --- END OF NEW LOGIC ---


  // --- THIS IS YOUR ORIGINAL, SUPERIOR M3U DISPLAY LOGIC ---
  // It is preserved perfectly for all non-Xtream playlists.
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
      <div className="flex-1 min-w-0"> {/* min-w-0 for truncation */}
        <div className="flex items-center space-x-2">
          <span className="w-20 text-center py-0.5 text-xs font-semibold rounded-full bg-green-600">
            M3U
          </span>
          <p className="font-semibold text-white truncate">{playlist.name}</p>
        </div>
        <p className="mt-1 text-sm text-gray-400 truncate">{playlist.url}</p>
      </div>
      <button onClick={() => onDelete(playlist.id)} disabled={isLoading} className="cursor-pointer p-2 text-gray-400 hover:bg-red-500 hover:text-white rounded-full">
        <FiTrash2 size={18} />
      </button>
    </div>
  );
};

export default PlaylistDisplay;